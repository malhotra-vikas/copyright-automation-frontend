"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Search, ChevronLeft, ChevronRight, ExternalLink, Zap, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import type { ClickUpTask } from "@/lib/clickup"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"


interface TaskListProps {
    tasks: ClickUpTask[]
}
export default function TaskList({ initialTasks }: { initialTasks: ClickUpTask[] }) {
    const [tasks, setTasks] = useState<ClickUpTask[]>(initialTasks);

    const router = useRouter()

    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = Number(process.env.NEXT_PUBLIC_CLICKUP_TASKS_PER_PAGE) || 6;

    // Track AI processing and completion states
    const [processingTasks, setProcessingTasks] = useState<Record<string, boolean>>({})
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await fetch("/api/clickup"); // Fetch from API Route
                const data = await res.json();
                setTasks(data);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        }
        fetchTasks();
    }, []);

    // **Filter tasks based on search query**
    const filteredTasks = tasks.filter(
        (task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // **Pagination Logic**
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
    const displayedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // **Helper: Print and Log All Custom Fields**
    const logAllCustomFields = (task: any) => {
        console.log(`📝 Task: ${task.name} (ID: ${task.id}) - Available Custom Fields:`)
        task.custom_fields.forEach((field: any) => {
            console.log(`   - ${field.name}: ${field.value || "N/A"}`)
        });
    };

    // **Helper: Extract Custom Fields**
    const getCustomFieldValue = (task: any, fieldNames: string[]): string | null => {
        const field = task.custom_fields.find((field: any) =>
            fieldNames.includes(field.name.toLowerCase())
        );
        return field?.value || null;
    };

    // **Modified Extraction Functions**
    const getClientFromTask = async (task: any): Promise<string> => {
        logAllCustomFields(task); // Debugging: Log all fields
        return getCustomFieldValue(task, ["client", "client name", "client-name"]);
    };

    const getClientSlackFromTask = async (task: any): Promise<string> => {
        return getCustomFieldValue(task, ["slack", "client slack"]);
    };

    const getClientOnboardingDocFromTask = async (task: any): Promise<string> => {
        return getCustomFieldValue(task, ["onboarding document", "client onboarding doc"]);
    };

    const getClientLeadsGoogleSheetFromTask = async (task: any): Promise<string> => {
        return getCustomFieldValue(task, ["client-leads-list", "final approved list"]);
    };

    const getClientGoogleDriveFromTask = async (task: any): Promise<string> => {
        return getCustomFieldValue(task, ["client-google-drive", "google drive link"]);
    };

    const getClientWebsiteFromTask = async (task: any): Promise<string> => {
        return getCustomFieldValue(task, ["client-website", "website"]);
    };

    const triggerAIWorkflow = async (taskList: ClickUpTask[]) => {
        if (taskList.length === 0) return

        console.log("📡 Sending tasks to server for AI processing:", taskList.map(t => t.name))

        const taskUpdates = Object.fromEntries(taskList.map(task => [task.id, true]))
        setProcessingTasks(prev => ({ ...prev, ...taskUpdates }))

        try {
            for (const task of taskList) {
                console.log(`📡 Processing Task: ${task.name} (ID: ${task.id})`);

                // ✅ Step 0: Set Click Up task status to AI PROCESSING
                await fetch("/api/clickup", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ taskId: task.id, status: "AI PROCESSING" }),
                });

                const clientGoogleDriveLink = await getClientGoogleDriveFromTask(task)
                const clientWebsiteLink = await getClientWebsiteFromTask(task)
                const clientLeadsGoogleSheetLink = await getClientLeadsGoogleSheetFromTask(task)
                const clientName = await getClientFromTask(task)
                const clientSlack = await getClientSlackFromTask(task)
                const clientOnboardingDoc = await getClientOnboardingDocFromTask(task)

                console.log(clientGoogleDriveLink)
                console.log(clientWebsiteLink)
                console.log(clientLeadsGoogleSheetLink)

                // ✅ Step 1: Store Google Sheet Data in Airtable
                const leadsResponse = await fetch("/api/google-sheet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sheetUrl: clientLeadsGoogleSheetLink }),
                });

                let leads = await leadsResponse.json();
                if (!leadsResponse.ok) throw new Error(leadsResponse.error || "Failed to read the Leads Google Sheet");

                if (!Array.isArray(leads)) {
                    console.error("❌ Error: `leads` is not an array. Fixing format...");
                    leads = Object.values(leads); // Convert object to array if needed
                }

                console.log("✅ Google Sheet Data Read as :", leads);

                const body = { data: leads, client: clientName, slack: clientSlack, onboardindDocument: clientOnboardingDoc, clickupTask: task.id }

                // ✅ Step 2: Sending data to Airtable
                console.log("📡 Sending data to Airtable...", body);

                const airtableResponse = await fetch(`/api/airtable`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                const airtableResult = await airtableResponse.json();

                if (!airtableResponse.ok) {
                    throw new Error(airtableResult.error || "Failed to store data in Airtable");
                }

                console.log("✅ Successfully stored data in Airtable:", airtableResult.storedRecords);

                // ✅ Step 3: Trigger AI Workflow for each Airtable record. 
                // For each wibsite form the AI Built Pitch-Match
                const pitchMatchResponse = await fetch("/api/ai-workflow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        airtableRecords: airtableResult.storedRecords,
                        aiTaskType: "Pitch-Match",
                        testDrive: "Yes"
                    }),
                })

                // ✅ Handle possible empty response
                if (!pitchMatchResponse.ok) {
                    throw new Error(`Server Error: ${pitchMatchResponse.statusText}`);
                }
                const data = await pitchMatchResponse.json();

                // ✅ Check if the response contains expected data
                if (!data || !data.results || !Array.isArray(data.results)) {
                    throw new Error("Invalid response format from server");
                }
                console.log("✅ AI Workflow Results:", data.results);

                // ✅ Step 4: Update the relevent Air Table Record with the AI Generated Pitch

                const recordsToUpdate = data.results.map(record => ({
                    id: record.recordId,  // Airtable Record ID
                    fields: {
                        "pitch-match": record.summary || "No summary available", // Ensure a fallback value
                        "status": "processed" // Optional: update the status to indicate AI processing is complete
                    }
                }));
                
                const airtableUpdatedResponse = await fetch("/api/airtable", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ airtableRecords: recordsToUpdate }),
                });
                
                const updateResult = await airtableUpdatedResponse.json();
                console.log("✅ Successfully updated Airtable records:", updateResult);

                // ✅ **Step 5: Mark This Task as Completed**
                setCompletedTasks(prev => ({ ...prev, [task.id]: "Pitch Processed" }));


                toast.success("🎉 AI workflow completed!")
            }

        } catch (error) {
            console.error("❌ Error triggering AI workflow:", error)
            toast.error("❌ AI processing failed")
        } finally {
            setProcessingTasks(prev => {
                const updated = { ...prev }
                taskList.forEach(task => delete updated[task.id])
                return updated
            })

            //confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        }
    }

    return (
        <div>
            {/* Search & Global AI Action */}
            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md"
                    />
                </div>
                {/* Global AI Action Button */}
                <Button
                    onClick={() => triggerAIWorkflow(filteredTasks)}
                    variant="secondary"
                    className="flex items-center gap-2"
                    disabled={Object.values(processingTasks).some(status => status)} // Disable if AI is running
                >
                    {Object.values(processingTasks).some(status => status) ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Test Run AI on All Tasks
                        </>
                    )}
                </Button>
            </div>

            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                    
                </div>
                <p className="text-xs text-gray-500">This will process only 10 records at a time.</p>
            </div>

            {/* No Tasks Found */}
            {filteredTasks.length === 0 ? (
                <div className="text-center p-8">
                    <p className="text-muted-foreground">No tasks found.</p>
                </div>
            ) : (
                <>
                    {/* Task Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {displayedTasks.map((task) => (
                            <Card key={task.id}
                                onClick={() => completedTasks[task.id] && router.push(`/ai-review/${task.id}`)}
                                className={`${completedTasks[task.id] ? "border-green-500 shadow-lg scale-105 transition-transform" : ""}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-medium line-clamp-2">{task.name}</CardTitle>
                                        <Badge
                                            variant="outline"
                                            className={`border ${processingTasks[task.id] ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                                : completedTasks[task.id] ? "bg-green-100 text-green-700 border-green-300"
                                                    : "bg-green-50 text-green-700 border-green-200"
                                                }`}
                                        >
                                            {processingTasks[task.id] ? "Processing..." : completedTasks[task.id] ? "AI Completed" : task.status.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="line-clamp-3 text-sm text-muted-foreground mb-4">
                                        {task.description || "No description provided"}
                                    </div>

                                    {/* Display Custom Fields */}
                                    {task.custom_fields && task.custom_fields.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-semibold mb-2">Custom Fields</h4>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {task.custom_fields.map((field) => (
                                                    <li key={field.id} className="flex items-center">
                                                        <span className="font-medium">{field.name}: </span>
                                                        {/* If it's a URL, make it clickable */}
                                                        {typeof field.value === "string" && field.value.startsWith("http") ? (
                                                            <a
                                                                href={field.value}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-1 text-blue-600 hover:underline flex items-center"
                                                            >
                                                                Link <ExternalLink className="h-4 w-4 ml-1" />
                                                            </a>
                                                        ) : (
                                                            <span className="ml-1">{field.value || "N/A"}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* View in ClickUp & AI Action */}
                                    <div className="flex justify-between items-center mt-4">
                                        <a
                                            href={task.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm font-medium text-primary"
                                        >
                                            View in ClickUp
                                            <CheckCircle className="ml-1 h-4 w-4" />
                                        </a>

                                        {/* AI Action Button for Individual Task */}
                                        <Button
                                            onClick={() => triggerAIWorkflow([task])}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            disabled={processingTasks[task.id]} // Disable if processing
                                        >
                                            {processingTasks[task.id] ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                    Test Run AI
                                                </>
                                            )}
                                        </Button>

                                        
                                    </div>

                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center mt-6 space-x-2">
                        <Button
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
