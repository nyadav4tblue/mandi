'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FileText } from 'lucide-react'

interface GenerateBillButtonProps {
  arrivalId: string
  totalSales: number
  commission: number
  unloading: number
  netPayable: number
}

export function GenerateBillButton({
  arrivalId,
  totalSales,
  commission,
  unloading,
  netPayable,
}: GenerateBillButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGenerateBill = async () => {
    setLoading(true)

    const supabase = createClient()

    // Create bill record
    const { error: billError } = await supabase
      .from('farmer_bills')
      .insert({
        arrival_id: arrivalId,
        total_sales: totalSales,
        commission_amount: commission,
        unloading_charges: unloading,
        net_payable: netPayable,
        bill_date: new Date().toISOString().split('T')[0],
      })

    if (billError) {
      console.error('Error generating bill:', billError)
      setLoading(false)
      return
    }

    // Update arrival status to settled
    await supabase
      .from('arrivals')
      .update({ status: 'settled' })
      .eq('id', arrivalId)

    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      onClick={handleGenerateBill}
      disabled={loading}
    >
      {loading ? (
        <Spinner className="mr-1 h-3 w-3" />
      ) : (
        <FileText className="mr-1 h-3 w-3" />
      )}
      {loading ? 'Generating...' : 'Generate Bill'}
    </Button>
  )
}
