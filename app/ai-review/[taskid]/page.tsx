"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"

const dummyEmails = [
    "🚀 AI-generated Subject Line: **Unlock exclusive benefits today!**",
    "Hello [Name],\n\nWe noticed your interest in [Product/Service]. Here's how we can help...\n\n[AI-generated solution benefits]",
    "👀 Special Offer: **20% discount for a limited time!**\n\nClick here to claim your exclusive deal."
]

export default function AIReview() {    
    const router = useRouter()
    const params = useParams()
    const taskId = params?.taskid // Ensure `taskId` exists
    const [emails, setEmails] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log("✅ useEffect triggered. taskId:", taskId) // Debugging

        if (taskId) {
            console.log("🟢 Setting AI-generated emails...")
            setEmails(dummyEmails) // Replace with actual API call
            setLoading(false)
        } else {
            console.warn("⚠️ taskId is missing. Params received:", params)
        }
    }, [taskId])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg text-gray-500">
                Loading AI-generated emails...
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-10">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-5 w-5" /> Back to Tasks
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>AI-Generated Outreach Emails</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {emails.length === 0 ? (
                            <p className="text-gray-500">No emails generated yet.</p>
                        ) : (
                            emails.map((email, index) => (
                                <li key={index} className="bg-gray-100 p-3 rounded">
                                    <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => console.log(`Edited Email: ${e.currentTarget.textContent}`)}
                                        className="outline-none cursor-text border-b-2 border-transparent hover:border-blue-500 transition-all"
                                    >
                                        {email}
                                    </span>
                                    <Button size="xs" variant="ghost" className="ml-2">
                                        <RefreshCw className="h-4 w-4" /> Re-run AI
                                    </Button>
                                </li>
                            ))
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
