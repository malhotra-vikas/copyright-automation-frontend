"use client"

import { useState } from "react"
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

export default async function TaskList({ tasks }: TaskListProps) {
    const router = useRouter()

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 6

    // Track AI processing and completion states
    const [processingTasks, setProcessingTasks] = useState<Record<string, boolean>>({})
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})

    // **Filter tasks based on search query**
    const filteredTasks = tasks.filter(
        (task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // **Pagination Logic**
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
    const displayedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const triggerAIWorkflow = async (taskList: ClickUpTask[]) => {
        if (taskList.length === 0) return

        console.log("📡 Sending tasks to server for AI processing:", taskList.map(t => t.name))

        const taskUpdates = Object.fromEntries(taskList.map(task => [task.id, true]))
        setProcessingTasks(prev => ({ ...prev, ...taskUpdates }))

        try {
            const response = await fetch("/api/ai-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasks: taskList }),
            })

            const { results } = await response.json()

            const completedUpdates = results.reduce((acc: Record<string, string>, result: any) => {
                acc[result.taskId] = result.summary || "No summary available"
                return acc
            }, {})

            setCompletedTasks(prev => ({ ...prev, ...completedUpdates }))
            toast.success("🎉 AI workflow completed!")
        } catch (error) {
            console.error("❌ Error triggering AI workflow:", error)
            toast.error("❌ AI processing failed")
        } finally {
            setProcessingTasks(prev => {
                const updated = { ...prev }
                taskList.forEach(task => delete updated[task.id])
                return updated
            })

            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
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
                            Run AI on All
                        </>
                    )}
                </Button>
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
                                                    Run AI
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
