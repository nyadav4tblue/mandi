'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'

interface Buyer {
  id: string
  name: string
  credit_balance: number
}

interface PaymentFormProps {
  buyers: Buyer[]
  selectedBuyerId?: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PaymentForm({ buyers, selectedBuyerId }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [buyerId, setBuyerId] = useState(selectedBuyerId || '')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const selectedBuyer = useMemo(() => buyers.find(b => b.id === buyerId), [buyers, buyerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (!buyerId || !amount) {
      setError('Please select a buyer and enter amount')
      setLoading(false)
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Create payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        buyer_id: buyerId,
        amount: paymentAmount,
        payment_date: paymentDate,
        notes: notes || null,
        created_by: user.id,
      })

    if (paymentError) {
      setError(paymentError.message)
      setLoading(false)
      return
    }

    // Update buyer credit balance
    const newBalance = Math.max(0, Number(selectedBuyer!.credit_balance) - paymentAmount)
    const { error: buyerError } = await supabase
      .from('buyers')
      .update({
        credit_balance: newBalance,
      })
      .eq('id', buyerId)

    if (buyerError) {
      setError(buyerError.message)
      setLoading(false)
      return
    }

    // Reset form
    setBuyerId('')
    setAmount('')
    setNotes('')
    setSuccess(true)
    setLoading(false)

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="buyer">Buyer *</FieldLabel>
          <Select value={buyerId} onValueChange={setBuyerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select buyer" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>
                  {buyer.name}
                  {Number(buyer.credit_balance) > 0 && (
                    <span className="text-orange-600 ml-2">
                      ({formatCurrency(Number(buyer.credit_balance))})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {selectedBuyer && Number(selectedBuyer.credit_balance) > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-3">
              <p className="text-sm text-orange-800">
                <strong>{selectedBuyer.name}</strong> owes{' '}
                <strong>{formatCurrency(Number(selectedBuyer.credit_balance))}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        <Field>
          <FieldLabel htmlFor="amount">Amount (Rs) *</FieldLabel>
          <Input
            id="amount"
            type="number"
            placeholder="Enter payment amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="date">Payment Date</FieldLabel>
          <Input
            id="date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            placeholder="Any notes about this payment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </Field>
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      {success && (
        <p className="text-sm text-primary mt-4">Payment recorded successfully!</p>
      )}

      <Button type="submit" className="w-full mt-4" disabled={loading || !buyerId}>
        {loading ? <Spinner className="mr-2" /> : null}
        {loading ? 'Recording...' : 'Record Payment'}
      </Button>
    </form>
  )
}
