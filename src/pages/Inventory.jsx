import { useState, useMemo } from 'react'
import { Package, Plus, ArrowDown, ArrowUp, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import useFarmStore from '../store'
import {
  Button, Card, Input, Textarea, Select, Badge, Alert,
  Modal, Table, StatCard, EmptyState, SearchBar, PageHeader, Tabs,
  ConfirmDialog,
} from '../components/ui'
import {
  formatDate, formatDateTime, formatNumber, searchFilter, sortBy,
} from '../utils/helpers'
import { FARM_TYPES } from '../data/farmTypes'

// ─── helpers ────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)

const isLowStock = (item) =>
  item.reorderAt != null && item.reorderAt !== '' && Number(item.quantity) <= Number(item.reorderAt)

function getDefaultCategories(farmProfile) {
  if (!farmProfile) return []
  const farmType = FARM_TYPES.find((t) => t.id === farmProfile.type)
  return farmType?.defaultCategories?.inventory || []
}

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
]

function filterByDateRange(logs, range) {
  if (range === 'all') return logs
  const now = new Date()
  const days = range === '7d' ? 7 : 30
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return logs.filter((log) => {
    const d = new Date(log.date || log.createdAt)
    return d >= cutoff
  })
}

// ─── Add / Edit Item Modal ───────────────────────────────────────────────────

const EMPTY_ITEM = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  reorderAt: '',
  location: '',
  notes: '',
}

