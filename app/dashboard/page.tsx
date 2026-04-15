import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  Package,
  Truck,
  Users,
  Plus,
} from 'lucide-react'
import { unwrapRelation } from '@/lib/utils'

async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get today's sales total
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('sale_date', today)

  const todaySalesTotal = todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

  // Get settings for commission calculation
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const commissionRate = settings?.find(s => s.key === 'commission_rate')?.value || 5
  const todayCommission = (todaySalesTotal * Number(commissionRate)) / 100

  // Get total outstanding credit
  const { data: buyers } = await supabase
    .from('buyers')
    .select('credit_balance')

  const totalCredit = buyers?.reduce((sum, b) => sum + Number(b.credit_balance), 0) || 0

  // Get active lots count
  const { data: activeLots } = await supabase
    .from('lots')
    .select('id')
    .gt('remaining_quantity', 0)

  // Get today's arrivals count
  const { data: todayArrivals } = await supabase
    .from('arrivals')
    .select('id')
    .eq('arrival_date', today)

  // Get today's payments
  const { data: todayPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('payment_date', today)

  const todayPaymentsTotal = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Get recent sales
  const { data: recentSales } = await supabase
    .from('sales')
    .select(`
      id,
      quantity,
      rate,
      total_amount,
      payment_type,
      created_at,
      buyer:buyers(name),
      lot:lots(
        item:items(name),
        arrival:arrivals(
          farmer:farmers(name)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent arrivals
  const { data: recentArrivals } = await supabase
    .from('arrivals')
    .select(`
      id,
      arrival_date,
      vehicle_number,
      created_at,
      farmer:farmers(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    todaySales: todaySalesTotal,
    todayCommission,
    totalCredit,
    activeLots: activeLots?.length || 0,
    todayArrivals: todayArrivals?.length || 0,
    todayPayments: todayPaymentsTotal,
    recentSales: recentSales || [],
    recentArrivals: recentArrivals || [],
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {"Today's overview of your mandi business"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/arrivals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Arrival
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={IndianRupee}
        />
        <StatsCard
          title="Today's Commission"
          value={formatCurrency(stats.todayCommission)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Outstanding Credit"
          value={formatCurrency(stats.totalCredit)}
          icon={CreditCard}
        />
        <StatsCard
          title="Active Lots"
          value={stats.activeLots}
          icon={Package}
        />
        <StatsCard
          title="Today's Arrivals"
          value={stats.todayArrivals}
          icon={Truck}
        />
        <StatsCard
          title="Today's Payments"
          value={formatCurrency(stats.todayPayments)}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions in your mandi</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sales recorded yet. Start by recording your first sale.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentSales.map((sale) => {
                  const lot = unwrapRelation(
                    sale.lot as { item?: { name: string } | { name: string }[] } | { item?: { name: string } | { name: string }[] }[] | null
                  )
                  const item = unwrapRelation(lot?.item as { name: string } | { name: string }[] | null)
                  const buyer = unwrapRelation(
                    sale.buyer as { name: string } | { name: string }[] | null
                  )
                  return (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {item?.name || 'Unknown Item'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {buyer?.name ?? '—'} - {sale.quantity} units @ {formatCurrency(Number(sale.rate))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(Number(sale.total_amount))}</p>
                      <p className={`text-xs ${sale.payment_type === 'cash' ? 'text-primary' : 'text-orange-600'}`}>
                        {sale.payment_type === 'cash' ? 'Cash' : 'Credit'}
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Arrivals</CardTitle>
            <CardDescription>Latest farmer arrivals at your mandi</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentArrivals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No arrivals recorded yet. Start by recording a farmer arrival.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentArrivals.map((arrival) => {
                  const farmer = unwrapRelation(
                    arrival.farmer as { name: string } | { name: string }[] | null
                  )
                  return (
                  <div key={arrival.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {farmer?.name || 'Unknown Farmer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {arrival.vehicle_number || 'No vehicle'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(arrival.arrival_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
