"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface AirtableRecord {
    id: string;
    fields: {
        "full name": string;
        "First Name": string;
        "Final email": string;
        "Title": string;
        "Company name": string;
        "Website": string;
        "client id": string;
        "client slack": string;
        "client onboarding doc": string;
        "status": string;
        "clickup task id": string;
        "pitch-match": string;
        "pitch-product": string;
        "pitch-cta": string;
    };
}

const ITEMS_PER_PAGE = 5;

export default function AIReview() {
    const router = useRouter();
    const params = useParams();
    const taskId = params?.taskid; // Ensure `taskId` exists
    const [emails, setEmails] = useState<AirtableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!taskId) return;

        const fetchEmails = async () => {
            try {
                console.log(`📡 Fetching processed Airtable records for task ID: ${taskId}`);
                const response = await fetch(`/api/airtable?taskId=${taskId}&status=processed`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch AI-generated emails.");
                }

                console.log("✅ Received Airtable Data:", data.records);
                setEmails(data.records);
            } catch (error) {
                console.error("❌ Error fetching AI-generated emails:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [taskId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg text-gray-500">
                Loading AI-generated emails...
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-lg text-gray-500">
                <p>No AI-generated emails found.</p>
                <Button variant="ghost" onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="h-5 w-5" /> Back to Tasks
                </Button>
            </div>
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(emails.length / ITEMS_PER_PAGE);
    const paginatedEmails = emails.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="max-w-3xl mx-auto py-10">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-5 w-5" /> Back to Tasks
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>AI-Generated Outreach Emails</CardTitle>
                    <p className="text-sm text-muted-foreground">Highlighted text is AI-generated</p>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-6">
                        {paginatedEmails.map((record) => (
                            <li key={record.id} className="bg-gray-100 p-4 rounded-lg shadow">
                                <p>
                                    <strong>Hey {record.fields["First Name"]},</strong>
                                </p>
                                <p className="bg-green-100 px-2 py-1 inline-block rounded text-green-900">
                                    {record.fields["pitch-match"] || "No pitch-match available"}
                                </p>
                                <p className="mt-2">
                                    This intrigued me, and I am now doing something and the other.
                                </p>
                                <p className="mt-4">Best,</p>
                                <p>Vikas</p>

                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-xs text-gray-500">Generated for {record.fields["Company name"]}</p>
                                    <Button size="sm" variant="ghost" className="flex items-center gap-1">
                                        <RefreshCw className="h-4 w-4" /> Re-run AI
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center mt-6 space-x-2">
                        <Button
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
