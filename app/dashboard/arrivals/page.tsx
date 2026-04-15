import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Truck, Package } from 'lucide-react'
import { unwrapRelation } from '@/lib/utils'

async function getArrivals() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: arrivals } = await supabase
    .from('arrivals')
    .select(`
      id,
      arrival_date,
      vehicle_number,
      status,
      notes,
      created_at,
      farmer:farmers(id, name),
      lots(
        id,
        quantity,
        remaining_quantity,
        rate,
        item:items(name, unit)
      )
    `)
    .order('arrival_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return { arrivals: arrivals || [], today }
}

export default async function ArrivalsPage() {
  const { arrivals, today } = await getArrivals()

  const todayArrivals = arrivals.filter(a => a.arrival_date === today)
  const otherArrivals = arrivals.filter(a => a.arrival_date !== today)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arrivals</h1>
          <p className="text-muted-foreground">
            Manage farmer arrivals and their produce lots
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/arrivals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Arrival
          </Link>
        </Button>
      </div>

      {todayArrivals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{"Today's Arrivals"}</CardTitle>
                <CardDescription>
                  {todayArrivals.length} {todayArrivals.length === 1 ? 'arrival' : 'arrivals'} today
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ArrivalTable arrivals={todayArrivals} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{todayArrivals.length > 0 ? 'Previous Arrivals' : 'All Arrivals'}</CardTitle>
          <CardDescription>
            {arrivals.length === 0 ? 'No arrivals recorded yet' : `Showing last 50 arrivals`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {arrivals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No arrivals recorded yet</p>
              <Button asChild>
                <Link href="/dashboard/arrivals/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record first arrival
                </Link>
              </Button>
            </div>
          ) : (
            <ArrivalTable arrivals={otherArrivals.length > 0 ? otherArrivals : arrivals} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ArrivalTableProps {
  arrivals: Awaited<ReturnType<typeof getArrivals>>['arrivals']
}

function ArrivalTable({ arrivals }: ArrivalTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Farmer</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {arrivals.map((arrival) => {
          const farmer = unwrapRelation(
            arrival.farmer as { id: string; name: string } | { id: string; name: string }[] | null
          )
          const rawLots = (arrival.lots ?? []) as Array<{
            id: string
            quantity: number
            remaining_quantity: number
            item: { name: string; unit: string } | { name: string; unit: string }[] | null
          }>
          const lots = rawLots.map((lot) => ({
            ...lot,
            item: unwrapRelation(lot.item),
          }))

          return (
            <TableRow key={arrival.id}>
              <TableCell>
                {new Date(arrival.arrival_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="font-medium">
                {farmer?.name || 'Unknown'}
              </TableCell>
              <TableCell>{arrival.vehicle_number || '-'}</TableCell>
              <TableCell>
                {lots.length === 0 ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    No lots
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {lots.slice(0, 3).map((lot) => (
                      <span
                        key={lot.id}
                        className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                      >
                        {lot.item?.name}: {lot.remaining_quantity}/{lot.quantity}
                      </span>
                    ))}
                    {lots.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{lots.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  arrival.status === 'active' 
                    ? 'bg-primary/10 text-primary' 
                    : arrival.status === 'settled'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {arrival.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/arrivals/${arrival.id}`}>
                    Manage
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
