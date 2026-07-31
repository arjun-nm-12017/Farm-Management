import { useMemo } from 'react'
import { Wheat, Heart, Package, CheckSquare, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import useFarmStore from '../store'
import {
  Card,
  CardHeader,
  StatCard,
  Badge,
  PriorityBadge,
  StatusBadge,
} from '../components/ui'
import WeatherWidget from '../components/weather/WeatherWidget'
import {
  formatDate,
  formatCurrency,
  timeAgo,
  isOverdue,
  isUpcoming,
  classNames,
  sortBy,
} from '../utils/helpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatGreetingDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getHourGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-base font-semibold text-slate-800 whitespace-nowrap">{label}</h2>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

function TaskRow({ task }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'Done' && task.status !== 'Cancelled'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className={classNames('text-sm font-medium truncate', overdue ? 'text-red-700' : 'text-slate-800')}>
          {task.title}
        </p>
        {task.assignedTo && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">Assigned to: {task.assignedTo}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.status && <StatusBadge status={task.status} />}
        {overdue && (
          <Badge variant="red" className="hidden sm:inline-flex">Overdue</Badge>
        )}
      </div>
    </div>
  )
}

function AlertRow({ icon: Icon, iconColor, label, description }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={classNames('rounded-lg p-2 shrink-0', iconColor)}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>}
      </div>
    </div>
  )
}

