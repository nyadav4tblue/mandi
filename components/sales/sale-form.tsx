'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Lot {
  id: string
  quantity: number
  remaining_quantity: number
  rate: number | null
  item: { id: string; name: string; unit: string } | null
  arrival: {
    id: string
    arrival_date: string
    farmer: { id: string; name: string } | null
  } | null
}

interface Buyer {
  id: string
  name: string
  credit_balance: number
}

interface SaleFormProps {
  lots: Lot[]
  buyers: Buyer[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SaleForm({ lots, buyers }: SaleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lotId, setLotId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')

  const selectedLot = useMemo(() => lots.find(l => l.id === lotId), [lots, lotId])
  const selectedBuyer = useMemo(() => buyers.find(b => b.id === buyerId), [buyers, buyerId])

  // Auto-fill rate when lot is selected
  const handleLotChange = (value: string) => {
    setLotId(value)
    const lot = lots.find(l => l.id === value)
    if (lot?.rate) {
      setRate(lot.rate.toString())
    }
  }

  const totalAmount = useMemo(() => {
    const qty = parseFloat(quantity) || 0
    const r = parseFloat(rate) || 0
    return qty * r
  }, [quantity, rate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!lotId || !buyerId || !quantity || !rate) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const qty = parseFloat(quantity)
    if (selectedLot && qty > selectedLot.remaining_quantity) {
      setError(`Only ${selectedLot.remaining_quantity} units available in this lot`)
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

    // Create sale
    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        lot_id: lotId,
        buyer_id: buyerId,
        quantity: qty,
        rate: parseFloat(rate),
        total_amount: totalAmount,
        payment_type: paymentType,
        sale_date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      })

    if (saleError) {
      setError(saleError.message)
      setLoading(false)
      return
    }

    // Update lot remaining quantity
    const { error: lotError } = await supabase
      .from('lots')
      .update({
        remaining_quantity: selectedLot!.remaining_quantity - qty,
      })
      .eq('id', lotId)

    if (lotError) {
      setError(lotError.message)
      setLoading(false)
      return
    }

    // Update buyer credit balance if credit sale
    if (paymentType === 'credit') {
      const { error: buyerError } = await supabase
        .from('buyers')
        .update({
          credit_balance: Number(selectedBuyer!.credit_balance) + totalAmount,
        })
        .eq('id', buyerId)

      if (buyerError) {
        setError(buyerError.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/sales')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="lot">Select Lot *</FieldLabel>
          <Select value={lotId} onValueChange={handleLotChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a lot" />
            </SelectTrigger>
            <SelectContent>
              {lots.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No lots available
                </SelectItem>
              ) : (
                lots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.item?.name} - {lot.arrival?.farmer?.name} ({lot.remaining_quantity} {lot.item?.unit} available)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </Field>

        {selectedLot && (
          <Card className="bg-secondary/50">
            <CardContent className="py-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Farmer:</span>{' '}
                  <span className="font-medium">{selectedLot.arrival?.farmer?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  {new Date(selectedLot.arrival?.arrival_date || '').toLocaleDateString('en-IN')}
                </div>
                <div>
                  <span className="text-muted-foreground">Available:</span>{' '}
                  <span className="font-medium">{selectedLot.remaining_quantity} {selectedLot.item?.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Rate:</span>{' '}
                  {selectedLot.rate ? formatCurrency(selectedLot.rate) : 'Not set'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      (Owes {formatCurrency(Number(buyer.credit_balance))})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantity">Quantity *</FieldLabel>
            <Input
              id="quantity"
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              max={selectedLot?.remaining_quantity}
              step="0.01"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="rate">Rate (Rs per unit) *</FieldLabel>
            <Input
              id="rate"
              type="number"
              placeholder="Enter rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              min="0"
              step="0.01"
            />
          </Field>
        </div>

        {totalAmount > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>
        )}

        <Field>
          <FieldLabel>Payment Type *</FieldLabel>
          <RadioGroup
            value={paymentType}
            onValueChange={(value) => setPaymentType(value as 'cash' | 'credit')}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="font-normal cursor-pointer">
                Cash (Paid now)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="font-normal cursor-pointer">
                Credit (Udhar)
              </Label>
            </div>
          </RadioGroup>
        </Field>

        {paymentType === 'credit' && selectedBuyer && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-800">
                {selectedBuyer.name}&apos;s credit will increase to{' '}
                <strong>{formatCurrency(Number(selectedBuyer.credit_balance) + totalAmount)}</strong>
              </p>
            </CardContent>
          </Card>
        )}
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      <div className="flex gap-4 mt-6">
        <Button type="submit" disabled={loading || !lotId || !buyerId}>
          {loading ? <Spinner className="mr-2" /> : null}
          {loading ? 'Recording...' : 'Record Sale'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
