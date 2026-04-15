'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

interface Item {
  id: string
  name: string
  unit: string
}

interface AddLotFormProps {
  arrivalId: string
  items: Item[]
}

export function AddLotForm({ arrivalId, items }: AddLotFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [rate, setRate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!itemId || !quantity) {
      setError('Please select an item and enter quantity')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error: lotError } = await supabase
      .from('lots')
      .insert({
        arrival_id: arrivalId,
        item_id: itemId,
        quantity: parseFloat(quantity),
        remaining_quantity: parseFloat(quantity),
        rate: rate ? parseFloat(rate) : null,
      })

    if (lotError) {
      setError(lotError.message)
      setLoading(false)
      return
    }

    // Reset form
    setItemId('')
    setQuantity('')
    setRate('')
    setLoading(false)

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="item">Item *</FieldLabel>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="quantity">Quantity *</FieldLabel>
          <Input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.01"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="rate">Rate (Rs per unit)</FieldLabel>
          <Input
            id="rate"
            type="number"
            placeholder="Expected rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            min="0"
            step="0.01"
          />
        </Field>
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        {loading ? 'Adding...' : 'Add Lot'}
      </Button>
    </form>
  )
}
