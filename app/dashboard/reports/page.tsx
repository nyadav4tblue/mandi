import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IndianRupee, TrendingUp, CreditCard, Users, Truck, Package } from 'lucide-react'
import { unwrapRelation } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function getReportData() {
  const supabase = await createClient()
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  // Get settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const commissionRate = settings?.find(s => s.key === 'commission_rate')?.value || 5
  const unloadingCharge = settings?.find(s => s.key === 'unloading_charge')?.value || 3

  // Monthly sales
  const { data: monthlySales } = await supabase
    .from('sales')
    .select('total_amount, payment_type, quantity')
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  const totalMonthlySales = monthlySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
  const totalMonthlyQuantity = monthlySales?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
  const cashSales = monthlySales?.filter(s => s.payment_type === 'cash').reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
  const creditSales = monthlySales?.filter(s => s.payment_type === 'credit').reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
  const monthlyCommission = (totalMonthlySales * Number(commissionRate)) / 100
  const monthlyUnloading = totalMonthlyQuantity * Number(unloadingCharge)

  // Monthly arrivals
  const { data: monthlyArrivals } = await supabase
    .from('arrivals')
    .select('id')
    .gte('arrival_date', startOfMonth)
    .lte('arrival_date', endOfMonth)

  // Monthly payments received
  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', startOfMonth)
    .lte('payment_date', endOfMonth)

  const totalPayments = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Top farmers by sales this month
  const { data: topFarmersSales } = await supabase
    .from('sales')
    .select(`
      total_amount,
      lot:lots(
        arrival:arrivals(
          farmer:farmers(id, name)
        )
      )
    `)
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  // Aggregate by farmer
  const farmerSalesMap = new Map<string, { name: string; total: number }>()
  topFarmersSales?.forEach(sale => {
    const farmer = (sale.lot as { arrival?: { farmer?: { id: string; name: string } } })?.arrival?.farmer
    if (farmer) {
      const existing = farmerSalesMap.get(farmer.id) || { name: farmer.name, total: 0 }
      existing.total += Number(sale.total_amount)
      farmerSalesMap.set(farmer.id, existing)
    }
  })
  const topFarmers = Array.from(farmerSalesMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Top buyers by purchases this month
  const { data: topBuyersSales } = await supabase
    .from('sales')
    .select(`
      total_amount,
      buyer:buyers(id, name)
    `)
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  // Aggregate by buyer
  const buyerSalesMap = new Map<string, { name: string; total: number }>()
  topBuyersSales?.forEach(sale => {
    const buyer = unwrapRelation(
      sale.buyer as { id: string; name: string } | { id: string; name: string }[] | null
    )
    if (buyer) {
      const existing = buyerSalesMap.get(buyer.id) || { name: buyer.name, total: 0 }
      existing.total += Number(sale.total_amount)
      buyerSalesMap.set(buyer.id, existing)
    }
  })
  const topBuyers = Array.from(buyerSalesMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Outstanding credit
  const { data: buyers } = await supabase
    .from('buyers')
    .select('credit_balance')

  const totalCredit = buyers?.reduce((sum, b) => sum + Number(b.credit_balance), 0) || 0

  return {
    totalMonthlySales,
    cashSales,
    creditSales,
    monthlyCommission,
    monthlyUnloading,
    monthlyArrivals: monthlyArrivals?.length || 0,
    totalPayments,
    totalCredit,
    topFarmers,
    topBuyers,
    monthName: today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  }
}

export default async function ReportsPage() {
  const data = await getReportData()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Business overview for {data.monthName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalMonthlySales)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(data.monthlyCommission)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Labor Income</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(data.monthlyUnloading)}</div>
            <p className="text-xs text-muted-foreground">Unloading charges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalCredit)}</div>
            <p className="text-xs text-muted-foreground">Total pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(data.cashSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(data.creditSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arrivals</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.monthlyArrivals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payments Received</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{formatCurrency(data.totalPayments)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Farmers</CardTitle>
            <CardDescription>By sales value this month</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topFarmers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No sales recorded this month
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topFarmers.map((farmer, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{farmer.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(farmer.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Buyers</CardTitle>
            <CardDescription>By purchase value this month</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topBuyers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No purchases recorded this month
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topBuyers.map((buyer, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{buyer.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(buyer.total)}</TableCell>
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
