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
import { Plus, Phone, MapPin } from 'lucide-react'
import { DeleteFarmerButton } from '@/components/farmers/delete-farmer-button'

async function getFarmers() {
  const supabase = await createClient()
  const { data: farmers } = await supabase
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false })

  return farmers || []
}

export default async function FarmersPage() {
  const farmers = await getFarmers()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farmers</h1>
          <p className="text-muted-foreground">
            Manage farmers who bring produce to your mandi
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/farmers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Farmer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Farmers</CardTitle>
          <CardDescription>
            {farmers.length} {farmers.length === 1 ? 'farmer' : 'farmers'} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {farmers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No farmers registered yet</p>
              <Button asChild>
                <Link href="/dashboard/farmers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first farmer
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
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>
                      {farmer.phone ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {farmer.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {farmer.address ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {farmer.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(farmer.created_at).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/farmers/${farmer.id}`}>View</Link>
                        </Button>
                        <DeleteFarmerButton farmerId={farmer.id} farmerName={farmer.name} />
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
