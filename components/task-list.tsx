import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ClickUpTask } from "@/lib/clickup"

interface TaskListProps {
    tasks: ClickUpTask[]
}

export default function TaskList({ tasks }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">No tasks found with "READY FOR AI" status.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
                <Card key={task.id}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium line-clamp-2">{task.name}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                READY FOR AI
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="line-clamp-3 text-sm text-muted-foreground mb-4">
                            {task.description || "No description provided"}
                        </div>
                        <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-primary"
                        >
                            View in ClickUp
                            <CheckCircle className="ml-1 h-4 w-4" />
                        </a>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

