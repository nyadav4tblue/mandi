'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Trash2, Plus } from 'lucide-react'
import type { Item } from '@/lib/types'

interface ItemsManagerProps {
  items: Item[]
}

export function ItemsManager({ items }: ItemsManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('kg')

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newItemName.trim()) {
      setError('Please enter an item name')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase
      .from('items')
      .insert({
        name: newItemName.trim(),
        unit: newItemUnit,
      })

    if (error) {
      if (error.code === '23505') {
        setError('Item already exists')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setNewItemName('')
    setLoading(false)
    router.refresh()
  }

  const handleDeleteItem = async (itemId: string) => {
    const supabase = createClient()

    await supabase.from('items').delete().eq('id', itemId)

    router.refresh()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddItem} className="flex gap-2">
        <Input
          placeholder="New item name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
        />
        <Select value={newItemUnit} onValueChange={setNewItemUnit}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kg">kg</SelectItem>
            <SelectItem value="piece">piece</SelectItem>
            <SelectItem value="bundle">bundle</SelectItem>
            <SelectItem value="dozen">dozen</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="icon" disabled={loading}>
          {loading ? <Spinner /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="border rounded-lg divide-y max-h-80 overflow-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-secondary/50"
          >
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground text-sm ml-2">({item.unit})</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {items.length} items configured
      </p>
    </div>
  )
}
