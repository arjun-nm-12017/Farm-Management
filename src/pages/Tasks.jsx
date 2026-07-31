import { useState, useMemo } from 'react'
import { CheckSquare, Plus, Edit2, Trash2, CheckCircle2, Calendar, User, AlertCircle } from 'lucide-react'
import { startOfWeek, endOfWeek } from 'date-fns'
import useFarmStore from '../store'
import {
  Button, Card, CardHeader, Input, Textarea, Select, Badge,
  Modal, Table, StatCard, EmptyState, SearchBar, PageHeader,
  Tabs, ConfirmDialog, PriorityBadge, StatusBadge,
} from '../components/ui'
import { formatDate, isOverdue, classNames, sortBy, searchFilter } from '../utils/helpers'
import { TASK_PRIORITIES, TASK_STATUSES } from '../data/farmTypes'

const TASK_CATEGORIES = ['Field Work', 'Animal Care', 'Maintenance', 'Administrative', 'Other']

const KANBAN_COLUMNS = [
  { id: 'To Do', label: 'To Do', accent: 'bg-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', count: 'bg-slate-200 text-slate-700' },
  { id: 'In Progress', label: 'In Progress', accent: 'bg-blue-500', bg: 'bg-blue-50/40', border: 'border-blue-200', count: 'bg-blue-100 text-blue-700' },
  { id: 'Done', label: 'Done', accent: 'bg-emerald-500', bg: 'bg-emerald-50/40', border: 'border-emerald-200', count: 'bg-emerald-100 text-emerald-700' },
  { id: 'Cancelled', label: 'Cancelled', accent: 'bg-slate-400', bg: 'bg-slate-100/60', border: 'border-slate-200', count: 'bg-slate-200 text-slate-600' },
]

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Field Work',
  assignedTo: '',
  dueDate: '',
  priority: 'Medium',
  status: 'To Do',
  recurring: false,
}

function isThisWeek(dateStr) {
  if (!dateStr) return false
  try {
    const date = new Date(dateStr)
    const now = new Date()
    return date >= startOfWeek(now) && date <= endOfWeek(now)
  } catch {
    return false
  }
}

