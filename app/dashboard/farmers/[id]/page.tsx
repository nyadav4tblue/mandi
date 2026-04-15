import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FarmerForm } from '@/components/farmers/farmer-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { unwrapRelation } from '@/lib/utils'

interface FarmerDetailPageProps {
  params: Promise<{ id: string }>
}

async function getFarmer(id: string) {
  const supabase = await createClient()

  const { data: farmer } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', id)
    .single()

  if (!farmer) return null

  // Get farmer's arrivals with lots
  const { data: arrivals } = await supabase
    .from('arrivals')
    .select(`
      id,
      arrival_date,
      vehicle_number,
      status,
      lots (
        id,
        quantity,
        remaining_quantity,
        rate,
        item:items(name, unit)
      )
    `)
    .eq('farmer_id', id)
    .order('arrival_date', { ascending: false })
    .limit(10)

  return { farmer, arrivals: arrivals || [] }
}

export default async function FarmerDetailPage({ params }: FarmerDetailPageProps) {
  const { id } = await params
  const data = await getFarmer(id)

  if (!data) {
    notFound()
  }

  const { farmer, arrivals } = data

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Farmer</CardTitle>
            <CardDescription>
              Update farmer information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FarmerForm farmer={farmer} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Arrivals</CardTitle>
            <CardDescription>
              Last 10 arrivals from this farmer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {arrivals.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No arrivals recorded for this farmer yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arrivals.map((arrival) => (
                    <TableRow key={arrival.id}>
                      <TableCell>
                        {new Date(arrival.arrival_date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>{arrival.vehicle_number || '-'}</TableCell>
                      <TableCell>
                        {(arrival.lots ?? [])
                          .map((lot) => {
                            const item = unwrapRelation(
                              (lot as { item?: { name: string } | { name: string }[] }).item as
                                | { name: string }
                                | { name: string }[]
                                | null
                            )
                            return item?.name
                          })
                          .filter(Boolean)
                          .join(', ') || '-'}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
