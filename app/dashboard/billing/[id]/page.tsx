"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Printer, Download } from "lucide-react"
import type { FarmerBill, Farmer } from "@/lib/types"
import { unwrapRelation } from "@/lib/utils"

type BillSale = {
  id: string
  sale_date: string
  quantity: number
  rate: number
  total_amount: number
  lot?: { item?: { name: string; unit?: string } | null } | null
  buyer?: { name: string } | null
}

interface BillWithDetails extends Omit<FarmerBill, "arrival"> {
  arrival: { id: string; arrival_date: string; farmer: Farmer | null }
  sales: BillSale[]
}

function normalizeSales(raw: unknown[]): BillSale[] {
  return raw.map((row) => {
    const s = row as Record<string, unknown>
    const lotRaw = unwrapRelation(s.lot as Record<string, unknown> | Record<string, unknown>[] | null)
    const buyerRaw = unwrapRelation(s.buyer as { name: string } | { name: string }[] | null)
    let lot: BillSale["lot"]
    if (lotRaw && typeof lotRaw === "object" && "item" in lotRaw) {
      const item = unwrapRelation(
        lotRaw.item as { name: string; unit?: string } | { name: string; unit?: string }[] | null
      )
      lot = { item: item ?? undefined }
    } else {
      lot = undefined
    }
    return {
      id: String(s.id),
      sale_date: String(s.sale_date),
      quantity: Number(s.quantity),
      rate: Number(s.rate),
      total_amount: Number(s.total_amount),
      lot,
      buyer: buyerRaw ?? undefined,
    }
  })
}

export default function BillViewPage() {
  const params = useParams()
  const router = useRouter()
  const [bill, setBill] = useState<BillWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBill() {
      const supabase = createClient()
      const id = String(params.id)

      const { data: billData } = await supabase
        .from("farmer_bills")
        .select(`
          *,
          arrival:arrivals(
            id,
            arrival_date,
            farmer:farmers(*)
          )
        `)
        .eq("id", id)
        .single()

      if (!billData) {
        setLoading(false)
        return
      }

      const arrivalRow = unwrapRelation(
        billData.arrival as
          | { id: string; arrival_date: string; farmer: Farmer | Farmer[] | null }
          | null
      )
      const farmer = arrivalRow
        ? unwrapRelation(arrivalRow.farmer as Farmer | Farmer[] | null)
        : null

      const { data: lotsData } = await supabase
        .from("lots")
        .select("id")
        .eq("arrival_id", billData.arrival_id)

      const lotIds = lotsData?.map((l) => l.id) ?? []
      let sales: BillSale[] = []

      if (lotIds.length > 0) {
        const { data: salesData } = await supabase
          .from("sales")
          .select(`
            *,
            lot:lots(
              *,
              item:items(name, unit)
            ),
            buyer:buyers(name)
          `)
          .in("lot_id", lotIds)
          .order("sale_date", { ascending: true })

        sales = normalizeSales(salesData || [])
      }

      const billRow = billData as FarmerBill

      setBill({
        ...billRow,
        arrival: {
          id: arrivalRow?.id ?? billData.arrival_id,
          arrival_date: arrivalRow?.arrival_date ?? billData.bill_date,
          farmer,
        },
        sales,
      })

      setLoading(false)
    }

    fetchBill()
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Bill not found</p>
      </div>
    )
  }

  const billLabel = `Bill #${bill.id.slice(0, 8)}`
  const farmer = bill.arrival.farmer

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl">Farmer Bill</CardTitle>
          <p className="text-muted-foreground">{billLabel}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Farmer Details</h3>
              <p className="text-lg font-medium">{farmer?.name ?? "—"}</p>
              <p className="text-muted-foreground">{farmer?.phone || "—"}</p>
              <p className="text-muted-foreground">{farmer?.address || "—"}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-2">Arrival & bill</h3>
              <p>
                Arrival: {new Date(bill.arrival.arrival_date).toLocaleDateString()}
              </p>
              <p className="text-muted-foreground">
                Generated: {new Date(bill.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Sales Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.lot?.item?.name || "N/A"}</TableCell>
                    <TableCell>{sale.buyer?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">Rs. {Number(sale.rate).toLocaleString()}</TableCell>
                    <TableCell className="text-right">Rs. {Number(sale.total_amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between">
                <span>Gross Amount:</span>
                <span className="font-medium">Rs. {Number(bill.total_sales).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Commission (
                  {bill.total_sales > 0
                    ? ((bill.commission_amount / Number(bill.total_sales)) * 100).toFixed(1)
                    : "0"}
                  %):
                </span>
                <span>- Rs. {Number(bill.commission_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Unloading Charges:</span>
                <span>- Rs. {Number(bill.unloading_charges).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Loading Charges:</span>
                <span>- Rs. {Number(bill.loading_charges ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Net Payable:</span>
                <span className="text-primary">Rs. {Number(bill.net_payable).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [class*="Card"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [class*="Card"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  )
}
