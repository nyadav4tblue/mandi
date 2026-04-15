import { createClient } from '@/lib/supabase/server'
import { SaleForm } from '@/components/sales/sale-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { unwrapRelation } from '@/lib/utils'

interface NewSalePageProps {
  searchParams: Promise<{ arrival?: string }>
}

async function getData(arrivalId?: string) {
  const supabase = await createClient()

  // Get active lots with remaining quantity
  let lotsQuery = supabase
    .from('lots')
    .select(`
      id,
      quantity,
      remaining_quantity,
      rate,
      item:items(id, name, unit),
      arrival:arrivals(
        id,
        arrival_date,
        farmer:farmers(id, name)
      )
    `)
    .gt('remaining_quantity', 0)
    .order('created_at', { ascending: false })

  if (arrivalId) {
    lotsQuery = lotsQuery.eq('arrival_id', arrivalId)
  }

  const { data: lotsRaw } = await lotsQuery

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, name, credit_balance')
    .order('name')

  const lots = (lotsRaw || []).map((row) => {
    const lot = row as {
      id: string
      quantity: number
      remaining_quantity: number
      rate: number | null
      item: { id: string; name: string; unit: string } | { id: string; name: string; unit: string }[] | null
      arrival: {
        id: string
        arrival_date: string
        farmer: { id: string; name: string } | { id: string; name: string }[] | null
      } | {
        id: string
        arrival_date: string
        farmer: { id: string; name: string } | { id: string; name: string }[] | null
      }[] | null
    }
    const arrival = unwrapRelation(lot.arrival)
    const farmer = arrival ? unwrapRelation(arrival.farmer) : null
    return {
      id: lot.id,
      quantity: Number(lot.quantity),
      remaining_quantity: Number(lot.remaining_quantity),
      rate: lot.rate,
      item: unwrapRelation(lot.item),
      arrival: arrival
        ? {
            id: arrival.id,
            arrival_date: arrival.arrival_date,
            farmer,
          }
        : null,
    }
  })

  return { lots, buyers: buyers || [] }
}

export default async function NewSalePage({ searchParams }: NewSalePageProps) {
  const { arrival } = await searchParams
  const { lots, buyers } = await getData(arrival)

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record New Sale</CardTitle>
            <CardDescription>
              Record a sale from available lot inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SaleForm lots={lots} buyers={buyers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