function ItemModal({ open, onClose, initial, onSave, farmProfile }) {
  const [form, setForm] = useState(initial || EMPTY_ITEM)
  const [errors, setErrors] = useState({})

  // Sync when initial changes (open/edit)
  useMemo(() => {
    setForm(initial || EMPTY_ITEM)
    setErrors({})
  }, [initial, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = getDefaultCategories(farmProfile)
  const isEdit = Boolean(initial?.id)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave({
      ...form,
      quantity: form.quantity === '' ? 0 : Number(form.quantity),
      reorderAt: form.reorderAt === '' ? null : Number(form.reorderAt),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Item' : 'Add Inventory Item'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Item'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Item Name *"
          placeholder="e.g. Urea Fertilizer"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-4">
          {categories.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors hover:border-slate-400"
                value={form.category}
                onChange={set('category')}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__other__">Other…</option>
              </select>
            </div>
          ) : (
            <Input
              label="Category"
              placeholder="e.g. Fertilizers"
              value={form.category}
              onChange={set('category')}
            />
          )}

          <Input
            label="Unit"
            placeholder="e.g. kg, liters, bags"
            value={form.unit}
            onChange={set('unit')}
          />
        </div>

        {/* If "Other" was selected from dropdown, show a free-text input */}
        {form.category === '__other__' && (
          <Input
            label="Custom Category"
            placeholder="Type custom category"
            value=""
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            autoFocus
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={form.quantity}
            onChange={set('quantity')}
          />
          <Input
            label="Reorder At"
            type="number"
            min="0"
            step="any"
            placeholder="Alert threshold"
            value={form.reorderAt}
            onChange={set('reorderAt')}
            hint="Low-stock alert triggers at or below this level"
          />
        </div>

        <Input
          label="Storage Location"
          placeholder="e.g. Warehouse A, Shed 2"
          value={form.location}
          onChange={set('location')}
        />

        <Textarea
          label="Notes"
          placeholder="Additional notes…"
          value={form.notes}
          onChange={set('notes')}
          rows={2}
        />
      </div>
    </Modal>
  )
}

// ─── Stock Log Modal ─────────────────────────────────────────────────────────

const EMPTY_LOG = { itemId: '', type: 'in', quantity: '', reason: '', date: today() }

function StockLogModal({ open, onClose, onSave, inventoryItems, preselectedItemId }) {
  const [form, setForm] = useState({ ...EMPTY_LOG, itemId: preselectedItemId || '' })
  const [errors, setErrors] = useState({})

  useMemo(() => {
    setForm({ ...EMPTY_LOG, itemId: preselectedItemId || '', date: today() })
    setErrors({})
  }, [open, preselectedItemId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.itemId) errs.itemId = 'Please select an item'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Enter a positive quantity'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave({ ...form, quantity: Number(form.quantity) })
  }

  const selectedItem = inventoryItems.find((i) => i.id === form.itemId)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Stock Change"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Log Change</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Item *"
          value={form.itemId}
          onChange={set('itemId')}
          error={errors.itemId}
        >
          <option value="">Select item…</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}{item.category ? ` (${item.category})` : ''}
            </option>
          ))}
        </Select>

        {selectedItem && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
            <Package size={14} className="shrink-0 text-slate-400" />
            Current stock: <span className="font-semibold text-slate-900">
              {formatNumber(selectedItem.quantity)} {selectedItem.unit}
            </span>
          </div>
        )}

        {/* Type radio */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Type *</label>
          <div className="flex gap-3">
            {[
              { value: 'in', label: 'Stock In', color: 'emerald' },
              { value: 'out', label: 'Stock Out', color: 'red' },
            ].map(({ value, label, color }) => (
              <label
                key={value}
                className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  form.type === value
                    ? color === 'emerald'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-red-400 bg-red-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="stockType"
                  value={value}
                  checked={form.type === value}
                  onChange={set('type')}
                  className="sr-only"
                />
                {value === 'in' ? (
                  <ArrowDown size={16} className={form.type === 'in' ? 'text-emerald-600' : 'text-slate-400'} />
                ) : (
                  <ArrowUp size={16} className={form.type === 'out' ? 'text-red-500' : 'text-slate-400'} />
                )}
                <span className={`text-sm font-medium ${
                  form.type === value
                    ? color === 'emerald' ? 'text-emerald-700' : 'text-red-600'
                    : 'text-slate-600'
                }`}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity *"
            type="number"
            min="0.01"
            step="any"
            placeholder="0"
            value={form.quantity}
            onChange={set('quantity')}
            error={errors.quantity}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={set('date')}
          />
        </div>

        <Input
          label="Reason"
          placeholder="e.g. Purchase, Used in field, Damaged"
          value={form.reason}
          onChange={set('reason')}
        />
      </div>
    </Modal>
  )
}

// ─── Stock Tab ───────────────────────────────────────────────────────────────

function StockTab({
  inventoryItems,
  stockLogs,
  farmProfile,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
  addStockLog,
  // Controlled from parent header buttons
  externalAddOpen,
  onExternalAddClose,
  externalLogOpen,
  onExternalLogClose,
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [logItem, setLogItem] = useState(null) // { id, forceType:'in'|'out' } or null for general log
  const [deleteItem, setDeleteItem] = useState(null)

  // Merge external (header) open signals with internal state
  const addModalOpen = showAddModal || externalAddOpen
  const logModalOpen = Boolean(logItem) || externalLogOpen
  const logPreselectedId = logItem?.id || ''

  const closeAddModal = () => { setShowAddModal(false); onExternalAddClose?.() }
  const closeLogModal = () => { setLogItem(null); onExternalLogClose?.() }

  const allCategories = useMemo(() => {
    const cats = new Set(inventoryItems.map((i) => i.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [inventoryItems])

  const filtered = useMemo(() => {
    let items = inventoryItems
    if (categoryFilter) items = items.filter((i) => i.category === categoryFilter)
    if (search) items = searchFilter(items, search, ['name', 'category', 'location'])
    return sortBy(items, 'name')
  }, [inventoryItems, search, categoryFilter])

  const lowStockCount = useMemo(() => inventoryItems.filter(isLowStock).length, [inventoryItems])
  const categoriesCount = useMemo(() => new Set(inventoryItems.map((i) => i.category).filter(Boolean)).size, [inventoryItems])

  const handleSaveItem = (data) => {
    if (editItem?.id) {
      updateInventoryItem(editItem.id, data)
    } else {
      addInventoryItem(data)
    }
    closeAddModal()
    setEditItem(null)
  }

  const handleStockLog = (data) => {
    addStockLog(data)
    closeLogModal()
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category
        ? <Badge className="text-xs">{row.category}</Badge>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => (
        <span className={isLowStock(row) ? 'font-semibold text-red-600' : 'text-slate-700'}>
          {formatNumber(row.quantity, 2)} {row.unit || ''}
        </span>
      ),
    },
    {
      key: 'reorderAt',
      label: 'Reorder At',
      render: (row) =>
        row.reorderAt != null && row.reorderAt !== ''
          ? <span className="text-slate-600">{formatNumber(row.reorderAt, 2)} {row.unit || ''}</span>
          : <span className="text-slate-400">—</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => row.location || <span className="text-slate-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        isLowStock(row)
          ? <Badge variant="red" className="text-xs">Low Stock</Badge>
          : <Badge variant="green" className="text-xs">OK</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Stock In"
            onClick={() => setLogItem({ id: row.id, forceType: 'in' })}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowDown size={15} />
          </button>
          <button
            title="Stock Out"
            onClick={() => setLogItem({ id: row.id, forceType: 'out' })}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
          >
            <ArrowUp size={15} />
          </button>
          <button
            title="Edit"
            onClick={() => setEditItem(row)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            title="Delete"
            onClick={() => setDeleteItem(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Alert variant="warning">
          <span className="font-semibold">{lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} running low on stock.</span>
          {' '}Check the table below and reorder as needed.
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Items"
          value={inventoryItems.length}
          icon={Package}
          color="emerald"
        />
        <StatCard
          label="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          color={lowStockCount > 0 ? 'red' : 'slate'}
          subtext={lowStockCount > 0 ? 'Needs attention' : 'All levels OK'}
        />
        <StatCard
          label="Categories"
          value={categoriesCount}
          icon={Package}
          color="blue"
          subtext="Distinct item types"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search items…"
          className="flex-1 min-w-48"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors hover:border-slate-400"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card padding={false} className="overflow-hidden rounded-2xl">
        {filtered.length === 0 && inventoryItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items yet"
            description="Start by adding items to track quantities, set reorder levels, and log stock changes."
            action={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add First Item
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            data={filtered}
            emptyText="No items match your search."
          />
        )}
      </Card>

      {/* Add Item Modal (internal + header-triggered) */}
      <ItemModal
        open={addModalOpen}
        onClose={closeAddModal}
        initial={null}
        onSave={handleSaveItem}
        farmProfile={farmProfile}
      />

      {/* Edit Item Modal */}
      <ItemModal
        open={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        initial={editItem}
        onSave={handleSaveItem}
        farmProfile={farmProfile}
      />

      {/* Stock Log Modal (internal + header-triggered) */}
      <StockLogModal
        open={logModalOpen}
        onClose={closeLogModal}
        onSave={handleStockLog}
        inventoryItems={inventoryItems}
        preselectedItemId={logPreselectedId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => { removeInventoryItem(deleteItem.id); setDeleteItem(null) }}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteItem?.name}"? All associated stock logs will remain but will no longer reference a valid item.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

// ─── Stock Log Tab ───────────────────────────────────────────────────────────

function StockLogTab({ stockLogs, inventoryItems }) {
  const [dateFilter, setDateFilter] = useState('all')

  const itemMap = useMemo(() => {
    const m = {}
    inventoryItems.forEach((i) => { m[i.id] = i })
    return m
  }, [inventoryItems])

  const filtered = useMemo(() => {
    const logs = filterByDateRange(stockLogs, dateFilter)
    return sortBy(logs, 'date', 'desc')
  }, [stockLogs, dateFilter])

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <div>
          <p className="text-slate-900">{formatDate(row.date)}</p>
          <p className="text-xs text-slate-400">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'itemId',
      label: 'Item',
      render: (row) => {
        const item = itemMap[row.itemId]
        return item ? (
          <div>
            <p className="font-medium text-slate-900">{item.name}</p>
            {item.category && <p className="text-xs text-slate-400">{item.category}</p>}
          </div>
        ) : (
          <span className="text-slate-400 italic">Deleted item</span>
        )
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) =>
        row.type === 'in'
          ? <Badge variant="green" className="text-xs"><ArrowDown size={11} className="inline mr-1" />Stock In</Badge>
          : <Badge variant="red" className="text-xs"><ArrowUp size={11} className="inline mr-1" />Stock Out</Badge>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => {
        const item = itemMap[row.itemId]
        return (
          <span className={`font-medium ${row.type === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
            {row.type === 'in' ? '+' : '-'}{formatNumber(row.quantity, 2)} {item?.unit || ''}
          </span>
        )
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => row.reason || <span className="text-slate-400">—</span>,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Date filter */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">Filter:</span>
        <div className="flex gap-2">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                dateFilter === f.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <Card padding={false} className="overflow-hidden rounded-2xl">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No stock logs found"
            description={
              dateFilter !== 'all'
                ? 'No stock changes recorded in this date range.'
                : 'Stock changes will appear here after you log them.'
            }
          />
        ) : (
          <Table columns={columns} data={filtered} emptyText="No logs found." />
        )}
      </Card>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Inventory() {
  const {
    inventoryItems,
    stockLogs,
    farmProfile,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem,
    addStockLog,
  } = useFarmStore()

  const [activeTab, setActiveTab] = useState('stock')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)

  const tabs = [
    { id: 'stock', label: 'Stock' },
    { id: 'log', label: 'Stock Log' },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, log changes, and manage your farm supplies."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLogModal(true)}>
              <Package size={16} />
              Log Stock Change
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Item
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-5" />

      {activeTab === 'stock' ? (
        <StockTab
          inventoryItems={inventoryItems}
          stockLogs={stockLogs}
          farmProfile={farmProfile}
          addInventoryItem={addInventoryItem}
          updateInventoryItem={updateInventoryItem}
          removeInventoryItem={removeInventoryItem}
          addStockLog={addStockLog}
          externalAddOpen={showAddModal}
          onExternalAddClose={() => setShowAddModal(false)}
          externalLogOpen={showLogModal}
          onExternalLogClose={() => setShowLogModal(false)}
        />
      ) : (
        <>
          <StockLogTab inventoryItems={inventoryItems} stockLogs={stockLogs} />
          {/* Modals triggered from header buttons while on log tab */}
          <ItemModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            initial={null}
            onSave={(data) => { addInventoryItem(data); setShowAddModal(false) }}
            farmProfile={farmProfile}
          />
          <StockLogModal
            open={showLogModal}
            onClose={() => setShowLogModal(false)}
            onSave={(data) => { addStockLog(data); setShowLogModal(false) }}
            inventoryItems={inventoryItems}
            preselectedItemId=""
          />
        </>
      )}
    </div>
  )
}
