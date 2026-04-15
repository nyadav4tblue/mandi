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
import { FileText, IndianRupee, Users } from 'lucide-react'
import { GenerateBillButton } from '@/components/billing/generate-bill-button'
import { unwrapRelation } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function getBillingData() {
  const supabase = await createClient()

  // Get settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const commissionRate = settings?.find(s => s.key === 'commission_rate')?.value || 5
  const unloadingCharge = settings?.find(s => s.key === 'unloading_charge')?.value || 3

  // Get active arrivals that haven't been billed
  const { data: activeArrivals } = await supabase
    .from('arrivals')
    .select(`
      id,
      arrival_date,
      vehicle_number,
      status,
      farmer:farmers(id, name),
      lots(
        id,
        quantity,
        remaining_quantity,
        item:items(name)
      )
    `)
    .eq('status', 'active')
    .order('arrival_date', { ascending: false })

  // Get generated bills
  const { data: bills } = await supabase
    .from('farmer_bills')
    .select(`
      id,
      total_sales,
      commission_amount,
      unloading_charges,
      net_payable,
      bill_date,
      is_paid,
      arrival:arrivals(
        id,
        arrival_date,
        farmer:farmers(name)
      )
    `)
    .order('bill_date', { ascending: false })
    .limit(20)

  // Calculate pending settlement amounts for each active arrival
  const arrivalsWithTotals = await Promise.all(
    (activeArrivals || []).map(async (arrival) => {
      const lotIds = (arrival.lots as { id: string }[])?.map(l => l.id) || []
      
      if (lotIds.length === 0) {
        return { ...arrival, totalSales: 0, totalQuantity: 0 }
      }

      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .in('lot_id', lotIds)

      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const totalQuantity = (arrival.lots as { quantity: number }[])?.reduce((sum, l) => sum + l.quantity, 0) || 0

      return { ...arrival, totalSales, totalQuantity }
    })
  )

  return {
    activeArrivals: arrivalsWithTotals.filter(a => a.totalSales > 0),
    bills: bills || [],
    commissionRate: Number(commissionRate),
    unloadingCharge: Number(unloadingCharge),
  }
}

export default async function BillingPage() {
  const { activeArrivals, bills, commissionRate, unloadingCharge } = await getBillingData()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Generate and manage farmer settlement bills
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionRate}%</div>
            <p className="text-xs text-muted-foreground">On total sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unloading Charge</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(unloadingCharge)}/unit</div>
            <p className="text-xs text-muted-foreground">Per unit of produce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Settlements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeArrivals.length}</div>
            <p className="text-xs text-muted-foreground">Arrivals ready for billing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Settlements</CardTitle>
          <CardDescription>
            Active arrivals with sales ready for bill generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeArrivals.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No pending settlements. All arrivals have been billed or have no sales yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arrival Date</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Unloading</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeArrivals.map((arrival) => {
                  const farmer = unwrapRelation(
                    arrival.farmer as { id: string; name: string } | { id: string; name: string }[] | null
                  )
                  const rawLots = (arrival.lots ?? []) as Array<{
                    item: { name: string } | { name: string }[] | null
                    quantity: number
                  }>
                  const lots = rawLots.map((l) => ({
                    ...l,
                    item: unwrapRelation(l.item),
                  }))
                  const commission = (arrival.totalSales * commissionRate) / 100
                  const unloading = arrival.totalQuantity * unloadingCharge
                  const netPayable = arrival.totalSales - commission - unloading

                  return (
                    <TableRow key={arrival.id}>
                      <TableCell>
                        {new Date(arrival.arrival_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{farmer?.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lots.slice(0, 2).map(l => l.item?.name).join(', ')}
                        {lots.length > 2 && ` +${lots.length - 2}`}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(arrival.totalSales)}</TableCell>
                      <TableCell className="text-right text-orange-600">-{formatCurrency(commission)}</TableCell>
                      <TableCell className="text-right text-orange-600">-{formatCurrency(unloading)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(netPayable)}
                      </TableCell>
                      <TableCell className="text-right">
                        <GenerateBillButton
                          arrivalId={arrival.id}
                          totalSales={arrival.totalSales}
                          commission={commission}
                          unloading={unloading}
                          netPayable={netPayable}
                        />
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
          <CardTitle>Generated Bills</CardTitle>
          <CardDescription>
            Recent farmer settlement bills
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No bills generated yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Date</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => {
                  const arrival = unwrapRelation(
                    bill.arrival as
                      | {
                          id: string
                          arrival_date: string
                          farmer: { name: string } | { name: string }[] | null
                        }
                      | {
                          id: string
                          arrival_date: string
                          farmer: { name: string } | { name: string }[] | null
                        }[]
                      | null
                  )
                  const farmer = arrival
                    ? unwrapRelation(arrival.farmer as { name: string } | { name: string }[] | null)
                    : null

                  return (
                    <TableRow key={bill.id}>
                      <TableCell>
                        {new Date(bill.bill_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {farmer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(bill.total_sales))}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(Number(bill.net_payable))}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          bill.is_paid 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {bill.is_paid ? 'Paid' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/billing/${bill.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
