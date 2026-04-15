import { FarmerForm } from '@/components/farmers/farmer-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewFarmerPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add New Farmer</CardTitle>
            <CardDescription>
              Register a new farmer who will bring produce to your mandi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FarmerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
