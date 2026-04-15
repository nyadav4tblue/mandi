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
import { Plus, IndianRupee } from 'lucide-react'
import { unwrapRelation } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function getSales() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id,
      quantity,
      rate,
      total_amount,
      payment_type,
      sale_date,
      created_at,
      buyer:buyers(id, name),
      lot:lots(
        id,
        item:items(name, unit),
        arrival:arrivals(
          farmer:farmers(name)
        )
      )
    `)
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate today's totals
  const todaySales = sales?.filter(s => s.sale_date === today) || []
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)
  const todayCash = todaySales
    .filter(s => s.payment_type === 'cash')
    .reduce((sum, s) => sum + Number(s.total_amount), 0)
  const todayCredit = todaySales
    .filter(s => s.payment_type === 'credit')
    .reduce((sum, s) => sum + Number(s.total_amount), 0)

  return {
    sales: sales || [],
    todaySales,
    todayTotal,
    todayCash,
    todayCredit,
    today,
  }
}

export default async function SalesPage() {
  const { sales, todaySales, todayTotal, todayCash, todayCredit, today } = await getSales()
  const otherSales = sales.filter(s => s.sale_date !== today)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">
            Record and manage all your sales transactions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{"Today's Total"}</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayTotal)}</div>
            <p className="text-xs text-muted-foreground">{todaySales.length} sales today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(todayCash)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(todayCredit)}</div>
          </CardContent>
        </Card>
      </div>

      {todaySales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{"Today's Sales"}</CardTitle>
            <CardDescription>{todaySales.length} transactions today</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTable sales={todaySales} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{todaySales.length > 0 ? 'Previous Sales' : 'All Sales'}</CardTitle>
          <CardDescription>
            {sales.length === 0 ? 'No sales recorded yet' : 'Showing last 100 sales'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No sales recorded yet</p>
              <Button asChild>
                <Link href="/dashboard/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record first sale
                </Link>
              </Button>
            </div>
          ) : (
            <SalesTable sales={otherSales.length > 0 ? otherSales : sales} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SalesTableProps {
  sales: Awaited<ReturnType<typeof getSales>>['sales']
}

function SalesTable({ sales }: SalesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Farmer</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => {
          const buyer = unwrapRelation(
            sale.buyer as { id: string; name: string } | { id: string; name: string }[] | null
          )
          const lot = unwrapRelation(
            sale.lot as
              | {
                  item: { name: string; unit: string } | { name: string; unit: string }[] | null
                  arrival: { farmer: { name: string } | { name: string }[] | null } | { farmer: { name: string } | { name: string }[] | null }[] | null
                }
              | {
                  item: { name: string; unit: string } | { name: string; unit: string }[] | null
                  arrival: { farmer: { name: string } | { name: string }[] | null } | { farmer: { name: string } | { name: string }[] | null }[] | null
                }[]
              | null
          )
          const item = unwrapRelation(lot?.item as { name: string; unit: string } | { name: string; unit: string }[] | null)
          const arrival = unwrapRelation(lot?.arrival as { farmer: { name: string } | { name: string }[] | null } | { farmer: { name: string } | { name: string }[] | null }[] | null)
          const farmer = unwrapRelation(arrival?.farmer as { name: string } | { name: string }[] | null)

          return (
            <TableRow key={sale.id}>
              <TableCell>
                {new Date(sale.sale_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </TableCell>
              <TableCell className="font-medium">
                {item?.name || 'Unknown'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {farmer?.name || '-'}
              </TableCell>
              <TableCell>{buyer?.name || 'Unknown'}</TableCell>
              <TableCell className="text-right">{sale.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(Number(sale.rate))}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(sale.total_amount))}
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  sale.payment_type === 'cash' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {sale.payment_type}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