function ActivityRow({ date, description, amount, type }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        {type === 'income' ? (
          <TrendingUp size={14} className="text-emerald-600" />
        ) : type === 'expense' ? (
          <TrendingUp size={14} className="text-red-500 rotate-180" />
        ) : (
          <Package size={14} className="text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(date)}</p>
      </div>
      {amount != null && (
        <p
          className={classNames(
            'text-sm font-semibold shrink-0',
            type === 'income' ? 'text-emerald-600' : type === 'expense' ? 'text-red-500' : 'text-slate-600'
          )}
        >
          {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
          {formatCurrency(amount)}
        </p>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    farmProfile,
    enabledModules,
    currentUser,
    fields,
    crops,
    animals,
    healthRecords,
    inventoryItems,
    stockLogs,
    tasks,
    transactions,
  } = useFarmStore()

  const today = todayISO()

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeFieldsCount = fields.length
  const activeCropsCount = crops.filter(
    (c) => c.stage !== 'Harvested'
  ).length
  const livestockCount = animals.filter(
    (a) => a.status !== 'Sold' && a.status !== 'Deceased'
  ).length
  const inventoryCount = inventoryItems.length
  const todaysTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'Done' || t.status === 'Cancelled') return false
      if (!t.dueDate) return false
      const due = t.dueDate.slice(0, 10)
      return due <= today
    }).length
  }, [tasks, today])

  // ── Today's Tasks ──────────────────────────────────────────────────────────
  const todaysTasks = useMemo(() => {
    return sortBy(
      tasks.filter((t) => {
        if (t.status === 'Done' || t.status === 'Cancelled') return false
        if (!t.dueDate) return false
        return t.dueDate.slice(0, 10) <= today
      }),
      'dueDate',
      'asc'
    )
  }, [tasks, today])

  // ── Active Alerts ──────────────────────────────────────────────────────────
  const lowStockAlerts = useMemo(() => {
    return inventoryItems.filter(
      (item) => item.reorderAt != null && item.quantity <= item.reorderAt
    )
  }, [inventoryItems])

  const overdueTaskAlerts = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== 'Done' &&
        t.status !== 'Cancelled' &&
        t.dueDate &&
        t.dueDate.slice(0, 10) < today
    )
  }, [tasks, today])

  const upcomingHealthAlerts = useMemo(() => {
    return healthRecords.filter(
      (r) => r.nextDue && isUpcoming(r.nextDue, 7)
    )
  }, [healthRecords])

  const hasAlerts =
    lowStockAlerts.length > 0 ||
    overdueTaskAlerts.length > 0 ||
    (enabledModules.livestock && upcomingHealthAlerts.length > 0)

  // ── Recent Activity ────────────────────────────────────────────────────────
  const recentActivity = useMemo(() => {
    const txnItems = transactions.map((t) => ({
      id: t.id,
      date: t.createdAt || t.date,
      description: t.description || t.category,
      amount: t.amount,
      type: t.type,
      sortKey: t.createdAt || t.date,
    }))

    const stockItems = stockLogs.map((s) => {
      const item = inventoryItems.find((i) => i.id === s.itemId)
      return {
        id: s.id,
        date: s.createdAt || s.date,
        description: `${s.type === 'in' ? 'Received' : 'Used'} ${s.quantity} ${item?.unit || ''} of ${item?.name || 'item'}`,
        amount: null,
        type: 'stock',
        sortKey: s.createdAt || s.date,
      }
    })

    return sortBy([...txnItems, ...stockItems], 'sortKey', 'desc').slice(0, 5)
  }, [transactions, stockLogs, inventoryItems])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getHourGreeting()},{' '}
              <span className="text-emerald-600">
                {currentUser?.name || farmProfile?.name || 'Farmer'}
              </span>
              {' '}
              <span role="img" aria-label="wave">👋</span>
            </h1>
            {farmProfile?.name && (
              <p className="text-sm text-slate-500 mt-1">
                {farmProfile.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm shrink-0">
            <Calendar size={15} className="text-emerald-600" />
            {formatGreetingDate()}
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {enabledModules.fields && (
            <StatCard
              label="Fields / Crops"
              value={`${activeFieldsCount} / ${activeCropsCount}`}
              icon={Wheat}
              color="emerald"
              subtext="Active fields and crops"
            />
          )}
          {enabledModules.livestock && (
            <StatCard
              label="Livestock"
              value={livestockCount}
              icon={Heart}
              color="amber"
              subtext="Active animals"
            />
          )}
          {enabledModules.inventory && (
            <StatCard
              label="Inventory Items"
              value={inventoryCount}
              icon={Package}
              color="blue"
              subtext={
                lowStockAlerts.length > 0
                  ? `${lowStockAlerts.length} item${lowStockAlerts.length > 1 ? 's' : ''} low on stock`
                  : 'All stocked up'
              }
            />
          )}
          {enabledModules.tasks && (
            <StatCard
              label="Tasks Today"
              value={todaysTasksCount}
              icon={CheckSquare}
              color={todaysTasksCount > 0 ? 'red' : 'emerald'}
              subtext={todaysTasksCount > 0 ? 'Pending or overdue' : 'All clear for today'}
            />
          )}
        </div>

        {/* ── Weather ────────────────────────────────────────────────────── */}
        {enabledModules.weather && (
          <div>
            <SectionDivider label="Weather" />
            <div className="max-w-sm">
              <WeatherWidget compact={true} />
            </div>
          </div>
        )}

        {/* ── Two-column: Tasks + Alerts ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Today's Tasks */}
          {enabledModules.tasks && (
            <Card>
              <CardHeader
                title="Today's Tasks"
                subtitle={
                  todaysTasks.length > 0
                    ? `${todaysTasks.length} task${todaysTasks.length !== 1 ? 's' : ''} pending`
                    : undefined
                }
                action={
                  todaysTasks.length > 0 && (
                    <Badge variant="red">{todaysTasks.length}</Badge>
                  )
                }
              />
              {todaysTasks.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                    <CheckSquare size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No tasks today</p>
                  <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {todaysTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Active Alerts */}
          <Card>
            <CardHeader
              title="Active Alerts"
              subtitle="Items requiring your attention"
              action={
                hasAlerts && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                )
              }
            />
            {!hasAlerts ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <AlertTriangle size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">No active alerts</p>
                <p className="text-xs text-slate-400 mt-1">Everything looks good</p>
              </div>
            ) : (
              <div>
                {/* Low stock */}
                {enabledModules.inventory &&
                  lowStockAlerts.map((item) => (
                    <AlertRow
                      key={`stock-${item.id}`}
                      icon={Package}
                      iconColor="bg-amber-100 text-amber-700"
                      label={`Low stock: ${item.name}`}
                      description={`${item.quantity} ${item.unit || ''} remaining (reorder at ${item.reorderAt} ${item.unit || ''})`}
                    />
                  ))}

                {/* Overdue tasks */}
                {enabledModules.tasks &&
                  overdueTaskAlerts.map((task) => (
                    <AlertRow
                      key={`task-${task.id}`}
                      icon={CheckSquare}
                      iconColor="bg-red-100 text-red-700"
                      label={`Overdue task: ${task.title}`}
                      description={`Due ${formatDate(task.dueDate)}${task.assignedTo ? ` · ${task.assignedTo}` : ''}`}
                    />
                  ))}

                {/* Upcoming health records */}
                {enabledModules.livestock &&
                  upcomingHealthAlerts.map((record) => {
                    const animal = animals.find((a) => a.id === record.animalId)
                    return (
                      <AlertRow
                        key={`health-${record.id}`}
                        icon={Heart}
                        iconColor="bg-purple-100 text-purple-700"
                        label={`Health due: ${record.type}${animal ? ` for ${animal.name || animal.tag}` : ''}`}
                        description={`Scheduled ${formatDate(record.nextDue)}`}
                      />
                    )
                  })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────── */}
        <div>
          <SectionDivider label="Recent Activity" />
          <Card>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <TrendingUp size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No recent activity</p>
                <p className="text-xs text-slate-400 mt-1">Transactions and stock movements will appear here</p>
              </div>
            ) : (
              <div>
                {recentActivity.map((entry) => (
                  <ActivityRow
                    key={entry.id}
                    date={entry.date}
                    description={entry.description}
                    amount={entry.amount}
                    type={entry.type}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
