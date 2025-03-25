"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle, FileText, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

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
        "pitch-match-prompt": string;
        "pitch-product-prompt": string;
        "pitch-cta-prompt": string;
    };
}

export default function CopywriterTaskList() {
    const [records, setRecords] = useState<AirtableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visiblePrompt, setVisiblePrompt] = useState<string | null>(null);
    const [editablePrompt, setEditablePrompt] = useState<string>("");
    const [editablePromptType, setEditablePromptType] = useState<"pitch-match" | "pitch-product" | "pitch-cta" | "">("");

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

    if (loading) return <div className="p-6 text-center">Loading emails...</div>;
    if (records.length === 0) return <div className="p-6 text-center">No emails found.</div>;

    const record = records[currentIndex];

    const handlePromptClick = (type: "pitch-match" | "pitch-product" | "pitch-cta") => {
        setVisiblePrompt(record.fields[`${type}-prompt`] || "No prompt available");
        setEditablePrompt(record.fields[`${type}-prompt`] || "");
        setEditablePromptType(type);
    };

    const savePrompt = async () => {
        try {
            const res = await fetch("/api/airtable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    airtableRecords: [{
                        id: record.id,
                        fields: {
                            [`${editablePromptType}-prompt`]: editablePrompt,
                        },
                    }],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Prompt saved");
            setRecords(prev =>
                prev.map(r => r.id === record.id ? {
                    ...r,
                    fields: { ...r.fields, [`${editablePromptType}-prompt`]: editablePrompt }
                } : r)
            );
            setVisiblePrompt(null);
        } catch (e) {
            toast.error("Failed to save prompt");
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10 h-screen flex flex-col">
            <div className="flex-grow flex gap-6">
                {/* Email Section */}
                <Card className="flex-1 min-h-full">
                    <CardHeader>
                        <CardTitle>AI Email for {record.fields["First Name"]}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Hey {record.fields["First Name"]},</p>

                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-match")}
                            title="Click to view/edit prompt"
                        >
                            {record.fields["pitch-match"] || "No pitch-match available"}
                        </p>

                        <p className="mt-2">I looked into {record.fields["Company name"]} and saw your profile.</p>
                        <p className="mt-2">Since you're the {record.fields["Title"]}, I wanted to reach out.</p>

                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-product")}
                            title="Click to view/edit prompt"
                        >
                            {record.fields["pitch-product"] || "No pitch-product available"}
                        </p>

                        <p
                            className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"
                            onClick={() => handlePromptClick("pitch-cta")}
                            title="Click to view/edit prompt"
                        >
                            {record.fields["pitch-cta"] || "No pitch-cta available"}
                        </p>

                        <p className="mt-4">Best,</p>
                        <p>TBD</p>
                    </CardContent>
                </Card>

                {/* Metadata Section */}
                <Card className="w-1/3 min-h-full">
                    <CardHeader>
                        <CardTitle>Client Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>Client:</strong> {record.fields["client id"]}</p>
                        <p><strong>Website:</strong> <a className="text-blue-600" href={`https://${record.fields["Website"]}`} target="_blank">{record.fields["Website"]}</a></p>
                        <p><strong>Slack:</strong> <a className="text-blue-600" href={record.fields["client slack"]} target="_blank">Slack Link</a></p>
                        <p><strong>Onboarding Doc:</strong> <a className="text-blue-600" href={record.fields["client onboarding doc"]} target="_blank">View Doc</a></p>
                    </CardContent>
                </Card>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-6 space-x-4">
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}>Previous</Button>
                <span>Page {currentIndex + 1} of {records.length}</span>
                <Button variant="outline" disabled={currentIndex === records.length - 1} onClick={() => setCurrentIndex(i => i + 1)}>Next</Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-evenly items-center mt-6">
                <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => {
                        toast.success("✅ Approved and Sent!");
                        // TODO: Implement approve and send logic
                    }}
                >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Approve and Send
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={async () => {
                        try {
                            const response = await fetch("/api/clickup", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    taskId: record.fields["clickup task id"],
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
                    <FileText className="h-4 w-4 text-yellow-500" />
                    Review Manually
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={async () => {
                        try {
                            const res = await fetch("/api/ai-workflow", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    recordId: record.id,
                                    runWithSavedPrompt: true
                                }),
                            });

                            const data = await res.json();
                            if (!res.ok || !data.result) throw new Error(data.error || "Failed to re-run AI");

                            toast.success("✅ AI re-run successful");

                            setRecords(prev =>
                                prev.map(r => r.id === record.id ? {
                                    ...r,
                                    fields: {
                                        ...r.fields,
                                        "pitch-match": data.result.pitchMatch,
                                        "pitch-product": data.result.pitchProduct,
                                        "pitch-cta": data.result.pitchCta,
                                    }
                                } : r)
                            );
                        } catch (err) {
                            console.error(err);
                            toast.error("❌ Failed to re-run AI");
                        }
                    }}
                >
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    Re-run AI
                </Button>
            </div>

            {/* Prompt Modal */}
            {visiblePrompt !== null && (
                <div className="fixed bottom-6 left-6 right-6 max-w-3xl mx-auto bg-white shadow-xl border border-gray-300 p-4 rounded z-50">
                    <div className="flex justify-between mb-2">
                        <h2 className="text-sm font-semibold">Edit Prompt</h2>
                        <button onClick={() => setVisiblePrompt(null)}>✕</button>
                    </div>
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
            )}
        </div>
    );
}
