'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import type { Buyer } from '@/lib/types'

interface BuyerFormProps {
  buyer?: Buyer
}

export function BuyerForm({ buyer }: BuyerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(buyer?.name || '')
  const [phone, setPhone] = useState(buyer?.phone || '')
  const [address, setAddress] = useState(buyer?.address || '')

  const isEditing = !!buyer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const buyerData = {
      name,
      phone: phone || null,
      address: address || null,
      created_by: user.id,
    }

    if (isEditing) {
      const { error } = await supabase
        .from('buyers')
        .update(buyerData)
        .eq('id', buyer.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('buyers')
        .insert(buyerData)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/buyers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Buyer Name *</FieldLabel>
          <Input
            id="name"
            placeholder="Enter buyer's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Textarea
            id="address"
            placeholder="Enter shop/business address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </Field>
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      <div className="flex gap-4 mt-6">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          {loading ? 'Saving...' : isEditing ? 'Update Buyer' : 'Add Buyer'}
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
