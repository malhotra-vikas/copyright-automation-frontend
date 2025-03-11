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
    const { taskId } = useParams()
    const [emails, setEmails] = useState<string[]>([])

    useEffect(() => {
        if (taskId) {
            setEmails(dummyEmails) // Replace with API call to fetch AI-generated emails
        }
    }, [taskId])

    const rerunAIForSection = async (emailIndex: number, newPrompt: string) => {
        console.log(`📡 Re-running AI for Task ${taskId}, Email Section ${emailIndex} with prompt:`, newPrompt)
        await new Promise(res => setTimeout(res, 1500)) // Simulated AI Reprocessing

        setEmails(prevEmails =>
            prevEmails.map((email, index) =>
                index === emailIndex ? `✨ AI Refined: ${newPrompt} 🚀` : email
            )
        )
        alert(`✅ AI has refined the selected section!`)
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
                        {emails.map((email, index) => (
                            <li key={index} className="bg-gray-100 p-3 rounded">
                                <span
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => rerunAIForSection(index, e.currentTarget.textContent || email)}
                                    className="outline-none cursor-text border-b-2 border-transparent hover:border-blue-500 transition-all"
                                >
                                    {email}
                                </span>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => rerunAIForSection(index, email)}
                                    className="ml-2"
                                >
                                    <RefreshCw className="h-4 w-4" /> Re-run AI
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
