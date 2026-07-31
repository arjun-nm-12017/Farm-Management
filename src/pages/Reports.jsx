import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar,
} from 'recharts'
import { BarChart2, Download, TrendingUp, Calendar, Filter } from 'lucide-react'
import { parseISO, isAfter, isBefore, format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

import useFarmStore from '../store'
import {
  Button, Card, CardHeader, Select, Badge, Alert, Table, StatCard,
  EmptyState, PageHeader, Tabs,
} from '../components/ui'
import {
  formatDate, formatCurrency, formatNumber, isOverdue, groupBy, sumBy, sortBy,
} from '../utils/helpers'

const COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#db2777']

// ─── Date range helpers ──────────────────────────────────────────────────────
function getDateRangeBounds(range) {
  const now = new Date()
  switch (range) {
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'last_3_months':
      return { from: subMonths(startOfMonth(now), 2), to: endOfMonth(now) }
    case 'last_6_months':
      return { from: subMonths(startOfMonth(now), 5), to: endOfMonth(now) }
    case 'this_year':
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

function inRange(dateStr, from, to) {
  if (!dateStr) return false
  try {
    const d = parseISO(dateStr)
    return !isBefore(d, from) && !isAfter(d, to)
  } catch {
    return false
  }
}

// Build last N months labels
function buildMonthLabels(from, to) {
  const months = []
  let cur = startOfMonth(from)
  while (!isAfter(cur, to)) {
    months.push(format(cur, 'MMM yy'))
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return months
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {currency ? formatCurrency(p.value, currency) : formatNumber(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ range, transactions, tasks, animals, inventoryItems, enabledModules, currency }) {
  const { from, to } = getDateRangeBounds(range)

  const filtered = transactions.filter((t) => inRange(t.date, from, to))
  const income = sumBy(filtered.filter((t) => t.type === 'income'), 'amount')
  const expense = sumBy(filtered.filter((t) => t.type === 'expense'), 'amount')
  const pnl = income - expense

  const activeTasks = tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled').length
  const lowStock = inventoryItems.filter((i) => i.reorderAt != null && Number(i.quantity) <= Number(i.reorderAt)).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(income, currency)}
          color="emerald"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(expense, currency)}
          color="red"
          icon={TrendingUp}
        />
        <StatCard
          label="Net P&L"
          value={formatCurrency(pnl, currency)}
          color={pnl >= 0 ? 'emerald' : 'red'}
          icon={BarChart2}
        />
        <StatCard
          label="Active Tasks"
          value={formatNumber(activeTasks)}
          color="blue"
          icon={Calendar}
        />
        {enabledModules.livestock && (
          <StatCard
            label="Total Animals"
            value={formatNumber(animals.length)}
            color="amber"
            icon={BarChart2}
          />
        )}
        <StatCard
          label="Low Stock Items"
          value={formatNumber(lowStock)}
          color={lowStock > 0 ? 'amber' : 'slate'}
          icon={Filter}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Income vs Expenses" subtitle="Selected period breakdown" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ name: 'Summary', Income: income, Expenses: expense }]} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} width={80} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend />
              <Bar dataKey="Income" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Quick Stats" subtitle="At a glance" />
          <div className="space-y-3 mt-2">
            {[
              { label: 'Transactions in period', value: filtered.length },
              { label: 'Income transactions', value: filtered.filter((t) => t.type === 'income').length },
              { label: 'Expense transactions', value: filtered.filter((t) => t.type === 'expense').length },
              { label: 'Total tasks', value: tasks.length },
              { label: 'Completed tasks', value: tasks.filter((t) => t.status === 'Done').length },
              { label: 'Overdue tasks', value: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Cancelled').length },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Finance Report Tab ──────────────────────────────────────────────────────
function FinanceTab({ range, transactions, currency }) {
  const { from, to } = getDateRangeBounds(range)
  const filtered = transactions.filter((t) => inRange(t.date, from, to))

  const monthLabels = buildMonthLabels(from, to)

  const monthlyData = monthLabels.map((label) => {
    const [mon, yr] = label.split(' ')
    const txns = filtered.filter((t) => {
      if (!t.date) return false
      try {
        const d = parseISO(t.date)
        return format(d, 'MMM yy') === label
      } catch { return false }
    })
    return {
      month: label,
      Income: sumBy(txns.filter((t) => t.type === 'income'), 'amount'),
      Expenses: sumBy(txns.filter((t) => t.type === 'expense'), 'amount'),
    }
  })

  const expensesByCategory = useMemo(() => {
    const expenses = filtered.filter((t) => t.type === 'expense')
    const grouped = groupBy(expenses, 'category')
    return Object.entries(grouped)
      .map(([name, items]) => ({ name: name || 'Uncategorized', value: sumBy(items, 'amount') }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const topCategories = useMemo(() => {
    const all = groupBy(filtered, (t) => `${t.type}:${t.category || 'Uncategorized'}`)
    return Object.entries(all)
      .map(([key, items]) => {
        const [type, category] = key.split(':')
        return { type, category, count: items.length, total: sumBy(items, 'amount') }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [filtered])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Monthly Income vs Expenses" subtitle="Trend over selected period" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${formatCurrency(v, currency)}`} width={90} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            <Bar dataKey="Income" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Expenses by Category" />
          {expensesByCategory.length === 0 ? (
            <EmptyState icon={BarChart2} title="No expense data" description="No expenses in this period." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expensesByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-2">
            <CardHeader title="Top Categories by Amount" />
          </div>
          <Table
            columns={[
              { key: 'type', label: 'Type', render: (r) => (
                <Badge variant={r.type === 'income' ? 'green' : 'red'}>{r.type}</Badge>
              )},
              { key: 'category', label: 'Category' },
              { key: 'count', label: 'Count' },
              { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total, currency) },
            ]}
            data={topCategories}
            emptyText="No transactions in this period."
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Fields/Crop Report Tab ──────────────────────────────────────────────────
function FieldsTab({ fields, crops, fieldActivities }) {
  const cropRows = useMemo(() =>
    crops.map((crop) => {
      const field = fields.find((f) => f.id === crop.fieldId)
      const actCount = fieldActivities.filter((a) => a.cropId === crop.id || a.fieldId === crop.fieldId).length
      return { ...crop, fieldName: field?.name || '—', actCount }
    }).sort((a, b) => (a.plantingDate > b.plantingDate ? -1 : 1)),
    [crops, fields, fieldActivities]
  )

  const activityBreakdown = useMemo(() => {
    const grouped = groupBy(fieldActivities, 'type')
    return Object.entries(grouped).map(([name, items]) => ({ name: name || 'Other', count: items.length }))
  }, [fieldActivities])

  return (
    <div className="space-y-6">
      <Card padding={false}>
        <div className="p-5 pb-2">
          <CardHeader title="Crop Summary" subtitle={`${crops.length} crops across ${fields.length} fields`} />
        </div>
        <Table
          columns={[
            { key: 'name', label: 'Crop' },
            { key: 'variety', label: 'Variety', render: (r) => r.variety || '—' },
            { key: 'fieldName', label: 'Field' },
            { key: 'plantingDate', label: 'Planted', render: (r) => formatDate(r.plantingDate) },
            { key: 'expectedHarvestDate', label: 'Harvest', render: (r) => formatDate(r.expectedHarvestDate) },
            { key: 'stage', label: 'Stage', render: (r) => r.stage ? <Badge variant="green">{r.stage}</Badge> : '—' },
            { key: 'actCount', label: 'Activities' },
          ]}
          data={cropRows}
          emptyText="No crops recorded yet."
        />
      </Card>

      <Card>
        <CardHeader title="Field Activity Breakdown" subtitle="Count by activity type" />
        {activityBreakdown.length === 0 ? (
          <EmptyState icon={BarChart2} title="No activities" description="No field activities recorded yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={activityBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Activities" radius={[4, 4, 0, 0]}>
                {activityBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

// ─── Livestock Report Tab ────────────────────────────────────────────────────
function LivestockTab({ animals, healthRecords, productionLogs }) {
  const speciesData = useMemo(() => {
    const grouped = groupBy(animals, 'species')
    return Object.entries(grouped).map(([name, items]) => ({ name: name || 'Unknown', count: items.length }))
  }, [animals])

  const recentHealth = useMemo(() =>
    sortBy(healthRecords, 'date', 'desc').slice(0, 10),
    [healthRecords]
  )

  const productionByType = useMemo(() => {
    const grouped = groupBy(productionLogs, 'type')
    return Object.entries(grouped).map(([type, logs]) => ({
      type: type || 'Other',
      total: sumBy(logs, 'quantity'),
      count: logs.length,
    }))
  }, [productionLogs])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Animals by Species" subtitle={`${animals.length} total animals`} />
          {speciesData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No animals" description="No animals recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={speciesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  label={({ name, count }) => `${name} (${count})`}
                >
                  {speciesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Production Summary" subtitle="By type" />
          {productionByType.length === 0 ? (
            <EmptyState icon={BarChart2} title="No production logs" description="No production data recorded." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={productionByType} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total Quantity" radius={[4, 4, 0, 0]}>
                  {productionByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent Health Events" subtitle="Last 10 health records" />
        {recentHealth.length === 0 ? (
          <EmptyState icon={BarChart2} title="No health records" description="No health events recorded yet." />
        ) : (
          <div className="space-y-2">
            {recentHealth.map((rec) => {
              const animal = null // animals not passed directly for lookup here — use animalId
              return (
                <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{rec.type || 'Health Event'}</span>
                      <Badge variant="blue">{formatDate(rec.date)}</Badge>
                      {rec.cost != null && <Badge variant="yellow">{formatCurrency(rec.cost)}</Badge>}
                    </div>
                    {rec.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{rec.description}</p>}
                    {rec.vetName && <p className="text-xs text-slate-400">Vet: {rec.vetName}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Inventory Report Tab ────────────────────────────────────────────────────
function InventoryTab({ inventoryItems, stockLogs }) {
  const lowStockItems = inventoryItems.filter(
    (i) => i.reorderAt != null && Number(i.quantity) <= Number(i.reorderAt)
  )

  const top10 = useMemo(() =>
    sortBy(inventoryItems, 'quantity', 'desc').slice(0, 10).map((i) => ({
      name: i.name,
      Quantity: Number(i.quantity) || 0,
      Threshold: Number(i.reorderAt) || 0,
    })),
    [inventoryItems]
  )

  const stockMovementByMonth = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, idx) => {
      const monthDate = subMonths(now, 5 - idx)
      const label = format(monthDate, 'MMM yy')
      const monthLogs = stockLogs.filter((l) => {
        if (!l.date) return false
        try { return format(parseISO(l.date), 'MMM yy') === label } catch { return false }
      })
      return {
        month: label,
        In: sumBy(monthLogs.filter((l) => l.type === 'in'), 'quantity'),
        Out: sumBy(monthLogs.filter((l) => l.type === 'out'), 'quantity'),
      }
    })
  }, [stockLogs])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Stock Levels — Top 10 Items" subtitle="Quantity vs reorder threshold" />
        {top10.length === 0 ? (
          <EmptyState icon={BarChart2} title="No inventory" description="No inventory items found." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Quantity" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Threshold" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding={false}>
          <div className="p-5 pb-2">
            <CardHeader
              title="Low Stock Items"
              subtitle={`${lowStockItems.length} items at or below reorder threshold`}
              action={lowStockItems.length > 0 ? <Badge variant="red">{lowStockItems.length} alerts</Badge> : null}
            />
          </div>
          <Table
            columns={[
              { key: 'name', label: 'Item' },
              { key: 'category', label: 'Category', render: (r) => r.category || '—' },
              { key: 'quantity', label: 'In Stock' },
              { key: 'reorderAt', label: 'Reorder At' },
              { key: 'unit', label: 'Unit', render: (r) => r.unit || '—' },
            ]}
            data={lowStockItems}
            emptyText="All items are sufficiently stocked."
          />
        </Card>

        <Card>
          <CardHeader title="Stock Movement (Last 6 Months)" subtitle="Units in vs out per month" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockMovementByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="In" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Out" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ─── Tasks Report Tab ────────────────────────────────────────────────────────
function TasksTab({ tasks, range }) {
  const { from, to } = getDateRangeBounds(range)

  const periodTasks = tasks.filter((t) => inRange(t.createdAt, from, to))
  const total = periodTasks.length
  const done = periodTasks.filter((t) => t.status === 'Done').length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  const statusData = useMemo(() => {
    const statuses = ['To Do', 'In Progress', 'Done', 'Cancelled']
    return statuses.map((s, i) => ({
      name: s,
      value: tasks.filter((t) => t.status === s).length,
      fill: COLORS[i % COLORS.length],
    })).filter((d) => d.value > 0)
  }, [tasks])

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && isOverdue(t.dueDate) && t.status !== 'Done' && t.status !== 'Cancelled'
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Tasks (period)" value={total} color="slate" icon={BarChart2} />
        <StatCard label="Completed (period)" value={done} color="emerald" icon={BarChart2} />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          color={completionRate >= 70 ? 'emerald' : completionRate >= 40 ? 'amber' : 'red'}
          icon={TrendingUp}
          subtext="tasks created in selected period"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Tasks by Status" subtitle="All tasks" />
          {statusData.length === 0 ? (
            <EmptyState icon={BarChart2} title="No tasks" description="No tasks recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-2">
            <CardHeader
              title="Overdue Tasks"
              subtitle={`${overdueTasks.length} tasks past due date`}
              action={overdueTasks.length > 0 ? <Badge variant="red">{overdueTasks.length}</Badge> : null}
            />
          </div>
          <Table
            columns={[
              { key: 'title', label: 'Task' },
              { key: 'dueDate', label: 'Due', render: (r) => <span className="text-red-600 font-medium">{formatDate(r.dueDate)}</span> },
              { key: 'priority', label: 'Priority', render: (r) => <Badge variant={r.priority === 'Urgent' ? 'red' : r.priority === 'High' ? 'orange' : 'yellow'}>{r.priority}</Badge> },
              { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
            ]}
            data={overdueTasks}
            emptyText="No overdue tasks."
          />
        </Card>
      </div>
    </div>
  )
}

// ─── Export Section ──────────────────────────────────────────────────────────
function ExportSection() {
  const [showAlert, setShowAlert] = useState(false)
  const [exportType, setExportType] = useState('')

  function handleExport(type) {
    setExportType(type)
    setShowAlert(true)
  }

  return (
    <Card>
      <CardHeader
        title="Export Reports"
        subtitle="Download your farm data and analytics"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
              <Download size={14} />
              Export PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('CSV')}>
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />
      {showAlert && (
        <Alert variant="info" onClose={() => setShowAlert(false)}>
          <strong>{exportType} export</strong> is coming soon. This feature will allow you to download
          a full {exportType === 'PDF' ? 'formatted PDF report' : 'CSV spreadsheet'} of your farm analytics.
        </Alert>
      )}
    </Card>
  )
}

// ─── Main Reports Page ───────────────────────────────────────────────────────
export default function Reports() {
  const {
    enabledModules,
    farmProfile,
    transactions,
    tasks,
    animals,
    inventoryItems,
    stockLogs,
    fields,
    crops,
    fieldActivities,
    healthRecords,
    productionLogs,
  } = useFarmStore()

  const currency = farmProfile?.currency || 'USD'

  const [range, setRange] = useState('this_month')
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = useMemo(() => {
    const t = [{ id: 'overview', label: 'Overview' }]
    if (enabledModules.finance !== false) t.push({ id: 'finance', label: 'Finance' })
    if (enabledModules.fields) t.push({ id: 'fields', label: 'Fields & Crops' })
    if (enabledModules.livestock) t.push({ id: 'livestock', label: 'Livestock' })
    if (enabledModules.inventory !== false) t.push({ id: 'inventory', label: 'Inventory' })
    if (enabledModules.tasks !== false) t.push({ id: 'tasks', label: 'Tasks' })
    return t
  }, [enabledModules])

  // Reset to overview if current tab becomes unavailable
  const validTab = tabs.find((t) => t.id === activeTab) ? activeTab : 'overview'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Insights and summaries across your farm operations"
          breadcrumb="Farm Management"
          action={
            <div className="flex items-center gap-3">
              <BarChart2 size={20} className="text-emerald-600" />
              <Select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-44"
              >
                <option value="this_month">This Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="this_year">This Year</option>
              </Select>
            </div>
          }
        />

        <Tabs tabs={tabs} active={validTab} onChange={setActiveTab} />

        {validTab === 'overview' && (
          <OverviewTab
            range={range}
            transactions={transactions}
            tasks={tasks}
            animals={animals}
            inventoryItems={inventoryItems}
            enabledModules={enabledModules}
            currency={currency}
          />
        )}
        {validTab === 'finance' && (
          <FinanceTab range={range} transactions={transactions} currency={currency} />
        )}
        {validTab === 'fields' && (
          <FieldsTab fields={fields} crops={crops} fieldActivities={fieldActivities} />
        )}
        {validTab === 'livestock' && (
          <LivestockTab animals={animals} healthRecords={healthRecords} productionLogs={productionLogs} />
        )}
        {validTab === 'inventory' && (
          <InventoryTab inventoryItems={inventoryItems} stockLogs={stockLogs} />
        )}
        {validTab === 'tasks' && (
          <TasksTab tasks={tasks} range={range} />
        )}

        <ExportSection />
      </div>
    </div>
  )
}
