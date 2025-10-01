import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  const priorityColors = {
    low: "bg-priority-low/10 text-priority-low border-priority-low/20",
    medium:
      "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
    high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  };

  const statusColors = {
    pending:
      "bg-status-pending/10 text-status-pending border-status-pending/20",
    "in-progress":
      "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
    completed:
      "bg-status-completed/10 text-status-completed border-status-completed/20",
  };

  const handleDragStart = (e) => {
    const payload = JSON.stringify({ id: task.id, status: task.status });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "p-4 shadow-soft hover:shadow-medium transition-all cursor-grab active:cursor-grabbing",
        isOverdue && "border-destructive/50 bg-destructive/5"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{task.title}</h3>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[task.status]} variant="outline">
            {task.status}
          </Badge>
          <Badge className={priorityColors[task.priority]} variant="outline">
            <Flag className="h-3 w-3 mr-1" />
            {task.priority}
          </Badge>
          {task.due_date && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                isOverdue &&
                  "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {task.status !== "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(task.id, "pending")}
              className="text-xs"
            >
              Pending
            </Button>
          )}
          {task.status !== "in-progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(task.id, "in-progress")}
              className="text-xs"
            >
              In Progress
            </Button>
          )}
          {task.status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(task.id, "completed")}
              className="text-xs"
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
