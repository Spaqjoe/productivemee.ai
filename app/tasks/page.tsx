"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RxPlus } from "react-icons/rx";
import { MdEdit, MdDelete, MdDragIndicator } from "react-icons/md";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  stage: "todo" | "pending" | "done";
  due_date?: string;
  created_at?: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    stage: "todo" as "todo" | "pending" | "done",
    due_date: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        alert("Authentication error. Please sign in again.");
        return;
      }

      if (!user) {
        console.error("User not authenticated");
        alert("You must be signed in to create tasks.");
        return;
      }

      // Ensure profile exists
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profileExists) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || "User",
          });

        if (profileError) {
          console.error("Failed to create profile:", profileError);
          alert("Please complete your profile setup first.");
          return;
        }
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...formData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", JSON.stringify(error, null, 2));
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error: ${error.message || 'Failed to create task'}`);
        return;
      }

      if (data) {
        setTasks([...tasks, data]);
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error: any) {
      console.error("Failed to create task:", JSON.stringify(error, null, 2));
      alert(`Failed to create task: ${error?.message || error?.details || 'Unknown error'}`);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ ...formData })
        .eq("id", editingTask.id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      stage: "todo",
      due_date: "",
    });
    setEditingTask(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      stage: task.stage,
      due_date: task.due_date || "",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTask(null);
      resetForm();
    }
  };

  const stages = ["todo", "pending", "done"];
  const tasksByStage = stages.map(stage => ({
    stage,
    tasks: tasks.filter(t => t.stage === stage),
  }));

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.stage === targetStage) return;

    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ stage: targetStage as any })
        .eq("id", draggedTask.id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, stage: targetStage as any } : t));
    } catch (error) {
      console.error("Failed to update task stage:", error);
    } finally {
      setDraggedTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  // Build performance data: tasks created per day (last 14 days)
  const performanceData = (() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split("T")[0];
      return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 };
    });
    const byDate = new Map(days.map((d) => [d.key, d]));
    for (const t of tasks) {
      const key = (t.created_at ? new Date(t.created_at) : new Date()).toISOString().split("T")[0];
      const bucket = byDate.get(key);
      if (bucket) bucket.count += 1;
    }
    return days.map(({ label, count }) => ({ label, count }));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Manager</h1>
          <p className="text-muted-foreground">Organize your tasks with a Kanban board</p>
        </div>
        <Button
          variant="default"
          onClick={openCreateDialog}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RxPlus className="mr-2" />
          New Task
        </Button>
      </div>

      {/* Three widgets layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks (Drag & Drop) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tasksByStage.map(({ stage, tasks: stageTasks }) => (
                <div
                  key={stage}
                  className="space-y-3"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <h2 className="text-sm font-semibold uppercase text-muted-foreground">{stage}</h2>
                  <div className="space-y-3 min-h-[200px] rounded-lg transition-colors p-1">
                    {stageTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                      >
                        <CardContent className="p-4 bg-[hsl(var(--background))] border-r rounded-lg">
                          <div className="flex items-start gap-2">
                            <MdDragIndicator className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold">{task.title}</h3>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                              <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"} className="mt-2">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-3 pt-3 border-t">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                              <MdEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                              <MdDelete className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {tasks.slice(0, 12).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                  <Badge variant={t.stage === "done" ? "secondary" : t.stage === "pending" ? "default" : "outline"}>
                    {t.stage}
                  </Badge>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-sm text-muted-foreground">No tasks yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [v, "Tasks"]} labelFormatter={(l) => `Date: ${l}`} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-card border-border" onClose={() => handleDialogClose(false)}>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="todo">To Do</option>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="bg-background text-foreground"
              />
            </div>
            <Button
              onClick={editingTask ? handleUpdateTask : handleCreateTask}
              className="w-full"
            >
              {editingTask ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
