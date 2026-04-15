'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import type { Farmer } from '@/lib/types'

interface FarmerFormProps {
  farmer?: Farmer
}

export function FarmerForm({ farmer }: FarmerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(farmer?.name || '')
  const [phone, setPhone] = useState(farmer?.phone || '')
  const [address, setAddress] = useState(farmer?.address || '')

  const isEditing = !!farmer

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

    const farmerData = {
      name,
      phone: phone || null,
      address: address || null,
      created_by: user.id,
    }

    if (isEditing) {
      const { error } = await supabase
        .from('farmers')
        .update(farmerData)
        .eq('id', farmer.id)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('farmers')
        .insert(farmerData)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/farmers')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Farmer Name *</FieldLabel>
          <Input
            id="name"
            placeholder="Enter farmer's name"
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
            placeholder="Enter village/town address"
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
          {loading ? 'Saving...' : isEditing ? 'Update Farmer' : 'Add Farmer'}
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
