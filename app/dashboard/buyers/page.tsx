import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Phone, MapPin, AlertCircle } from 'lucide-react'
import { DeleteBuyerButton } from '@/components/buyers/delete-buyer-button'

async function getBuyers() {
  const supabase = await createClient()
  const { data: buyers } = await supabase
    .from('buyers')
    .select('*')
    .order('created_at', { ascending: false })

  return buyers || []
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function BuyersPage() {
  const buyers = await getBuyers()

  const totalCredit = buyers.reduce((sum, b) => sum + Number(b.credit_balance), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buyers</h1>
          <p className="text-muted-foreground">
            Manage buyers who purchase from your mandi
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/buyers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Buyer
          </Link>
        </Button>
      </div>

      {totalCredit > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Total Outstanding Credit</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCredit)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Buyers</CardTitle>
          <CardDescription>
            {buyers.length} {buyers.length === 1 ? 'buyer' : 'buyers'} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buyers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No buyers registered yet</p>
              <Button asChild>
                <Link href="/dashboard/buyers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first buyer
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Credit Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((buyer) => (
                  <TableRow key={buyer.id}>
                    <TableCell className="font-medium">{buyer.name}</TableCell>
                    <TableCell>
                      {buyer.phone ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {buyer.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {buyer.address ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {buyer.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(buyer.credit_balance) > 0 ? (
                        <span className="text-orange-600 font-medium">
                          {formatCurrency(Number(buyer.credit_balance))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/buyers/${buyer.id}`}>View</Link>
                        </Button>
                        <DeleteBuyerButton buyerId={buyer.id} buyerName={buyer.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
