import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Truck, Package, Plus } from 'lucide-react'
import { AddLotForm } from '@/components/arrivals/add-lot-form'
import { unwrapRelation } from '@/lib/utils'

interface ArrivalDetailPageProps {
  params: Promise<{ id: string }>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function getArrival(id: string) {
  const supabase = await createClient()

  const { data: arrival } = await supabase
    .from('arrivals')
    .select(`
      *,
      farmer:farmers(*),
      lots(
        id,
        quantity,
        remaining_quantity,
        rate,
        item:items(id, name, unit)
      )
    `)
    .eq('id', id)
    .single()

  if (!arrival) return null

  const farmer = unwrapRelation(
    arrival.farmer as { name: string; phone: string | null } | { name: string; phone: string | null }[] | null
  )

  const rawLots = (arrival.lots ?? []) as Array<{
    id: string
    quantity: number
    remaining_quantity: number
    rate: number | null
    item: { id: string; name: string; unit: string } | { id: string; name: string; unit: string }[] | null
  }>
  const lots = rawLots.map((lot) => ({
    ...lot,
    item: unwrapRelation(lot.item),
  }))

  const { data: items } = await supabase
    .from('items')
    .select('id, name, unit')
    .order('name')

  // Get sales for this arrival's lots
  const lotIds = (arrival.lots as { id: string }[])?.map(l => l.id) || []
  let sales: { lot_id: string; quantity: number; total_amount: number; buyer: { name: string } | null }[] = []

  if (lotIds.length > 0) {
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        lot_id,
        quantity,
        total_amount,
        buyer:buyers(name)
      `)
      .in('lot_id', lotIds)

    sales = (salesData || []).map((s) => ({
      lot_id: s.lot_id as string,
      quantity: Number(s.quantity),
      total_amount: Number(s.total_amount),
      buyer: unwrapRelation(
        s.buyer as { name: string } | { name: string }[] | null
      ),
    }))
  }

  return { arrival, items: items || [], sales, farmer, lots }
}

export default async function ArrivalDetailPage({ params }: ArrivalDetailPageProps) {
  const { id } = await params
  const data = await getArrival(id)

  if (!data) {
    notFound()
  }

  const { arrival, items, sales, farmer, lots } = data

  // Calculate totals
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const soldQuantity = lots.reduce((sum, lot) => sum + (lot.quantity - lot.remaining_quantity), 0)
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{farmer?.name}</h1>
            <p className="text-muted-foreground">
              Arrival on {new Date(arrival.arrival_date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/dashboard/sales/new?arrival=${arrival.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vehicle</CardDescription>
            <CardTitle className="text-xl">{arrival.vehicle_number || 'Not specified'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Quantity</CardDescription>
            <CardTitle className="text-xl">{totalQuantity} units</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sold</CardDescription>
            <CardTitle className="text-xl">{soldQuantity} units</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sales</CardDescription>
            <CardTitle className="text-xl">{formatCurrency(totalSales)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Produce Lots</CardTitle>
            </div>
            <CardDescription>
              {lots.length} {lots.length === 1 ? 'lot' : 'lots'} in this arrival
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lots.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No lots added to this arrival yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => {
                    const soldPct = lot.quantity > 0 
                      ? ((lot.quantity - lot.remaining_quantity) / lot.quantity * 100).toFixed(0)
                      : 0
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">
                          {lot.item?.name}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({lot.item?.unit})
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{lot.quantity}</TableCell>
                        <TableCell className="text-right">{lot.remaining_quantity}</TableCell>
                        <TableCell className="text-right">
                          {lot.rate ? formatCurrency(lot.rate) : '-'}
                        </TableCell>
                        <TableCell>
                          {lot.remaining_quantity === 0 ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              Sold Out
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {soldPct}% sold
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Lot</CardTitle>
            <CardDescription>Add more produce to this arrival</CardDescription>
          </CardHeader>
          <CardContent>
            <AddLotForm arrivalId={arrival.id} items={items} />
          </CardContent>
        </Card>
      </div>

      {arrival.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{arrival.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
