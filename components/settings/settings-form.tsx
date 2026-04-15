'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

interface SettingsFormProps {
  commissionRate: number
  unloadingCharge: number
  loadingCharge: number
}

export function SettingsForm({
  commissionRate: initialCommission,
  unloadingCharge: initialUnloading,
  loadingCharge: initialLoading,
}: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [commissionRate, setCommissionRate] = useState(initialCommission.toString())
  const [unloadingCharge, setUnloadingCharge] = useState(initialUnloading.toString())
  const [loadingCharge, setLoadingCharge] = useState(initialLoading.toString())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Update or insert settings
    const updates = [
      { key: 'commission_rate', value: parseFloat(commissionRate), description: 'Commission percentage on total sales' },
      { key: 'unloading_charge', value: parseFloat(unloadingCharge), description: 'Unloading charge per unit (Rs)' },
      { key: 'loading_charge', value: parseFloat(loadingCharge), description: 'Loading charge per unit (Rs)' },
    ]

    for (const setting of updates) {
      const { error } = await supabase
        .from('settings')
        .upsert(setting, { onConflict: 'key' })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="commission">Commission Rate (%)</FieldLabel>
          <Input
            id="commission"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            min="0"
            max="100"
            step="0.1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Percentage deducted from farmer sales as commission
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="unloading">Unloading Charge (Rs/unit)</FieldLabel>
          <Input
            id="unloading"
            type="number"
            value={unloadingCharge}
            onChange={(e) => setUnloadingCharge(e.target.value)}
            min="0"
            step="0.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Labor charge per unit for unloading produce
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="loading">Loading Charge (Rs/unit)</FieldLabel>
          <Input
            id="loading"
            type="number"
            value={loadingCharge}
            onChange={(e) => setLoadingCharge(e.target.value)}
            min="0"
            step="0.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Labor charge per unit for loading produce
          </p>
        </Field>
      </FieldGroup>

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}

      {success && (
        <p className="text-sm text-primary mt-4">Settings saved successfully!</p>
      )}

      <Button type="submit" className="mt-6" disabled={loading}>
        {loading ? <Spinner className="mr-2" /> : null}
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}
