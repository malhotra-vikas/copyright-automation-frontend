"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ExternalLink, CheckCircle, FileText, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
}

export default function CopywriterTaskList() {
    const [records, setRecords] = useState<AirtableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [visiblePrompt, setVisiblePrompt] = useState<string | null>(null);
    const [editablePrompt, setEditablePrompt] = useState<string>("");
    const [editablePromptType, setEditablePromptType] = useState<"pitch-match" | "pitch-product" | "pitch-cta" | "">("");

    const [taskIndex, setTaskIndex] = useState(0);
    const [emailIndex, setEmailIndex] = useState(0);

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [currentEmailIndex, setCurrentEmailIndex] = useState(0);


    // Group emails by ClickUp Task ID
    const recordsByTask: Record<string, AirtableRecord[]> = records.reduce((acc, record) => {
        const taskId = record.fields["clickup task id"];
        if (!acc[taskId]) acc[taskId] = [];
        acc[taskId].push(record);
        return acc;
    }, {} as Record<string, AirtableRecord[]>);

    const taskIds = Object.keys(recordsByTask);
    const currentTaskId = taskIds[currentTaskIndex];
    const currentTaskRecords = recordsByTask[currentTaskId] || [];
    const currentRecord = currentTaskRecords[currentEmailIndex];

    // Navigation helpers
    const totalTasks = taskIds.length;
    const totalEmailsInCurrentTask = currentTaskRecords.length;

    const sendSlackMessage = async () => {
        // Define the message data to send to Slack
        const messageData = {
            text: 'Hello from my Next.js app!',
            attachments: [
                {
                    fallback: 'This is a fallback text',
                    text: 'Here is an attachment with more details.',
                    color: '#36a64f',
                },
            ],
        };

        try {
            // Call the backend API route to send the message to Slack
            const response = await fetch('/api/slack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
            });

            if (response.ok) {
                // Show success toast when message is sent successfully
                toast.success('✅ Approved and Sent!');
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message to Slack:', error);
            toast.error('❌ Error sending message');
        }
    };


    useEffect(() => {
        const fetchAllRecords = async () => {
            try {
                const res = await fetch("/api/airtable?status=processed");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setRecords(data.records);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load emails");
            } finally {
                setLoading(false);
            }
        };

        fetchAllRecords();
    }, []);

    const handlePromptClick = (type: "pitch-match" | "pitch-product" | "pitch-cta") => {
        setVisiblePrompt(currentRecord.fields[`${type}-prompt`] || "");
        setEditablePrompt(currentRecord.fields[`${type}-prompt`] || "");
        setEditablePromptType(type);
    };

    const savePrompt = async () => {
        try {
            const res = await fetch("/api/airtable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    airtableRecords: [
                        {
                            id: currentRecord.id,
                            fields: {
                                [`${editablePromptType}-prompt`]: editablePrompt,
                            },
                        },
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Prompt saved");

            setRecords(prev =>
                prev.map(r =>
                    r.id === currentRecord.id
                        ? {
                            ...r,
                            fields: { ...r.fields, [`${editablePromptType}-prompt`]: editablePrompt },
                        }
                        : r
                )
            );

            setVisiblePrompt(null);
        } catch (e) {
            toast.error("Failed to save prompt");
        }
    };

    if (loading) return <div className="p-6 text-center">Loading emails...</div>;
    if (!currentRecord) return <div className="p-6 text-center">No records found.</div>;

    return (
        <div className="w-full max-w-[1440px] mx-auto py-10 flex flex-col gap-6 h-screen">
            <div className="flex flex-grow gap-4">
                {/* Left: Email Card */}
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>AI Email for {currentRecord.fields["First Name"]}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                        <p>Hey {currentRecord.fields["First Name"]},</p>
                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-match")}
                        >
                            {currentRecord.fields["pitch-match"] || "No pitch-match"}
                        </p>
                        <p>I looked into {currentRecord.fields["Company name"]} and saw your profile.</p>
                        <p>Since you're the {currentRecord.fields["Title"]}, I wanted to reach out.</p>
                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-product")}
                        >
                            {currentRecord.fields["pitch-product"] || "No pitch-product"}
                        </p>
                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-cta")}
                        >
                            {currentRecord.fields["pitch-cta"] || "No pitch-cta"}
                        </p>
                        <p className="mt-4">Best,</p>
                        <p>TBD</p>
                    </CardContent>
                </Card>

                {/* Right: Client Info */}
                <Card className="w-1/3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Client Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
                        <p><strong>Client:</strong> {currentRecord.fields["client id"]}</p>
                        <p><strong>Website:</strong> <a className="text-blue-600" href={`https://${currentRecord.fields["Website"]}`} target="_blank">{currentRecord.fields["Website"]}</a></p>
                        <p><strong>Slack:</strong> <a className="text-blue-600" href={currentRecord.fields["client slack"]} target="_blank">Slack Link</a></p>
                        <p><strong>Onboarding Doc:</strong> <a className="text-blue-600" href={currentRecord.fields["client onboarding doc"]} target="_blank">View Doc</a></p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                {/* Task Pagination */}
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        disabled={currentTaskIndex === 0}
                        onClick={() => {
                            setCurrentTaskIndex((i) => i - 1);
                            setCurrentEmailIndex(0); // reset to first email of new task
                        }}
                    >
                        ⬅ Prev Task ({currentTaskIndex + 1}/{taskIds.length})
                    </Button>

                    <Button
                        variant="outline"
                        disabled={currentTaskIndex === taskIds.length - 1}
                        onClick={() => {
                            setCurrentTaskIndex((i) => i + 1);
                            setCurrentEmailIndex(0); // reset to first email of new task
                        }}
                    >
                        Next Task ➡ ({currentTaskIndex + 2}/{taskIds.length})
                    </Button>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={sendSlackMessage}
                    >
                        <CheckCircle className="h-4 w-4 text-green-500" /> Approve and Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                            try {
                                const response = await fetch("/api/clickup", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        taskId: currentRecord.fields["clickup task id"], // Updated here to use currentRecord
                                        status: "REVIEW MANUALLY",
                                    }),
                                });

                                const data = await response.json();
                                if (!response.ok) throw new Error(data.error || "Failed to update task");

                                toast.success("✅ Marked as Review Manually");
                            } catch (err) {
                                console.error(err);
                                toast.error("❌ Failed to mark task");
                            }
                        }}
                    >
                        <FileText className="h-4 w-4 text-yellow-500" /> Review Manually
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                            const res = await fetch("/api/ai-workflow", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ recordId: currentRecord.id, runWithSavedPrompt: true }),
                            });
                            const data = await res.json();
                            if (!res.ok) return toast.error(data.error);
                            toast.success("AI Re-run successful!");
                        }}
                    >
                        <RefreshCw className="h-4 w-4 text-blue-500" /> Re-run AI
                    </Button>
                </div>

                {/* Email Pagination */}
                <div className="space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEmailIndex(i => Math.max(i - 1, 0))}
                        disabled={emailIndex === 0}
                    >
                        ← Prev Email ({emailIndex + 1}/{totalEmailsInCurrentTask})
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEmailIndex(i => Math.min(i + 1, totalEmailsInCurrentTask - 1))}
                        disabled={emailIndex === totalEmailsInCurrentTask - 1}
                    >
                        Next Email → ({emailIndex + 1}/{totalEmailsInCurrentTask})
                    </Button>
                </div>
            </div>

            {/* Prompt Modal */}
            {visiblePrompt !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded p-6 w-full max-w-xl shadow-lg">
                        <h2 className="text-md font-semibold mb-2">Edit Prompt</h2>
                        <textarea
                            className="w-full border p-2 rounded text-sm text-gray-700 mb-3"
                            rows={6}
                            value={editablePrompt}
                            onChange={(e) => setEditablePrompt(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setVisiblePrompt(null)}>Cancel</Button>
                            <Button onClick={savePrompt}>Save</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
