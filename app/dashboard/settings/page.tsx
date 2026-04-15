import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings/settings-form'
import { ItemsManager } from '@/components/settings/items-manager'

async function getSettings() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('name')

  return {
    settings: settings || [],
    items: items || [],
  }
}

export default async function SettingsPage() {
  const { settings, items } = await getSettings()

  const commissionRate = settings.find(s => s.key === 'commission_rate')?.value || 5
  const unloadingCharge = settings.find(s => s.key === 'unloading_charge')?.value || 3
  const loadingCharge = settings.find(s => s.key === 'loading_charge')?.value || 2

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure commission rates, labor charges, and manage items
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Rates</CardTitle>
            <CardDescription>
              Configure commission and labor charge rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              commissionRate={Number(commissionRate)}
              unloadingCharge={Number(unloadingCharge)}
              loadingCharge={Number(loadingCharge)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items / Vegetables</CardTitle>
            <CardDescription>
              Manage the list of items that can be traded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsManager items={items} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
