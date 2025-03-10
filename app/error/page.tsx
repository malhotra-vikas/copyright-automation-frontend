"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"

export default function ErrorPage() {
    const searchParams = useSearchParams()
    const errorMessage = searchParams.get("message") || "An unknown error occurred"

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <CardTitle>Error</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{errorMessage}</p>
                </CardContent>
                <CardFooter>
                    <Link href="/" className="w-full">
                        <Button className="w-full">
                            <Home className="mr-2 h-4 w-4" />
                            Return to Home
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