export default function Tasks() {
  const tasks = useFarmStore((s) => s.tasks)
  const users = useFarmStore((s) => s.users)
  const addTask = useFarmStore((s) => s.addTask)
  const updateTask = useFarmStore((s) => s.updateTask)
  const removeTask = useFarmStore((s) => s.removeTask)

  const [view, setView] = useState('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // List view filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')

  // --- Stats ---
  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'To Do').length
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length
    const overdue = tasks.filter(
      (t) => t.status !== 'Done' && t.status !== 'Cancelled' && t.dueDate && isOverdue(t.dueDate)
    ).length
    const doneThisWeek = tasks.filter(
      (t) => t.status === 'Done' && t.dueDate && isThisWeek(t.dueDate)
    ).length
    return { todo, inProgress, overdue, doneThisWeek }
  }, [tasks])

  // --- Filtered list view tasks ---
  const listTasks = useMemo(() => {
    let result = [...tasks]
    result = searchFilter(result, search, ['title', 'description', 'category', 'assignedTo'])
    if (filterStatus) result = result.filter((t) => t.status === filterStatus)
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority)
    if (filterAssignee) result = result.filter((t) => t.assignedTo === filterAssignee)
    return sortBy(result, 'dueDate', 'asc')
  }, [tasks, search, filterStatus, filterPriority, filterAssignee])

  // --- Kanban grouped tasks ---
  const kanbanTasks = useMemo(() => {
    const grouped = {}
    KANBAN_COLUMNS.forEach((col) => { grouped[col.id] = [] })
    tasks.forEach((t) => {
      if (grouped[t.status] !== undefined) grouped[t.status].push(t)
    })
    return grouped
  }, [tasks])

  function openAddModal() {
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTask(task)
    setForm({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'Field Work',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'Medium',
      status: task.status || 'To Do',
      recurring: task.recurring || false,
    })
    setErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTask(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    return errs
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (editingTask) {
      updateTask(editingTask.id, form)
    } else {
      addTask(form)
    }
    closeModal()
  }

  function handleMarkComplete(task) {
    updateTask(task.id, { status: 'Done' })
  }

  function handleDeleteConfirm(task) {
    setDeleteConfirm(task)
  }

  function handleDelete() {
    if (deleteConfirm) {
      removeTask(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  function getUserName(assignedTo) {
    if (!assignedTo) return ''
    const user = users.find((u) => u.id === assignedTo || u.name === assignedTo)
    return user ? user.name : assignedTo
  }

  const tabItems = [
    { id: 'kanban', label: 'Kanban Board' },
    { id: 'list', label: 'List View' },
  ]

  return (
    <div className="space-y-7">
      {/* Header */}
      <PageHeader
        title="Tasks & Scheduling"
        subtitle="Manage and track farm tasks and scheduled activities"
        action={
          <Button onClick={openAddModal}>
            <Plus size={16} />
            Add Task
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="To Do"
          value={stats.todo}
          icon={CheckSquare}
          color="slate"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          label="Done This Week"
          value={stats.doneThisWeek}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* View Toggle */}
      <Tabs tabs={tabItems} active={view} onChange={setView} className="mb-5" />

      {/* Views */}
      {view === 'kanban' ? (
        <KanbanView
          columns={KANBAN_COLUMNS}
          kanbanTasks={kanbanTasks}
          onEdit={openEditModal}
          onDelete={handleDeleteConfirm}
          onAddTask={openAddModal}
          getUserName={getUserName}
        />
      ) : (
        <ListView
          tasks={listTasks}
          users={users}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterAssignee={filterAssignee}
          setFilterAssignee={setFilterAssignee}
          onEdit={openEditModal}
          onDelete={handleDeleteConfirm}
          onMarkComplete={handleMarkComplete}
          getUserName={getUserName}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            error={errors.title}
          />
          <Textarea
            label="Description"
            placeholder="Describe the task..."
            value={form.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
            <Select
              label="Assigned To"
              value={form.assignedTo}
              onChange={(e) => handleFormChange('assignedTo', e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => handleFormChange('dueDate', e.target.value)}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => handleFormChange('priority', e.target.value)}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => handleFormChange('status', e.target.value)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => handleFormChange('recurring', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-slate-700">Recurring task</span>
          </label>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ columns, kanbanTasks, onEdit, onDelete, onAddTask, getUserName }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {columns.map((col) => {
        const colTasks = kanbanTasks[col.id] || []
        return (
          <div
            key={col.id}
            className={classNames(
              'rounded-2xl border flex flex-col min-h-[200px]',
              col.bg, col.border
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-inherit rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className={classNames('w-2 h-2 rounded-full', col.accent)} />
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              </div>
              <span className={classNames('text-xs font-semibold px-2 py-0.5 rounded-full', col.count)}>
                {colTasks.length}
              </span>
            </div>
            {/* Cards */}
            <div className="flex-1 p-3 space-y-3">
              {colTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-xs text-slate-400">No tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getUserName={getUserName}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ task, onEdit, onDelete, getUserName }) {
  const overdue = task.dueDate && task.status !== 'Done' && task.status !== 'Cancelled' && isOverdue(task.dueDate)
  const assigneeName = getUserName(task.assignedTo)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all space-y-2.5">
      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 leading-snug flex-1">{task.title}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Edit task"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Category */}
      {task.category && (
        <span className="inline-block text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
          {task.category}
        </span>
      )}

      {/* Priority Badge */}
      <div>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={classNames('flex items-center gap-1 text-xs', overdue ? 'text-red-600 font-semibold' : 'text-slate-500')}>
          <Calendar size={11} />
          {overdue && <span>Overdue ·</span>}
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Assignee */}
      {assigneeName && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={9} className="text-slate-500" />
          </div>
          <span>{assigneeName}</span>
        </div>
      )}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({
  tasks, users, search, setSearch,
  filterStatus, setFilterStatus,
  filterPriority, setFilterPriority,
  filterAssignee, setFilterAssignee,
  onEdit, onDelete, onMarkComplete, getUserName,
}) {
  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 text-sm">{row.title}</p>
          {row.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
          {row.category || '—'}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => {
        const name = getUserName(row.assignedTo)
        return (
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            {name
              ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={11} className="text-slate-400" />
                  </div>
                  <span>{name}</span>
                </>
              )
              : <span className="text-slate-400">—</span>
            }
          </div>
        )
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => {
        const overdue = row.dueDate && row.status !== 'Done' && row.status !== 'Cancelled' && isOverdue(row.dueDate)
        return (
          <span className={classNames('text-sm flex items-center gap-1', overdue ? 'text-red-600 font-semibold' : 'text-slate-600')}>
            <Calendar size={13} />
            {row.dueDate ? formatDate(row.dueDate) : '—'}
          </span>
        )
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          {row.status !== 'Done' && row.status !== 'Cancelled' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkComplete(row) }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
              title="Mark complete"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card padding={false} className="overflow-hidden rounded-2xl">
      {/* Filters */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
          className="w-56"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-36"
        >
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="w-36"
        >
          <option value="">All Priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="w-40"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-6 mb-4">
            <CheckSquare size={32} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No tasks found</p>
          <p className="text-xs text-slate-500 max-w-xs">
            No tasks match your current filters. Try adjusting your search or add a new task.
          </p>
        </div>
      ) : (
        <Table columns={columns} data={tasks} emptyText="No tasks found" />
      )}
    </Card>
  )
}
