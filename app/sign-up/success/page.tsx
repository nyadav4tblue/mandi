import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Leaf className="h-8 w-8" />
              <span className="text-2xl font-bold">Mandi Manager</span>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription className="mt-2">
            We have sent you a confirmation link. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            After confirming your email, you can sign in to start managing your mandi business.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
