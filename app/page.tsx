"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "Not started" | "In progress" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Activity = { id: string; text: string; at: string };
type Task = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  progress: number;
  createdAt: string;
  activity: Activity[];
};

const STORAGE_KEY = "daymark-tasks-v1";
const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const uid = () => Math.random().toString(36).slice(2, 10);
const prettyDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not set";
const dayDiff = (value: string) => {
  if (!value) return 0;
  const due = new Date(`${value}T00:00:00`).getTime();
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  return Math.ceil((due - today) / 86400000);
};

const starterTasks: Task[] = [
  {
    id: "welcome-1",
    title: "Plan your first project",
    description: "Add milestones, dates, and a realistic progress update.",
    startDate: todayISO(),
    dueDate: "",
    priority: "Medium",
    status: "Not started",
    progress: 0,
    createdAt: new Date().toISOString(),
    activity: [{ id: uid(), text: "Task created", at: new Date().toISOString() }]
  }
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", startDate: todayISO(), dueDate: "", priority: "Medium" as Priority
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setTasks(saved ? JSON.parse(saved) : starterTasks);
    } catch {
      setTasks(starterTasks);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === "Completed").length;
    const active = tasks.filter(t => t.status === "In progress").length;
    const overdue = tasks.filter(t => t.status !== "Completed" && t.dueDate && dayDiff(t.dueDate) < 0).length;
    const average = tasks.length ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0;
    return { total: tasks.length, completed, active, overdue, average };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "All tasks" ||
        (filter === "In progress" && task.status === "In progress") ||
        (filter === "Not started" && task.status === "Not started") ||
        (filter === "Completed" && task.status === "Completed") ||
        (filter === "Overdue" && task.status !== "Completed" && !!task.dueDate && dayDiff(task.dueDate) < 0);
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (b.status === "Completed" && a.status !== "Completed") return -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter, search]);

  function openNewTask() {
    setEditingId(null);
    setForm({ title: "", description: "", startDate: todayISO(), dueDate: "", priority: "Medium" });
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description, startDate: task.startDate, dueDate: task.dueDate, priority: task.priority });
    setShowForm(true);
  }

  function saveTask(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setNotice("The due date cannot be earlier than the start date.");
      return;
    }
    if (editingId) {
      setTasks(current => current.map(task => task.id === editingId ? {
        ...task, ...form, title: form.title.trim(),
        activity: [{ id: uid(), text: "Task details updated", at: new Date().toISOString() }, ...task.activity]
      } : task));
      setNotice("Task updated.");
    } else {
      const now = new Date().toISOString();
      const newTask: Task = {
        id: uid(), ...form, title: form.title.trim(), status: "Not started", progress: 0,
        createdAt: now, activity: [{ id: uid(), text: "Task created", at: now }]
      };
      setTasks(current => [newTask, ...current]);
      setNotice("Task added.");
    }
    setShowForm(false);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function updateProgress(task: Task, progress: number) {
    const nextStatus: Status = progress === 100 ? "Completed" : progress > 0 ? "In progress" : "Not started";
    setTasks(current => current.map(t => t.id === task.id ? {
      ...t, progress, status: nextStatus,
      activity: progress !== t.progress ? [{ id: uid(), text: `Progress changed to ${progress}%`, at: new Date().toISOString() }, ...t.activity] : t.activity
    } : t));
  }

  function updateStatus(task: Task, status: Status) {
    const progress = status === "Completed" ? 100 : status === "Not started" ? 0 : Math.max(task.progress, 1);
    setTasks(current => current.map(t => t.id === task.id ? {
      ...t, status, progress,
      activity: [{ id: uid(), text: `Status changed to ${status}`, at: new Date().toISOString() }, ...t.activity]
    } : t));
  }

  function deleteTask(task: Task) {
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      setTasks(current => current.filter(t => t.id !== task.id));
      setNotice("Task deleted.");
      window.setTimeout(() => setNotice(""), 2600);
    }
  }

  function enableNotifications() {
    if (!("Notification" in window)) {
      setNotice("This browser does not support desktop notifications.");
      return;
    }
    Notification.requestPermission().then(permission => {
      setNotice(permission === "granted" ? "Notifications enabled while this app is open." : "Notification permission was not granted.");
      window.setTimeout(() => setNotice(""), 3000);
    });
  }

  useEffect(() => {
    if (!loaded || !("Notification" in window) || Notification.permission !== "granted") return;
    const dueToday = tasks.filter(t => t.status !== "Completed" && t.dueDate === todayISO());
    dueToday.forEach(t => {
      const key = `daymark-notified-${t.id}-${todayISO()}`;
      if (!sessionStorage.getItem(key)) {
        new Notification("Task due today", { body: t.title });
        sessionStorage.setItem(key, "1");
      }
    });
  }, [tasks, loaded]);

  if (!loaded) return <main className="loading">Loading your workspace…</main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">d</div><span>daymark</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${filter === "All tasks" ? "selected" : ""}`} onClick={() => setFilter("All tasks")}><span className="nav-icon">▦</span> All tasks <span className="nav-count">{stats.total}</span></button>
        <button className={`nav-item ${filter === "In progress" ? "selected" : ""}`} onClick={() => setFilter("In progress")}><span className="nav-icon">◷</span> In progress</button>
        <button className={`nav-item ${filter === "Not started" ? "selected" : ""}`} onClick={() => setFilter("Not started")}><span className="nav-icon">○</span> Not started</button>
        <button className={`nav-item ${filter === "Completed" ? "selected" : ""}`} onClick={() => setFilter("Completed")}><span className="nav-icon">✓</span> Completed</button>
        <button className={`nav-item ${filter === "Overdue" ? "selected" : ""}`} onClick={() => setFilter("Overdue")}><span className="nav-icon">⌛</span> Overdue {stats.overdue > 0 && <span className="nav-count alert-count">{stats.overdue}</span>}</button>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><div className="tip-icon">✦</div><strong>Small steps add up.</strong><p>Keep your tasks moving with clear dates and regular progress updates.</p></div>
          <div className="profile"><div className="avatar">Y</div><div><strong>My workspace</strong><small>Personal plan</small></div><span className="more">···</span></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{filter}</strong></div>
          <div className="top-actions"><button className="text-button" onClick={enableNotifications}>♧ Notifications</button><div className="top-avatar">Y</div></div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div><h1>Good things take <em>progress.</em></h1><p className="subtitle">A clear view of what matters, what’s moving, and what’s next.</p></div>
            <button className="primary-button" onClick={openNewTask}><span>＋</span> New task</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Total tasks</span><span className="stat-symbol purple">▦</span></div><div className="stat-value">{stats.total}</div><div className="stat-foot">Across your workspace</div></div>
            <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-symbol blue">◷</span></div><div className="stat-value">{stats.active}</div><div className="stat-foot">Currently moving forward</div></div>
            <div className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-symbol green">✓</span></div><div className="stat-value">{stats.completed}</div><div className="stat-foot">{stats.total ? Math.round(stats.completed / stats.total * 100) : 0}% of all tasks</div></div>
            <div className="stat-card"><div className="stat-top"><span>Overdue</span><span className="stat-symbol orange">⌛</span></div><div className="stat-value">{stats.overdue}</div><div className="stat-foot">Need a little attention</div></div>
          </div>

          <section className="overview-card">
            <div className="overview-copy"><div className="section-kicker">YOUR MOMENTUM</div><h2>Overall progress</h2><p>Average completion across all your tasks.</p></div>
            <div className="overall-progress"><div className="overall-number">{stats.average}<span>%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${stats.average}%` }} /></div><small>{stats.completed} of {stats.total} tasks completed</small></div>
          </section>

          <section className="tasks-section">
            <div className="task-heading"><div><div className="section-kicker">YOUR WORK, IN ONE PLACE</div><h2>{filter}</h2></div><div className="task-tools"><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" /></div><button className="filter-button" onClick={() => setFilter("All tasks")}>↕ <span>View all</span></button></div></div>

            <div className="task-list">
              {visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>No tasks found</h3><p>{tasks.length ? "Try another search or filter." : "Create a task to get your workspace moving."}</p><button className="primary-button small" onClick={openNewTask}>＋ Add a task</button></div> :
                visibleTasks.map(task => {
                  const remaining = task.dueDate ? dayDiff(task.dueDate) : null;
                  const overdue = remaining !== null && remaining < 0 && task.status !== "Completed";
                  return <article className="task-card" key={task.id}>
                    <div className="task-main">
                      <div className={`task-check ${task.status === "Completed" ? "checked" : ""}`} onClick={() => updateStatus(task, task.status === "Completed" ? "In progress" : "Completed")} role="button" tabIndex={0} aria-label="Toggle task completion" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") updateStatus(task, task.status === "Completed" ? "In progress" : "Completed"); }}>{task.status === "Completed" ? "✓" : ""}</div>
                      <div className="task-info"><div className="task-title-row"><h3 className={task.status === "Completed" ? "done-title" : ""}>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span></div>{task.description && <p>{task.description}</p>}
                        <div className="task-meta"><span>◷ {prettyDate(task.startDate)}</span><span className={overdue ? "overdue-text" : ""}>⚑ {task.dueDate ? prettyDate(task.dueDate) : "No due date"}{overdue ? " · overdue" : remaining === 0 && task.status !== "Completed" ? " · due today" : remaining !== null && remaining > 0 && remaining <= 7 && task.status !== "Completed" ? ` · ${remaining} days left` : ""}</span></div>
                      </div>
                    </div>
                    <div className="task-progress-area"><div className="progress-label"><span>Progress</span><strong>{task.progress}%</strong></div><input aria-label={`Progress for ${task.title}`} className="range" type="range" min="0" max="100" step="5" value={task.progress} onChange={e => updateProgress(task, Number(e.target.value))} style={{ background: `linear-gradient(to right, #7667d8 ${task.progress}%, #ecebf2 ${task.progress}%)` }} /><div className="progress-bottom"><span className={`status-pill status-${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span><select aria-label={`Status for ${task.title}`} value={task.status} onChange={e => updateStatus(task, e.target.value as Status)}><option>Not started</option><option>In progress</option><option>Completed</option></select></div></div>
                    <div className="task-actions"><button title="Edit task" onClick={() => openEdit(task)}>✎</button><button title="Delete task" onClick={() => deleteTask(task)}>⌫</button><details className="activity-details"><summary title="View updates">↗</summary><div className="activity-popover"><strong>Recent updates</strong>{task.activity.slice(0, 5).map(a => <div className="activity-item" key={a.id}><span>{a.text}</span><small>{new Date(a.at).toLocaleString()}</small></div>)}</div></details></div>
                  </article>;
                })}
            </div>
          </section>
          <footer className="footer-note">Made for focus, built for progress. <span>Your tasks are saved in this browser.</span></footer>
        </div>
      </section>

      {notice && <div className="toast">{notice}</div>}
      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><form className="task-modal" onSubmit={saveTask}>
        <div className="modal-head"><div><div className="section-kicker">{editingId ? "KEEP IT UP TO DATE" : "MAKE A PLAN"}</div><h2>{editingId ? "Edit task" : "Create a task"}</h2></div><button type="button" className="close-button" onClick={() => setShowForm(false)}>×</button></div>
        <label>Task name <span>*</span><input autoFocus required maxLength={100} placeholder="e.g. Prepare quarterly review" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>Description <small>Optional</small><textarea rows={3} placeholder="Add context, milestones, or notes…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <div className="form-row"><label>Start date<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label><label>Due date<input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div>
        <label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">{editingId ? "Save changes" : "Create task"}</button></div>
      </form></div>}
    </main>
  );
}
