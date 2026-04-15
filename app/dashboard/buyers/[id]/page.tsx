import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BuyerForm } from '@/components/buyers/buyer-form'
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
import { CreditCard } from 'lucide-react'

interface BuyerDetailPageProps {
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

async function getBuyer(id: string) {
  const supabase = await createClient()

  const { data: buyer } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single()

  if (!buyer) return null

  // Get buyer's purchases
  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id,
      quantity,
      rate,
      total_amount,
      payment_type,
      sale_date,
      lot:lots(
        item:items(name, unit),
        arrival:arrivals(
          farmer:farmers(name)
        )
      )
    `)
    .eq('buyer_id', id)
    .order('sale_date', { ascending: false })
    .limit(20)

  // Get buyer's payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('buyer_id', id)
    .order('payment_date', { ascending: false })
    .limit(10)

  return { buyer, sales: sales || [], payments: payments || [] }
}

export default async function BuyerDetailPage({ params }: BuyerDetailPageProps) {
  const { id } = await params
  const data = await getBuyer(id)

  if (!data) {
    notFound()
  }

  const { buyer, sales, payments } = data

  return (
    <div className="p-6 space-y-6">
      {Number(buyer.credit_balance) > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Outstanding Credit</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(Number(buyer.credit_balance))}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/dashboard/payments?buyer=${id}`}>
                Record Payment
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Buyer</CardTitle>
            <CardDescription>
              Update buyer information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BuyerForm buyer={buyer} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>
                Last 20 purchases by this buyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No purchases recorded for this buyer yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-sm">
                          {new Date(sale.sale_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(sale.lot as { item?: { name: string } })?.item?.name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{sale.quantity}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                Payment history for this buyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No payments recorded for this buyer yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.notes || '-'}
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
    </div>
  )
}
