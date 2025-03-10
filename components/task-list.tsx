"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Search, ChevronLeft, ChevronRight, ExternalLink, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ClickUpTask } from "@/lib/clickup"

interface TaskListProps {
    tasks: ClickUpTask[]
}

// Placeholder function for AI workflow
const triggerAIWorkflow = async (task?: ClickUpTask[]) => {
    console.log("🔄 Triggering AI Workflow...");

    if (task) {
        console.log("📡 Running AI workflow for task(s):", task.map(t => t.name));
    } else {
        console.log("📡 Running AI workflow for ALL filtered tasks...");
    }

    // Here you can replace this with an actual API call to your AI workflow
    // Example: await fetch('/api/ai-workflow', { method: 'POST', body: JSON.stringify({ tasks }) });

    alert(`AI Workflow triggered ${task ? "for selected task(s)" : "for all filtered tasks"}`);
}

export default function TaskList({ tasks }: TaskListProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 6

    // **Filter tasks based on search query**
    const filteredTasks = tasks.filter(
        (task) =>
            task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // **Pagination Logic**
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
    const displayedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
                >
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Run AI on All
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
                            <Card key={task.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-medium line-clamp-2">{task.name}</CardTitle>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {task.status.status.toUpperCase()}
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
                                        >
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            Run AI
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
