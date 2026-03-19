import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CreateTaskModal from '../components/CreateTaskModal';
import ConfirmModal from '../components/ConfirmModal';
import * as boardsApi from '../api/boards';
import * as tasksApi from '../api/tasks';
import type { Board, Task, TaskStatus } from '../types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'done'];

const STATUS_OPTIONS: { value: 'all' | TaskStatus; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [completing, setCompleting] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [statusPicker, setStatusPicker] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [boardData, tasksData] = await Promise.all([
        boardsApi.getBoard(id),
        tasksApi.getTasks(id),
      ]);
      setBoard(boardData);
      setTasks(tasksData);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!id || newStatus === task.status) { setStatusPicker(null); return; }
    setStatusPicker(null);
    setCompleting(task._id);

    setTimeout(async () => {
      try {
        const updated = await tasksApi.updateTask(id, task._id, { status: newStatus });
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      } catch {
        // handled silently
      } finally {
        setCompleting(null);
      }
    }, 250);
  };

  const handleSubmitTask = async (data: { title: string; status: TaskStatus; dueDate?: string }) => {
    if (!id) return;
    try {
      if (editingTask) {
        const updated = await tasksApi.updateTask(id, editingTask._id, data);
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      } else {
        const created = await tasksApi.createTask(id, data);
        setTasks((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch {
      // handled silently
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
    setMenuOpen(null);
  };

  const confirmDelete = async () => {
    if (!id || !deleteTaskId) return;
    try {
      await tasksApi.deleteTask(id, deleteTaskId);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTaskId));
    } catch {
      // handled silently
    } finally {
      setDeleteTaskId(null);
    }
  };

  const renderTaskRow = (task: Task) => {
    const isDone = task.status === 'done';
    const isAnimating = completing === task._id;

    return (
      <div
        key={task._id}
        className={`task-list-item ${isAnimating ? 'task-completing' : ''}`}
      >
        <div className="task-list-item-left">
          <div className="status-picker-wrapper" ref={statusPicker === task._id ? statusRef : undefined}>
            <button
              className={`task-checkbox task-checkbox-${task.status} ${isAnimating ? 'task-checkbox-animating' : ''}`}
              onClick={(e) => { e.stopPropagation(); setStatusPicker(statusPicker === task._id ? null : task._id); setMenuOpen(null); }}
              title="Change status"
            >
              {isDone && (
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {task.status === 'in-progress' && (
                <div className="checkbox-half" />
              )}
            </button>
            {statusPicker === task._id && (
              <div className="status-picker-dropdown">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    className={`status-picker-item ${task.status === s ? 'status-picker-item-active' : ''}`}
                    onClick={() => handleStatusChange(task, s)}
                  >
                    <span className={`status-picker-dot dot-${s}`} />
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className={`task-list-item-title ${isDone ? 'task-title-done' : ''}`}>
            {task.title}
          </span>
        </div>
        <div className="task-list-item-right">
          {task.dueDate && (
            <span className={`due-date ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'due-date-overdue' : ''}`}>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className={`status-badge status-${task.status}`}>
            {STATUS_LABELS[task.status]}
          </span>
          <div className="task-menu-wrapper" ref={menuOpen === task._id ? menuRef : undefined}>
            <button
              className="icon-btn task-menu-trigger"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === task._id ? null : task._id); }}
            >
              &#8226;&#8226;&#8226;
            </button>
            {menuOpen === task._id && (
              <div className="task-menu-dropdown">
                <button
                  className="task-menu-item"
                  onClick={() => { setEditingTask(task); setModalOpen(true); setMenuOpen(null); }}
                >
                  <span className="task-menu-icon">&#9998;</span> Edit
                </button>
                <button
                  className="task-menu-item task-menu-item-danger"
                  onClick={() => { handleDeleteTask(task._id); setMenuOpen(null); }}
                >
                  <span className="task-menu-icon">&#128465;</span> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskList = () => {
    if (filter !== 'all') {
      const filtered = tasks.filter((t) => t.status === filter);
      if (filtered.length === 0) {
        return <div className="empty-state">No tasks match this filter.</div>;
      }
      return <div className="task-list">{filtered.map(renderTaskRow)}</div>;
    }

    // "All" view — group by status sections
    const sections = STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      tasks: tasks.filter((t) => t.status === status),
    })).filter((s) => s.tasks.length > 0);

    if (sections.length === 0) {
      return <div className="empty-state">No tasks yet. Create your first task!</div>;
    }

    return (
      <div className="task-sections">
        {sections.map((section) => (
          <div key={section.status} className="task-section">
            <div className="task-section-header">
              <span className={`task-section-dot dot-${section.status}`} />
              <h3 className="task-section-title">{section.label}</h3>
              <span className="task-section-count">{section.tasks.length}</span>
            </div>
            <div className="task-list">
              {section.tasks.map(renderTaskRow)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="loading-container"><div className="spinner" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="board-detail-back">
          <button className="back-link" onClick={() => navigate('/dashboard')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            My Boards
          </button>
        </div>

        <div className="task-list-toolbar">
          <h1 className="board-detail-title">{board?.title || 'Board'}</h1>
          <div className="task-list-toolbar-right">
          <select
            className="filter-dropdown"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | TaskStatus)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.value === 'all' ? tasks.length : tasks.filter((t) => t.status === opt.value).length})
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setModalOpen(true); }}>
            + Add task
          </button>
          </div>
        </div>

        {renderTaskList()}
      </main>

      <CreateTaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmitTask}
        task={editingTask}
      />

      <ConfirmModal
        isOpen={!!deleteTaskId}
        message="Are you sure you want to delete this task?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}
