"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
    const handleClickUpAuth = () => {
        const clientId = process.env.NEXT_PUBLIC_CLICKUP_CLIENT_ID

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/api/auth/callback`

        window.location.href = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`

    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Your Copyrighting Tasks (Ready for AI)</CardTitle>
              <CardDescription>Connect with ClickUp to view your "READY FOR AI" tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleClickUpAuth} className="w-full">
                Connect with ClickUp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    