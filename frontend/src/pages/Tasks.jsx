import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { tasksApi } from "@/lib/api";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { toast } from "sonner";
import useWebSocket from "@/hooks/useWebSocket";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = async () => {
    try {
      const loaded = await tasksApi.list();
      setTasks(loaded);
    } catch (e) {
      toast.error("Failed to load tasks");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // --- Realtime updates via WebSocket ---
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  let wsUrl = null;
  try {
    const apiURL = new URL(apiBase);
    const wsProtocol = apiURL.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${wsProtocol}//${apiURL.host}/ws/tasks/`;
  } catch {
    // fallback if URL parsing fails
    const wsProtocol = apiBase.startsWith("https") ? "wss" : "ws";
    wsUrl = `${wsProtocol}://localhost:8000/ws/tasks/`;
  }
  const token =
    typeof window !== "undefined" ? localStorage.getItem("taskman_auth") : null;
  const { lastMessage } = useWebSocket(wsUrl, token);

  useEffect(() => {
    if (!lastMessage) return;

    // Expected payload shapes from backend (examples):
    // { type: 'task.created', task: { ... } }
    // { type: 'task.updated', task: { ... } }
    // { type: 'task.deleted', id: number }
    // { type: 'tasks.refresh' }
    const { type } = lastMessage || {};

    if (type === "task.created" && lastMessage.task) {
      const created = lastMessage.task;
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === created.id);
        return exists
          ? prev.map((t) => (t.id === created.id ? created : t))
          : [created, ...prev];
      });
      return;
    }

    if (type === "task.updated" && lastMessage.task) {
      const updated = lastMessage.task;
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      return;
    }

    if (type === "task.deleted" && (lastMessage.id || lastMessage.task?.id)) {
      const deletedId = lastMessage.id ?? lastMessage.task.id;
      setTasks((prev) => prev.filter((t) => t.id !== deletedId));
      return;
    }

    // Unknown message type → fall back to full reload to stay consistent
    loadTasks();
  }, [lastMessage]);

  useEffect(() => {
    let filtered = [...tasks];

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleEdit = (task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await tasksApi.delete(id);
      await loadTasks();
      toast.success("Task deleted successfully!");
    } catch (e) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await tasksApi.update(id, { status });
      await loadTasks();
      toast.success(`Task status updated to ${status}!`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const tasksByStatus = {
    pending: filteredTasks.filter((t) => t.status === "pending"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnColumn = async (e, targetStatus) => {
    e.preventDefault();
    try {
      let payload = e.dataTransfer.getData("application/json");
      if (!payload) payload = e.dataTransfer.getData("text/plain");
      if (!payload) return;
      const parsed = JSON.parse(payload);
      const id = parsed?.id;
      const currentStatus = parsed?.status;
      if (!id || currentStatus === targetStatus) return;

      // optimistic UI update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: targetStatus } : t))
      );

      try {
        await tasksApi.update(id, { status: targetStatus });
        await loadTasks();
        toast.success(`Task status updated to ${targetStatus}!`);
      } catch (apiErr) {
        // rollback on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: currentStatus } : t))
        );
        const detail = apiErr?.response?.data
          ? JSON.stringify(apiErr.response.data)
          : "Failed to update status";
        toast.error(detail);
      }
    } catch (err) {
      // ignore malformed payloads
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and organize your tasks
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between">
        {["pending", "in-progress", "completed"].map((status) => (
          <div
            key={status}
            className="space-y-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnColumn(e, status)}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize">
                {status.replace("-", " ")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {tasksByStatus[status].length}
              </span>
            </div>
            <div
              className="space-y-3 min-h-[120px] rounded-lg border-2 border-dashed border-transparent hover:border-muted transition-colors p-1"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnColumn(e, status)}
            >
              {tasksByStatus[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {tasksByStatus[status].length === 0 && (
                <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground w-72">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSuccess={loadTasks}
      />
    </div>
  );
}
