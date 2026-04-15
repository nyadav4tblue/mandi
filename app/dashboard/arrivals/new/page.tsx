import { createClient } from '@/lib/supabase/server'
import { ArrivalForm } from '@/components/arrivals/arrival-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getData() {
  const supabase = await createClient()

  const { data: farmers } = await supabase
    .from('farmers')
    .select('id, name')
    .order('name')

  const { data: items } = await supabase
    .from('items')
    .select('id, name, unit')
    .order('name')

  return { farmers: farmers || [], items: items || [] }
}

export default async function NewArrivalPage() {
  const { farmers, items } = await getData()

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record New Arrival</CardTitle>
            <CardDescription>
              Record a farmer arrival with their produce lots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArrivalForm farmers={farmers} items={items} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
