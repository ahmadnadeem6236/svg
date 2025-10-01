import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tasksApi } from "@/lib/api";
import { CheckCircle2, Clock, ListTodo, AlertCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await tasksApi.list();
        setTasks(loaded);
      } catch (e) {
        // ignore on dashboard
      }
    })();
  }, []);

  const statusCounts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const priorityCounts = {
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length,
  };

  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];

  const dueToday = tasks.filter((t) => t.due_date === today).length;
  const dueThisWeek = tasks.filter(
    (t) => t.due_date && t.due_date <= weekFromNow && t.due_date >= today
  ).length;
  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed"
  ).length;

  const statusData = [
    {
      name: "Pending",
      value: statusCounts.pending,
      color: "hsl(var(--status-pending))",
    },
    {
      name: "In Progress",
      value: statusCounts["in-progress"],
      color: "hsl(var(--status-in-progress))",
    },
    {
      name: "Completed",
      value: statusCounts.completed,
      color: "hsl(var(--status-completed))",
    },
  ];

  const priorityData = [
    { name: "Low", count: priorityCounts.low },
    { name: "Medium", count: priorityCounts.medium },
    { name: "High", count: priorityCounts.high },
  ];

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ListTodo,
      color: "text-primary",
    },
    {
      title: "Completed",
      value: statusCounts.completed,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      title: "Due Today",
      value: dueToday,
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your tasks and productivity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-rows-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="shadow-soft hover:shadow-medium transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">Due Today</span>
              <span className="text-2xl font-bold text-warning">
                {dueToday}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">Due This Week</span>
              <span className="text-2xl font-bold text-info">
                {dueThisWeek}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">Overdue</span>
              <span className="text-2xl font-bold text-destructive">
                {overdue}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
