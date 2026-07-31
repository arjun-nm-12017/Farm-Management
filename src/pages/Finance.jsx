import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit2, Trash2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import useFarmStore from '../store'
import {
  Button, Card, CardHeader, Input, Textarea, Select, Badge, Modal, Table,
  StatCard, EmptyState, SearchBar, PageHeader, Tabs, ConfirmDialog,
} from '../components/ui'
import {
  formatDate, formatCurrency, classNames, sortBy, searchFilter, groupBy, sumBy,
  getDateRange,
} from '../utils/helpers'
import { FARM_TYPES } from '../data/farmTypes'
import { format, parseISO, subMonths, startOfMonth } from 'date-fns'

// ─── Default categories when no farm type is set ────────────────────────────
const DEFAULT_INCOME_CATEGORIES = ['Crop Sales', 'Animal Sales', 'Subsidies', 'Grants', 'Other']
const DEFAULT_EXPENSE_CATEGORIES = ['Seeds', 'Feed', 'Labor', 'Fuel', 'Equipment', 'Veterinary', 'Fertilizers', 'Utilities', 'Other']

const CHART_COLORS = {
  income: '#10b981',   // emerald-500
  expense: '#f43f5e',  // rose-500
}

const PIE_COLORS = [
  '#f43f5e', '#fb923c', '#facc15', '#a78bfa', '#60a5fa',
]

const DATE_RANGE_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' },
]

const EMPTY_FORM = {
  type: 'income',
  amount: '',
  category: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  payee: '',
  notes: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInRange(dateStr, from, to) {
  try {
    const d = parseISO(dateStr)
    return d >= parseISO(from) && d <= parseISO(to)
  } catch {
    return false
  }
}

function getLastSixMonthsData(transactions) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    months.push({
      label: format(monthStart, 'MMM yy'),
      monthStart,
    })
  }

  return months.map(({ label, monthStart }) => {
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setMilliseconds(-1)

    const inMonth = transactions.filter((t) => {
      try {
        const d = parseISO(t.date)
        return d >= monthStart && d <= monthEnd
      } catch {
        return false
      }
    })

    const income = sumBy(inMonth.filter((t) => t.type === 'income'), 'amount')
    const expense = sumBy(inMonth.filter((t) => t.type === 'expense'), 'amount')
    return { month: label, Income: income, Expense: expense, Net: income - expense }
  })
}

// ─── Transaction Modal ───────────────────────────────────────────────────────

