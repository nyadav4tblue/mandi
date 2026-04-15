import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { unwrapRelation } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreditCard } from 'lucide-react'
import { PaymentForm } from '@/components/payments/payment-form'

interface PaymentsPageProps {
  searchParams: Promise<{ buyer?: string }>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function getData(selectedBuyerId?: string) {
  const supabase = await createClient()

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, name, credit_balance')
    .order('name')

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      payment_date,
      notes,
      created_at,
      buyer:buyers(id, name)
    `)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const totalOutstanding = buyers?.reduce((sum, b) => sum + Number(b.credit_balance), 0) || 0

  return {
    buyers: buyers || [],
    payments: payments || [],
    totalOutstanding,
    selectedBuyerId,
  }
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { buyer } = await searchParams
  const { buyers, payments, totalOutstanding, selectedBuyerId } = await getData(buyer)

  const buyersWithCredit = buyers.filter(b => Number(b.credit_balance) > 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Record buyer payments against their credit balance
          </p>
        </div>
      </div>

      {totalOutstanding > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CreditCard className="h-6 w-6 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Total Outstanding Credit</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
              <p className="text-sm text-orange-700">
                {buyersWithCredit.length} {buyersWithCredit.length === 1 ? 'buyer' : 'buyers'} with pending balance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>
              Record a payment received from a buyer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm buyers={buyers} selectedBuyerId={selectedBuyerId} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              {payments.length === 0 ? 'No payments recorded yet' : 'Last 50 payments received'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No payments recorded yet. Record a payment when buyers settle their credit.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const paymentBuyer = unwrapRelation(
                      payment.buyer as { id: string; name: string } | { id: string; name: string }[] | null
                    )
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {paymentBuyer?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {payment.notes || '-'}
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

      {buyersWithCredit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Buyers with Outstanding Credit</CardTitle>
            <CardDescription>
              Buyers who have pending payment balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Outstanding Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyersWithCredit.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-right font-medium text-orange-600">
                      {formatCurrency(Number(b.credit_balance))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
