'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

interface Farmer {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  unit: string
}

interface LotEntry {
  item_id: string
  quantity: string
  rate: string
}

interface ArrivalFormProps {
  farmers: Farmer[]
  items: Item[]
}

export function ArrivalForm({ farmers, items }: ArrivalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [farmerId, setFarmerId] = useState('')
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0])
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [lots, setLots] = useState<LotEntry[]>([
    { item_id: '', quantity: '', rate: '' }
  ])

  const addLot = () => {
    setLots([...lots, { item_id: '', quantity: '', rate: '' }])
  }

  const removeLot = (index: number) => {
    if (lots.length > 1) {
      setLots(lots.filter((_, i) => i !== index))
    }
  }

  const updateLot = (index: number, field: keyof LotEntry, value: string) => {
    const newLots = [...lots]
    newLots[index] = { ...newLots[index], [field]: value }
    setLots(newLots)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate lots
    const validLots = lots.filter(lot => lot.item_id && lot.quantity)
    if (validLots.length === 0) {
      setError('Please add at least one lot with item and quantity')
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

    // Create arrival
    const { data: arrival, error: arrivalError } = await supabase
      .from('arrivals')
      .insert({
        farmer_id: farmerId,
        arrival_date: arrivalDate,
        vehicle_number: vehicleNumber || null,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (arrivalError) {
      setError(arrivalError.message)
      setLoading(false)
      return
    }

    // Create lots
    const lotsData = validLots.map(lot => ({
      arrival_id: arrival.id,
      item_id: lot.item_id,
      quantity: parseFloat(lot.quantity),
      remaining_quantity: parseFloat(lot.quantity),
      rate: lot.rate ? parseFloat(lot.rate) : null,
    }))

    const { error: lotsError } = await supabase
      .from('lots')
      .insert(lotsData)

    if (lotsError) {
      setError(lotsError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/arrivals/${arrival.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="farmer">Farmer *</FieldLabel>
          <Select value={farmerId} onValueChange={setFarmerId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a farmer" />
            </SelectTrigger>
            <SelectContent>
              {farmers.map((farmer) => (
                <SelectItem key={farmer.id} value={farmer.id}>
                  {farmer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="date">Arrival Date *</FieldLabel>
            <Input
              id="date"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="vehicle">Vehicle Number</FieldLabel>
            <Input
              id="vehicle"
              placeholder="e.g., UP 32 AB 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            placeholder="Any additional notes about this arrival"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </Field>
      </FieldGroup>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Produce Lots</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLot}>
              <Plus className="h-4 w-4 mr-1" />
              Add Lot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lots.map((lot, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <FieldLabel className="text-xs">Item</FieldLabel>
                <Select
                  value={lot.item_id}
                  onValueChange={(value) => updateLot(index, 'item_id', value)}
                >
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
              </div>
              <div className="w-28">
                <FieldLabel className="text-xs">Quantity</FieldLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={lot.quantity}
                  onChange={(e) => updateLot(index, 'quantity', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="w-28">
                <FieldLabel className="text-xs">Rate (Rs)</FieldLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={lot.rate}
                  onChange={(e) => updateLot(index, 'rate', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeLot(index)}
                disabled={lots.length === 1}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      <div className="flex gap-4 mt-6">
        <Button type="submit" disabled={loading || !farmerId}>
          {loading ? <Spinner className="mr-2" /> : null}
          {loading ? 'Saving...' : 'Record Arrival'}
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
