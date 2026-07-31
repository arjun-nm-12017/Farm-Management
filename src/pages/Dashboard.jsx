import { useMemo } from 'react'
import { Wheat, Heart, Package, CheckSquare, TrendingUp, AlertTriangle, Calendar, ArrowRight, BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import useFarmStore from '../store'
import { Card, CardHeader, StatCard, Badge, PriorityBadge, StatusBadge, SectionDivider } from '../components/ui'
import WeatherWidget from '../components/weather/WeatherWidget'
import { formatDate, formatCurrency, timeAgo, isOverdue, isUpcoming, classNames, sortBy } from '../utils/helpers'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatGreetingDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function getHourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function TaskRow({ task }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'Done' && task.status !== 'Cancelled'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={classNames(
        'w-2 h-2 rounded-full shrink-0',
        overdue ? 'bg-red-400' : task.status === 'In Progress' ? 'bg-blue-400' : 'bg-slate-300'
      )} />
      <div className="flex-1 min-w-0">
        <p className={classNames('text-sm font-medium truncate', overdue ? 'text-red-600' : 'text-slate-800')}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className={classNames('text-xs mt-0.5', overdue ? 'text-red-400' : 'text-slate-400')}>
            {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            {task.assignedTo && ` · ${task.assignedTo}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {task.priority && <PriorityBadge priority={task.priority} />}
      </div>
    </div>
  )
}

function AlertRow({ icon: Icon, iconBg, iconColor, label, description }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={classNames('rounded-xl p-2 shrink-0', iconBg)}>
        <Icon size={14} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>}
      </div>
    </div>
  )
}

function ActivityRow({ date, description, amount, type }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={classNames(
        'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
        type === 'income' ? 'bg-emerald-50' : type === 'expense' ? 'bg-red-50' : 'bg-slate-100'
      )}>
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
        <p className={classNames(
          'text-sm font-semibold shrink-0',
          type === 'income' ? 'text-emerald-600' : type === 'expense' ? 'text-red-500' : 'text-slate-600'
        )}>
          {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
          {formatCurrency(amount)}
        </p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const {
    farmProfile, enabledModules, currentUser,
    fields, crops, animals, healthRecords,
    inventoryItems, stockLogs, tasks, transactions,
  } = useFarmStore()

  const today = todayISO()

  const activeFieldsCount = fields.length
  const activeCropsCount = crops.filter((c) => c.stage !== 'Harvested').length
  const livestockCount = animals.filter((a) => a.status !== 'Sold' && a.status !== 'Deceased').length
  const inventoryCount = inventoryItems.length

  const todaysTasks = useMemo(() =>
    sortBy(
      tasks.filter((t) => {
        if (t.status === 'Done' || t.status === 'Cancelled') return false
        return t.dueDate && t.dueDate.slice(0, 10) <= today
      }),
      'dueDate', 'asc'
    ), [tasks, today])

  const lowStockAlerts = useMemo(() =>
    inventoryItems.filter((i) => i.reorderAt != null && i.quantity <= i.reorderAt),
    [inventoryItems])

  const overdueTaskAlerts = useMemo(() =>
    tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled' && t.dueDate && t.dueDate.slice(0, 10) < today),
    [tasks, today])

  const upcomingHealthAlerts = useMemo(() =>
    healthRecords.filter((r) => r.nextDue && isUpcoming(r.nextDue, 7)),
    [healthRecords])

  const hasAlerts = lowStockAlerts.length > 0 || overdueTaskAlerts.length > 0 ||
    (enabledModules.livestock && upcomingHealthAlerts.length > 0)

  const recentActivity = useMemo(() => {
    const txns = transactions.map((t) => ({
      id: t.id, date: t.createdAt || t.date,
      description: t.description || t.category,
      amount: t.amount, type: t.type, sortKey: t.createdAt || t.date,
    }))
    const stocks = stockLogs.map((s) => {
      const item = inventoryItems.find((i) => i.id === s.itemId)
      return {
        id: s.id, date: s.createdAt || s.date,
        description: `${s.type === 'in' ? 'Received' : 'Used'} ${s.quantity} ${item?.unit || ''} of ${item?.name || 'item'}`,
        amount: null, type: 'stock', sortKey: s.createdAt || s.date,
      }
    })
    return sortBy([...txns, ...stocks], 'sortKey', 'desc').slice(0, 5)
  }, [transactions, stockLogs, inventoryItems])

  return (
    <div className="space-y-7">

      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getHourGreeting()}, <span className="text-emerald-600">{currentUser?.name?.split(' ')[0] || 'Farmer'}</span> 👋
          </h1>
          {farmProfile?.name && (
            <p className="text-sm text-slate-500 mt-1">{farmProfile.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm shrink-0 w-fit">
          <Calendar size={14} className="text-emerald-500" />
          <span className="font-medium">{formatGreetingDate()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {enabledModules.fields && (
          <StatCard label="Fields / Crops" value={`${activeFieldsCount} / ${activeCropsCount}`}
            icon={Wheat} color="emerald" subtext="Active fields and crops" />
        )}
        {enabledModules.livestock && (
          <StatCard label="Livestock" value={livestockCount}
            icon={Heart} color="amber" subtext="Active animals" />
        )}
        {enabledModules.inventory && (
          <StatCard label="Inventory" value={inventoryCount}
            icon={Package} color="blue"
            subtext={lowStockAlerts.length > 0 ? `${lowStockAlerts.length} low on stock` : 'All stocked'} />
        )}
        {enabledModules.tasks && (
          <StatCard label="Tasks Today" value={todaysTasks.length}
            icon={CheckSquare} color={todaysTasks.length > 0 ? 'red' : 'emerald'}
            subtext={todaysTasks.length > 0 ? 'Pending or overdue' : 'All clear!'} />
        )}
      </div>

      {/* Weather + Quick links row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {enabledModules.weather && (
          <div className="lg:col-span-1">
            <WeatherWidget compact={true} />
          </div>
        )}

        {/* Quick nav cards */}
        <div className={classNames('grid grid-cols-2 gap-3', enabledModules.weather ? 'lg:col-span-2' : 'lg:col-span-3')}>
          {[
            enabledModules.tasks && { to: '/tasks', label: 'View Tasks', icon: CheckSquare, color: 'bg-blue-50 text-blue-600', count: todaysTasks.length, countLabel: 'pending' },
            enabledModules.inventory && { to: '/inventory', label: 'Inventory', icon: Package, color: 'bg-amber-50 text-amber-600', count: lowStockAlerts.length, countLabel: 'low stock' },
            enabledModules.finance && { to: '/finance', label: 'Finance', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', count: null },
            enabledModules.reports && { to: '/reports', label: 'Reports', icon: BarChart2, color: 'bg-purple-50 text-purple-600', count: null },
          ].filter(Boolean).slice(0, 4).map((item) => (
            <Link key={item.to} to={item.to}>
              <Card hover className="h-full">
                <div className="flex items-center gap-3">
                  <div className={classNames('rounded-xl p-2.5', item.color)}>
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    {item.count > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{item.count} {item.countLabel}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-slate-300 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tasks + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {enabledModules.tasks && (
          <Card>
            <CardHeader
              title="Today's Tasks"
              subtitle={todaysTasks.length ? `${todaysTasks.length} pending` : 'Nothing due today'}
              action={
                todaysTasks.length > 0
                  ? <Badge variant="red">{todaysTasks.length}</Badge>
                  : null
              }
            />
            {todaysTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckSquare size={22} className="text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No tasks due today</p>
              </div>
            ) : (
              <div>
                {todaysTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} />)}
                {todaysTasks.length > 5 && (
                  <Link to="/tasks" className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-3 hover:underline">
                    View all {todaysTasks.length} tasks <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            )}
          </Card>
        )}

        <Card>
          <CardHeader
            title="Active Alerts"
            subtitle="Items requiring attention"
            action={hasAlerts ? <div className="w-2 h-2 rounded-full bg-red-500 mt-1 animate-pulse" /> : null}
          />
          {!hasAlerts ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <AlertTriangle size={22} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No alerts</p>
              <p className="text-xs text-slate-400 mt-1">Everything looks good</p>
            </div>
          ) : (
            <div>
              {enabledModules.inventory && lowStockAlerts.slice(0, 3).map((item) => (
                <AlertRow key={`stock-${item.id}`} icon={Package}
                  iconBg="bg-amber-50" iconColor="text-amber-600"
                  label={`Low stock: ${item.name}`}
                  description={`${item.quantity} ${item.unit || ''} left (reorder at ${item.reorderAt})`} />
              ))}
              {enabledModules.tasks && overdueTaskAlerts.slice(0, 3).map((task) => (
                <AlertRow key={`task-${task.id}`} icon={CheckSquare}
                  iconBg="bg-red-50" iconColor="text-red-600"
                  label={`Overdue: ${task.title}`}
                  description={`Due ${formatDate(task.dueDate)}${task.assignedTo ? ` · ${task.assignedTo}` : ''}`} />
              ))}
              {enabledModules.livestock && upcomingHealthAlerts.slice(0, 2).map((record) => {
                const animal = animals.find((a) => a.id === record.animalId)
                return (
                  <AlertRow key={`health-${record.id}`} icon={Heart}
                    iconBg="bg-purple-50" iconColor="text-purple-600"
                    label={`Health due: ${record.type}${animal ? ` — ${animal.name || animal.tag}` : ''}`}
                    description={`Scheduled ${formatDate(record.nextDue)}`} />
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <SectionDivider label="Recent Activity" />
        <Card>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <TrendingUp size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No recent activity</p>
              <p className="text-xs text-slate-400 mt-1">Transactions and stock movements will appear here</p>
            </div>
          ) : (
            <div>
              {recentActivity.map((entry) => (
                <ActivityRow key={entry.id} date={entry.date}
                  description={entry.description} amount={entry.amount} type={entry.type} />
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  )
}