function TransactionModal({ open, onClose, editItem, incomeCategories, expenseCategories, currency }) {
  const addTransaction = useFarmStore((s) => s.addTransaction)
  const updateTransaction = useFarmStore((s) => s.updateTransaction)

  const [form, setForm] = useState(editItem ? {
    type: editItem.type,
    amount: String(editItem.amount),
    category: editItem.category,
    date: editItem.date,
    description: editItem.description || '',
    payee: editItem.payee || '',
    notes: editItem.notes || '',
  } : EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const activeCategories = form.type === 'income' ? incomeCategories : expenseCategories

  const validate = () => {
    const e = {}
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.category) e.category = 'Select a category'
    if (!form.date) e.date = 'Select a date'
    if (!form.description.trim()) e.description = 'Enter a description'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const data = { ...form, amount: Number(form.amount) }
    if (editItem) {
      updateTransaction(editItem.id, data)
    } else {
      addTransaction(data)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editItem ? 'Edit Transaction' : 'Add Transaction'}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{editItem ? 'Save Changes' : 'Add Transaction'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Type radio */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Transaction Type</label>
          <div className="flex gap-3">
            {['income', 'expense'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { set('type', t); set('category', '') }}
                className={classNames(
                  'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-colors',
                  form.type === t
                    ? t === 'income'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                )}
              >
                {t === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          error={errors.amount}
        />

        {/* Category */}
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          error={errors.category}
        >
          <option value="">Select category...</option>
          {activeCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />

        {/* Description */}
        <Input
          label="Description"
          placeholder="Brief description..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />

        {/* Payee / Source */}
        <Input
          label={form.type === 'income' ? 'Source' : 'Payee'}
          placeholder={form.type === 'income' ? 'Income source...' : 'Paid to...'}
          value={form.payee}
          onChange={(e) => set('payee', e.target.value)}
        />

        {/* Notes */}
        <Textarea
          label="Notes (optional)"
          placeholder="Additional notes..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  )
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab({ transactions, incomeCategories, expenseCategories, currency }) {
  const removeTransaction = useFarmStore((s) => s.removeTransaction)

  const [dateRange, setDateRange] = useState('this_month')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { from, to } = useMemo(() => getDateRange(dateRange), [dateRange])

  const filtered = useMemo(() => {
    let list = transactions.filter((t) => isInRange(t.date, from, to))
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter)
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter)
    list = searchFilter(list, search, ['description', 'category', 'payee', 'notes'])
    return sortBy(list, 'date', 'desc')
  }, [transactions, from, to, typeFilter, categoryFilter, search])

  const totalIncome = useMemo(() =>
    sumBy(transactions.filter((t) => t.type === 'income' && isInRange(t.date, from, to)), 'amount'),
    [transactions, from, to])

  const totalExpense = useMemo(() =>
    sumBy(transactions.filter((t) => t.type === 'expense' && isInRange(t.date, from, to)), 'amount'),
    [transactions, from, to])

  const net = totalIncome - totalExpense

  // All unique categories in range
  const allCategoriesInRange = useMemo(() => {
    const set = new Set(transactions
      .filter((t) => isInRange(t.date, from, to))
      .map((t) => t.category)
      .filter(Boolean))
    return Array.from(set).sort()
  }, [transactions, from, to])

  const handleEdit = (txn) => {
    setEditItem(txn)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditItem(null)
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => <span className="text-slate-600 whitespace-nowrap">{formatDate(row.date)}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'income' ? 'green' : 'red'}>
          {row.type === 'income' ? 'Income' : 'Expense'}
        </Badge>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <span className="text-slate-700">{row.category || '—'}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <span className="text-slate-700">{row.description || '—'}</span>,
    },
    {
      key: 'payee',
      label: 'Payee / Source',
      render: (row) => <span className="text-slate-500">{row.payee || '—'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'text-right',
      render: (row) => (
        <span className={classNames(
          'font-semibold whitespace-nowrap',
          row.type === 'income' ? 'text-emerald-700' : 'text-red-600'
        )}>
          {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount, currency)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Page header */}
      <PageHeader
        title="Finance"
        subtitle="Track income, expenses, and profitability"
        action={
          <Button onClick={() => { setEditItem(null); setShowModal(true) }}>
            <Plus size={16} />
            Add Transaction
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome, currency)}
          icon={TrendingUp}
          color="emerald"
          subtext={DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(totalExpense, currency)}
          icon={TrendingDown}
          color="red"
          subtext={DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}
        />
        <StatCard
          label="Net Profit / Loss"
          value={formatCurrency(Math.abs(net), currency)}
          icon={DollarSign}
          color={net >= 0 ? 'emerald' : 'red'}
          subtext={
            <span className={net >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {net >= 0 ? 'Profit' : 'Loss'} — {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}
            </span>
          }
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Date range */}
          <div className="w-44">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {DATE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search transactions..."
            className="flex-1 min-w-48"
          />

          {/* Type filter */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={classNames(
                  'px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors',
                  typeFilter === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="w-44">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {allCategoriesInRange.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No transactions found"
            description="Add your first transaction or adjust the filters to see results."
            action={
              <Button onClick={() => { setEditItem(null); setShowModal(true) }}>
                <Plus size={16} />
                Add Transaction
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={filtered} emptyText="No transactions found" />
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          open={showModal}
          onClose={handleCloseModal}
          editItem={editItem}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          currency={currency}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { removeTransaction(deleteTarget.id); setDeleteTarget(null) }}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleteTarget?.description || 'this transaction'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  )
}

// ─── Summary Tab ──────────────────────────────────────────────────────────────

function SummaryTab({ transactions, currency }) {
  const monthlyData = useMemo(() => getLastSixMonthsData(transactions), [transactions])

  // Top 5 expense categories (all-time or last 6 months)
  const { from: from6, to: to6 } = useMemo(() => getDateRange('last_6_months'), [])

  const expensesLast6 = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && isInRange(t.date, from6, to6)),
    [transactions, from6, to6]
  )

  const expenseByCategory = useMemo(() => {
    const grouped = groupBy(expensesLast6, 'category')
    return Object.entries(grouped)
      .map(([category, items]) => ({ category, total: sumBy(items, 'amount') }))
      .sort((a, b) => b.total - a.total)
  }, [expensesLast6])

  const top5Expenses = expenseByCategory.slice(0, 5)
  const totalExpenses = sumBy(expensesLast6, 'amount')

  // Income by category
  const incomeLast6 = useMemo(
    () => transactions.filter((t) => t.type === 'income' && isInRange(t.date, from6, to6)),
    [transactions, from6, to6]
  )

  const incomeByCategory = useMemo(() => {
    const grouped = groupBy(incomeLast6, 'category')
    return Object.entries(grouped)
      .map(([category, items]) => ({ category, total: sumBy(items, 'amount') }))
      .sort((a, b) => b.total - a.total)
  }, [incomeLast6])

  const totalIncomeLast6 = sumBy(incomeLast6, 'amount')

  const categoryColumns = [
    { key: 'category', label: 'Category', render: (row) => <span className="font-medium text-slate-800">{row.category || 'Uncategorized'}</span> },
    {
      key: 'total',
      label: 'Total Amount',
      render: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.total, currency)}</span>,
    },
    {
      key: 'pct',
      label: '% of Total',
      render: (row) => {
        const base = row._type === 'income' ? totalIncomeLast6 : totalExpenses
        const pct = base > 0 ? ((row.total / base) * 100).toFixed(1) : '0.0'
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-100 rounded-full h-1.5">
              <div
                className={classNames('h-1.5 rounded-full', row._type === 'income' ? 'bg-emerald-500' : 'bg-rose-500')}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <span className="text-slate-600 text-xs">{pct}%</span>
          </div>
        )
      },
    },
  ]

  const expenseCatData = expenseByCategory.map((r) => ({ ...r, _type: 'expense' }))
  const incomeCatData = incomeByCategory.map((r) => ({ ...r, _type: 'income' }))

  const hasData = transactions.length > 0

  return (
    <div className="space-y-6">
      {/* Income vs Expense Bar Chart */}
      <Card>
        <CardHeader title="Income vs Expenses" subtitle="Monthly comparison — last 6 months" />
        {!hasData ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            No transaction data yet. Add transactions to see charts.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${currency === 'USD' ? '$' : ''}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Net Profit Trend */}
      <Card>
        <CardHeader title="Net Profit Trend" subtitle="Monthly net profit / loss — last 6 months" />
        {!hasData ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            No data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v >= 0 ? '' : '-'}${currency === 'USD' ? '$' : ''}${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(0)}k` : Math.abs(v)}`}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line
                type="monotone"
                dataKey="Net"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie Chart */}
        <Card>
          <CardHeader title="Top Expense Categories" subtitle="Last 6 months breakdown" />
          {top5Expenses.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No expense data yet.
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={top5Expenses}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={48}
                    paddingAngle={3}
                    label={false}
                  >
                    {top5Expenses.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value, currency), name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: '12px', color: '#475569' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Category totals table */}
        <Card>
          <CardHeader title="Category Summary" subtitle="Income & expense breakdown" />
          <div className="space-y-5">
            {incomeCatData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Income</p>
                <Table
                  columns={categoryColumns}
                  data={incomeCatData}
                  emptyText="No income records"
                />
              </div>
            )}
            {expenseCatData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">Expenses</p>
                <Table
                  columns={categoryColumns}
                  data={expenseCatData}
                  emptyText="No expense records"
                />
              </div>
            )}
            {incomeCatData.length === 0 && expenseCatData.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No data for last 6 months.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

export default function Finance() {
  const transactions = useFarmStore((s) => s.transactions)
  const farmProfile = useFarmStore((s) => s.farmProfile)

  const [activeTab, setActiveTab] = useState('transactions')

  // Derive categories from farm type
  const { incomeCategories, expenseCategories } = useMemo(() => {
    const typeIds = farmProfile?.farmTypeIds || []
    if (typeIds.length === 0) {
      return { incomeCategories: DEFAULT_INCOME_CATEGORIES, expenseCategories: DEFAULT_EXPENSE_CATEGORIES }
    }
    const incomeSet = new Set()
    const expenseSet = new Set()
    typeIds.forEach((tid) => {
      const ft = FARM_TYPES.find((t) => t.id === tid)
      if (!ft) return
      ft.defaultCategories?.income?.forEach((c) => incomeSet.add(c))
      ft.defaultCategories?.expense?.forEach((c) => expenseSet.add(c))
    })
    // Fallbacks if sets empty
    if (!incomeSet.size) DEFAULT_INCOME_CATEGORIES.forEach((c) => incomeSet.add(c))
    if (!expenseSet.size) DEFAULT_EXPENSE_CATEGORIES.forEach((c) => expenseSet.add(c))
    return {
      incomeCategories: Array.from(incomeSet),
      expenseCategories: Array.from(expenseSet),
    }
  }, [farmProfile])

  const currency = farmProfile?.currency || 'USD'

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'summary', label: 'Summary' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            currency={currency}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryTab
            transactions={transactions}
            currency={currency}
          />
        )}
      </div>
    </div>
  )
}
