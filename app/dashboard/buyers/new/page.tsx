import { BuyerForm } from '@/components/buyers/buyer-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewBuyerPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add New Buyer</CardTitle>
            <CardDescription>
              Register a new buyer who will purchase from your mandi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BuyerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
