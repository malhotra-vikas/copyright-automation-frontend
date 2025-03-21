"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ExternalLink, CheckCircle, FileText } from "lucide-react";
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
        "client-google-drive": string;
    };
}

export default function AIReview() {
    const router = useRouter();
    const params = useParams();
    const taskId = params?.taskid;
    const [emails, setEmails] = useState<AirtableRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visiblePrompt, setVisiblePrompt] = useState<string | null>(null);
    const [editablePrompt, setEditablePrompt] = useState<string>("");
    const [editablePromptType, setEditablePromptType] = useState<"pitch-match" | "pitch-product" | "pitch-cta" | "">("");
    
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

    // Get the current email record
    const record = emails[currentIndex];

    function approveAndSend(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
        throw new Error("Function not implemented.");
    }

    async function reviewManually() {
        console.log(`🔄 Marking ClickUp Task ${record.fields["clickup task id"]} as "REVIEW MANUALLY"`);

        // ✅ Step 1: Set ClickUp task status to "REVIEW MANUALLY"
        const response = await fetch("/api/clickup", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskId: record.fields["clickup task id"],
                status: "REVIEW MANUALLY",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to update ClickUp task status.");
        }

        console.log("✅ ClickUp task updated successfully. Redirecting to dashboard...");
        toast.success("✅ ClickUp task updated successfully. Redirecting to dashboard...")

        // ✅ Step 2: Redirect to the dashboard
        router.push("/dashboard");
    }

    // ✅ Update a Single Airtable Record with AI-Generated Data
    async function updateAirtableRecord(recordId: string, pitchMatch: string, pitchProduct: string, pitchCta: string) {
        try {
            console.log(`🔄 Updating Airtable record ${recordId} with AI-generated pitch`);

            const recordsToUpdate = [
                {
                    id: recordId, // Airtable Record ID
                    fields: {
                        "pitch-match": pitchMatch || "No summary available",
                        "pitch-product": pitchProduct || "No summary available",
                        "pitch-cta": pitchCta || "No summary available",
                        "status": "processed" // Optional: update the status to indicate AI processing is complete
                    }
                }
            ];

            const airtableUpdatedResponse = await fetch("/api/airtable", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ airtableRecords: recordsToUpdate }),
            });

            const airtableData = await airtableUpdatedResponse.json();

            if (!airtableUpdatedResponse.ok || !airtableData.success) {
                throw new Error(`Failed to update Airtable: ${JSON.stringify(airtableData.error)}`);
            }

            console.log(`✅ Airtable Record ${recordId} updated successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Error updating Airtable Record ${recordId}:`, error);
            return false;
        }
    }

    async function reRunAI() {
        if (!record) return;

        setLoading(true);

        try {

            console.log(`🔄 Sending AI re-run request for Record ID: ${record.id}`);

            const response = await fetch("/api/ai-workflow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    recordId: record.id, // Use latest record ID
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to re-run AI.");
            }

            console.log("✅ AI Re-run Successful:", data);

            // ✅  Update the relevent Air Table Record with the AI Generated Pitch
            const updated = await updateAirtableRecord(record.id, data.result.pitchMatchSummary, data.result.pitchProductSummary, data.result.pitchCtaSummary);

            if (updated) {
                console.log("✅ Airtable record successfully updated.");
                toast.success("✅ Airtable record successfully updated.")
            } else {
                console.warn("⚠️ Airtable record update failed.");
            }


            // ✅ Update UI with new AI-generated content
            setEmails((prevEmails) =>
                prevEmails.map((email) =>
                    email.id === record.id
                        ? {
                            ...email,
                            fields: {
                                ...email.fields,
                                "pitch-match": data.result.pitchMatchSummary,
                                "pitch-product": data.result.pitchProductSummary,
                                "pitch-cta": data.result.pitchCtaSummary
                            }
                        }
                        : email
                )
            );
        } catch (error) {
            console.error("❌ Error re-running AI:", error);
            alert("Failed to re-run AI. Please try again later.");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="max-w-6xl mx-auto py-10 h-screen flex flex-col">
            <div>
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-5 w-5" /> Back to Tasks
                </Button>
            </div>

            {/* 📧 Two-column layout with full height */}
            <div className="flex flex-grow gap-6">
                {/* 📧 Email Preview Section (Larger - 65%) */}
                <Card className="flex-1 min-h-full">
                    <CardHeader>
                        <CardTitle>AI-Generated Outreach Email</CardTitle>
                        <p className="text-sm text-muted-foreground">Highlighted text is AI-generated</p>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between h-full">
                        <div className="flex-grow">
                            <p><strong>Hey {record.fields["First Name"]},</strong></p>
                            <p
                                className="bg-green-100 px-2 py-1 inline-block rounded text-green-900 cursor-pointer"

                                onClick={() => {
                                    const type = "pitch-match";
                                    setVisiblePrompt(record.fields[`${type}-prompt`] || "No prompt available");
                                    setEditablePrompt(record.fields[`${type}-prompt`] || "");
                                    setEditablePromptType(type);
                                }}
                                                            
                                title="Click to view prompt"
                            >
                                {record.fields["pitch-match"] || "No pitch-match available"}
                            </p>

                            <p className="mt-2">
                                This intrigued me, so i researched your company ({record.fields["Company name"]}) a little more and came across your profile.
                            </p>
                            <p className="mt-2">
                                Given you are the {record.fields["Title"]} of the company, i figured it would make sense to reach out.
                            </p>
                            <p
                                className="bg-green-100 mt-2 cursor-pointer px-2 py-1 inline-block rounded text-green-900"
                                onClick={() => {
                                    const type = "pitch-product";
                                    setVisiblePrompt(record.fields[`${type}-prompt`] || "No prompt available");
                                    setEditablePrompt(record.fields[`${type}-prompt`] || "");
                                    setEditablePromptType(type);
                                }}                                
                                title="Click to view prompt"
                            >
                                {record.fields["pitch-product"] || "No pitch-product available"}
                            </p>

                            <p
                                className="bg-green-100 mt-2 cursor-pointer px-2 py-1 inline-block rounded text-green-900"
                                onClick={() => {
                                    const type = "pitch-cta";
                                    setVisiblePrompt(record.fields[`${type}-prompt`] || "No prompt available");
                                    setEditablePrompt(record.fields[`${type}-prompt`] || "");
                                    setEditablePromptType(type);
                                }}                                
                                title="Click to view prompt"
                            >
                                {record.fields["pitch-cta"] || "No pitch-cta available"}
                            </p>


                            <p className="mt-4">Best,</p>
                            <p>TBD</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 📜 Key Artifacts Section (Smaller - 35%) */}
                <Card className="w-1/3 min-h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Key Artifacts</CardTitle>
                        <p className="text-sm text-muted-foreground">Client details & important links</p>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div>
                            <p className="text-sm font-semibold">Client:</p>
                            <p className="text-muted-foreground">{record.fields["client id"] || "N/A"}</p>
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Website:</p>
                            {record.fields["Website"] ? (
                                <a
                                    href={record.fields["Website"].startsWith("http") ? record.fields["Website"] : `https://${record.fields["Website"]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center"
                                >
                                    {record.fields["Website"]} <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                            ) : (
                                <p className="text-muted-foreground">N/A</p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Slack:</p>
                            {record.fields["client slack"] ? (
                                <a
                                    href={record.fields["client slack"].startsWith("http") ? record.fields["client slack"] : `https://${record.fields["client slack"]}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center">
                                    Go to Slack <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                            ) : (
                                <p className="text-muted-foreground">N/A</p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Onboarding Doc:</p>
                            {record.fields["client onboarding doc"] ? (
                                <a
                                    href={record.fields["client onboarding doc"].startsWith("http") ? record.fields["client onboarding doc"] : `https://${record.fields["client onboarding doc"]}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center">
                                    View Onboarding Document <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                            ) : (
                                <p className="text-muted-foreground">N/A</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-6 space-x-4">
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((prev) => prev - 1)}>
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentIndex + 1} of {emails.length}
                </span>
                <Button variant="outline" disabled={currentIndex === emails.length - 1} onClick={() => setCurrentIndex((prev) => prev + 1)}>
                    Next
                </Button>
            </div>

            {/* ✅ Action Buttons */}
            <div className="flex justify-evenly items-center mt-6">
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={approveAndSend} disabled={loading}>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {loading ? "Updating..." : "Approve and Send"}
                </Button>

                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={reviewManually} disabled={loading}>
                    <FileText className="h-4 w-4 text-yellow-500" />
                    {loading ? "Updating...." : "Review Manually"}
                </Button>

                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={reRunAI} disabled={loading}>
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    {loading ? "Re-running..." : "Re-run AI"}
                </Button>

            </div>
            {visiblePrompt !== null && (
                <div className="fixed bottom-6 left-6 right-6 max-w-3xl mx-auto bg-white shadow-xl border border-gray-300 p-4 rounded z-50">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="font-semibold text-sm text-gray-700">Edit Prompt</h2>
                        <button
                            onClick={() => setVisiblePrompt(null)}
                            className="ml-4 text-gray-500 hover:text-black font-semibold"
                        >
                            ✕
                        </button>
                    </div>
                    <textarea
                        className="w-full border p-2 rounded text-sm text-gray-700 mb-3"
                        rows={6}
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisiblePrompt(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const res = await fetch("/api/airtable", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            airtableRecords: [{
                                                id: record.id,
                                                fields: {
                                                    [`${editablePromptType}-prompt`]: editablePrompt,
                                                }
                                            }]
                                        })
                                    });
                                    const result = await res.json();
                                    if (!res.ok) throw new Error(result.error || "Failed to save prompt");

                                    toast.success("✅ Prompt saved successfully!");
                                    setVisiblePrompt(null);
                                } catch (error) {
                                    toast.error("❌ Failed to save prompt");
                                    console.error(error);
                                }
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}


        </div>
    );
}
