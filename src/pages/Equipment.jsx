import { useState, useMemo } from 'react'
import { Wrench, Plus, Edit2, Trash2, AlertTriangle, Calendar, Settings } from 'lucide-react'
import useFarmStore from '../store'
import {
  Button, Card, CardHeader, Input, Textarea, Select, Badge, Alert,
  Modal, Table, StatCard, EmptyState, SearchBar, PageHeader, Tabs,
  ConfirmDialog,
} from '../components/ui'
import {
  formatDate, formatCurrency, isOverdue, isUpcoming, classNames, searchFilter, sortBy, sumBy,
} from '../utils/helpers'

// ─── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_TYPES = ['Tractor', 'Harvester', 'Irrigation', 'Sprayer', 'Truck', 'Generator', 'Hand Tool', 'Other']
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service']
const MAINTENANCE_TYPES = ['Routine Service', 'Repair', 'Inspection', 'Part Replacement', 'Other']
const SERVICE_WINDOW_DAYS = 14

const conditionBadgeVariant = (condition) => {
  switch (condition) {
    case 'Excellent': return 'green'
    case 'Good': return 'blue'
    case 'Fair': return 'yellow'
    case 'Poor': return 'red'
    case 'Out of Service': return 'red'
    default: return 'default'
  }
}

const emptyEquipmentForm = {
  name: '', type: 'Tractor', brand: '', model: '',
  purchaseDate: '', condition: 'Good', notes: '',
}

const emptyMaintenanceForm = {
  equipmentId: '', type: 'Routine Service', date: '', description: '',
  cost: '', technician: '', nextDue: '', notes: '',
}

// ─── Equipment Form Modal ────────────────────────────────────────────────────

function EquipmentModal({ open, onClose, initial, onSave, title }) {
  const [form, setForm] = useState(initial || emptyEquipmentForm)
  const [errors, setErrors] = useState({})

  // Sync form when initial changes (edit mode)
  useMemo(() => {
    if (open) setForm(initial || emptyEquipmentForm)
  }, [open, initial])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Wrench size={15} /> Save Equipment</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Equipment Name *"
          placeholder="e.g. John Deere 5055E"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
            {EQUIPMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select label="Condition" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Brand"
            placeholder="e.g. John Deere"
            value={form.brand}
            onChange={(e) => set('brand', e.target.value)}
          />
          <Input
            label="Model"
            placeholder="e.g. 5055E"
            value={form.model}
            onChange={(e) => set('model', e.target.value)}
          />
        </div>
        <Input
          label="Purchase Date"
          type="date"
          value={form.purchaseDate}
          onChange={(e) => set('purchaseDate', e.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Any additional notes..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  )
}

// ─── Maintenance Log Modal ────────────────────────────────────────────────────

function MaintenanceModal({ open, onClose, onSave, equipment, preselectedEquipmentId }) {
  const [form, setForm] = useState({ ...emptyMaintenanceForm, equipmentId: preselectedEquipmentId || '' })
  const [errors, setErrors] = useState({})

  useMemo(() => {
    if (open) {
      setForm({ ...emptyMaintenanceForm, equipmentId: preselectedEquipmentId || '' })
      setErrors({})
    }
  }, [open, preselectedEquipmentId])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.equipmentId) errs.equipmentId = 'Please select equipment'
    if (!form.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({ ...form, cost: form.cost ? Number(form.cost) : null })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Maintenance"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Settings size={15} /> Save Log</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Equipment *"
          value={form.equipmentId}
          onChange={(e) => set('equipmentId', e.target.value)}
          error={errors.equipmentId}
        >
          <option value="">Select equipment...</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
            {MAINTENANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            error={errors.date}
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Describe the maintenance work done..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cost"
            type="number"
            min="0"
            placeholder="0.00"
            value={form.cost}
            onChange={(e) => set('cost', e.target.value)}
          />
          <Input
            label="Technician"
            placeholder="Technician name"
            value={form.technician}
            onChange={(e) => set('technician', e.target.value)}
          />
        </div>
        <Input
          label="Next Service Due"
          type="date"
          value={form.nextDue}
          onChange={(e) => set('nextDue', e.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Any additional notes..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  )
}

// ─── Equipment Card ───────────────────────────────────────────────────────────

function EquipmentCard({ item, maintenanceLogs, onEdit, onDelete, onLogMaintenance }) {
  // Find the latest maintenance log to determine next service due
  const logs = maintenanceLogs.filter((l) => l.equipmentId === item.id)
  const latestNextDue = logs
    .filter((l) => l.nextDue)
    .sort((a, b) => (a.nextDue > b.nextDue ? -1 : 1))[0]?.nextDue || null

  const overdue = isOverdue(latestNextDue)
  const upcoming = !overdue && isUpcoming(latestNextDue, SERVICE_WINDOW_DAYS)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate text-base">{item.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{item.type}</p>
        </div>
        <Badge variant={conditionBadgeVariant(item.condition)}>{item.condition}</Badge>
      </div>

      {/* Brand / Model */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Settings size={14} className="text-slate-400 shrink-0" />
        <span>
          {item.brand && item.model
            ? `${item.brand} / ${item.model}`
            : item.brand || item.model || <span className="text-slate-400 italic">No brand/model</span>}
        </span>
      </div>

      {/* Purchase date */}
      {item.purchaseDate && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={14} className="shrink-0 text-slate-400" />
          <span>Purchased {formatDate(item.purchaseDate)}</span>
        </div>
      )}

      {/* Next service due */}
      <div className={classNames(
        'flex items-center gap-2 text-sm rounded-lg px-2 py-1.5',
        overdue
          ? 'bg-red-50 text-red-700'
          : upcoming
            ? 'bg-amber-50 text-amber-700'
            : 'bg-slate-50 text-slate-500'
      )}>
        <Wrench size={14} className="shrink-0" />
        {latestNextDue
          ? (
            <span>
              {overdue ? 'Service overdue: ' : 'Next service: '}
              <span className="font-medium">{formatDate(latestNextDue)}</span>
            </span>
          )
          : <span className="italic">No service scheduled</span>
        }
      </div>

      {/* Notes */}
      {item.notes && (
        <p className="text-xs text-slate-500 line-clamp-2">{item.notes}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => onLogMaintenance(item.id)}
        >
          <Wrench size={13} /> Log Maintenance
        </Button>
        <button
          onClick={() => onEdit(item)}
          title="Edit"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(item)}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Equipment() {
  const equipment = useFarmStore((s) => s.equipment)
  const maintenanceLogs = useFarmStore((s) => s.maintenanceLogs)
  const addEquipment = useFarmStore((s) => s.addEquipment)
  const updateEquipment = useFarmStore((s) => s.updateEquipment)
  const removeEquipment = useFarmStore((s) => s.removeEquipment)
  const addMaintenanceLog = useFarmStore((s) => s.addMaintenanceLog)
  const farmProfile = useFarmStore((s) => s.farmProfile)

  const currency = farmProfile?.currency || 'USD'

  // ── Tab state
  const [activeTab, setActiveTab] = useState('equipment')

  // ── Equipment tab state
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // ── Maintenance tab state
  const [showMaintModal, setShowMaintModal] = useState(false)
  const [maintEquipFilter, setMaintEquipFilter] = useState('')
  const [preselectedEquipId, setPreselectedEquipId] = useState('')

  // ── Derived data ────────────────────────────────────────────────────────────

  // For each equipment item, compute nextDue from its latest maintenance log
  const equipmentWithNextDue = useMemo(() => {
    return equipment.map((eq) => {
      const logs = maintenanceLogs.filter((l) => l.equipmentId === eq.id && l.nextDue)
      const latestNextDue = logs.sort((a, b) => (a.nextDue > b.nextDue ? -1 : 1))[0]?.nextDue || null
      return { ...eq, latestNextDue }
    })
  }, [equipment, maintenanceLogs])

  const dueForService = useMemo(() =>
    equipmentWithNextDue.filter(
      (eq) => eq.latestNextDue && (isOverdue(eq.latestNextDue) || isUpcoming(eq.latestNextDue, SERVICE_WINDOW_DAYS))
    ), [equipmentWithNextDue])

  const avgCondition = useMemo(() => {
    if (!equipment.length) return '—'
    const scores = { Excellent: 5, Good: 4, Fair: 3, Poor: 2, 'Out of Service': 1 }
    const total = equipment.reduce((sum, eq) => sum + (scores[eq.condition] || 0), 0)
    const avg = total / equipment.length
    if (avg >= 4.5) return 'Excellent'
    if (avg >= 3.5) return 'Good'
    if (avg >= 2.5) return 'Fair'
    if (avg >= 1.5) return 'Poor'
    return 'Out of Service'
  }, [equipment])

  const filteredEquipment = useMemo(() =>
    searchFilter(equipmentWithNextDue, search, ['name', 'type', 'brand', 'model']),
    [equipmentWithNextDue, search])

  const filteredLogs = useMemo(() => {
    let logs = [...maintenanceLogs].sort((a, b) => (a.date > b.date ? -1 : 1))
    if (maintEquipFilter) logs = logs.filter((l) => l.equipmentId === maintEquipFilter)
    return logs
  }, [maintenanceLogs, maintEquipFilter])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddEquipment = (form) => {
    addEquipment(form)
  }

  const handleEditEquipment = (form) => {
    updateEquipment(editTarget.id, form)
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      removeEquipment(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleLogMaintenance = (equipmentId) => {
    setPreselectedEquipId(equipmentId)
    setShowMaintModal(true)
  }

  const handleAddMaintenanceLog = (form) => {
    addMaintenanceLog(form)
  }

  const getEquipmentName = (id) => equipment.find((e) => e.id === id)?.name || '—'

  // ── Maintenance table columns ──────────────────────────────────────────────

  const maintColumns = [
    {
      key: 'equipmentId',
      label: 'Equipment',
      render: (row) => (
        <span className="font-medium text-slate-800">{getEquipmentName(row.equipmentId)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={
          row.type === 'Routine Service' ? 'green'
            : row.type === 'Repair' ? 'red'
              : row.type === 'Inspection' ? 'blue'
                : row.type === 'Part Replacement' ? 'orange'
                  : 'default'
        }>{row.type}</Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-slate-600 max-w-xs block truncate">{row.description || '—'}</span>
      ),
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (row) => row.cost != null
        ? <span className="text-red-500 font-medium">{formatCurrency(row.cost, currency)}</span>
        : '—',
    },
    {
      key: 'technician',
      label: 'Technician',
      render: (row) => row.technician || '—',
    },
    {
      key: 'nextDue',
      label: 'Next Due',
      render: (row) => {
        if (!row.nextDue) return <span className="text-slate-400">—</span>
        const overdue = isOverdue(row.nextDue)
        const upcoming = !overdue && isUpcoming(row.nextDue, SERVICE_WINDOW_DAYS)
        return (
          <span className={classNames(
            'font-medium',
            overdue ? 'text-red-600' : upcoming ? 'text-amber-600' : 'text-slate-700'
          )}>
            {overdue && <AlertTriangle size={13} className="inline mr-1 mb-0.5" />}
            {formatDate(row.nextDue)}
          </span>
        )
      },
    },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <PageHeader
        title="Equipment & Maintenance"
        subtitle="Track your farm equipment and maintenance schedules"
        className="mb-7"
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Equipment
          </Button>
        }
      />

      {/* Service Due Alert */}
      {!alertDismissed && dueForService.length > 0 && (
        <Alert variant="warning" onClose={() => setAlertDismissed(true)}>
          <span className="font-semibold">
            {dueForService.length} piece{dueForService.length > 1 ? 's' : ''} of equipment
            {dueForService.length > 1 ? ' are' : ' is'} due for service:
          </span>{' '}
          {dueForService.map((eq) => eq.name).join(', ')}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Equipment"
          value={equipment.length}
          icon={Settings}
          color="emerald"
        />
        <StatCard
          label="Due for Service"
          value={dueForService.length}
          icon={AlertTriangle}
          color={dueForService.length > 0 ? 'amber' : 'emerald'}
          subtext={`Within ${SERVICE_WINDOW_DAYS} days or overdue`}
        />
        <StatCard
          label="Average Condition"
          value={avgCondition}
          icon={Wrench}
          color={
            avgCondition === 'Excellent' || avgCondition === 'Good' ? 'emerald'
              : avgCondition === 'Fair' ? 'amber'
                : avgCondition === '—' ? 'slate'
                  : 'red'
          }
        />
        <StatCard
          label="Maintenance Logs"
          value={maintenanceLogs.length}
          icon={Calendar}
          color="blue"
          subtext="Total service records"
        />
      </div>

      {/* Tabs */}
      <div className="mb-5">
        <Tabs
          tabs={[
            { id: 'equipment', label: 'Equipment' },
            { id: 'maintenance', label: 'Maintenance Logs' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ── Equipment Tab ── */}
      {activeTab === 'equipment' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search equipment by name, type, brand..."
              className="flex-1 min-w-[220px]"
            />
          </div>

          {filteredEquipment.length === 0 ? (
            <Card className="rounded-2xl border border-slate-200/80 shadow-sm">
              <EmptyState
                icon={Settings}
                title={search ? 'No equipment found' : 'No equipment yet'}
                description={
                  search
                    ? 'Try a different search term.'
                    : 'Add your first piece of equipment to start tracking maintenance.'
                }
                className="py-16"
                action={
                  !search && (
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus size={15} /> Add Equipment
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEquipment.map((item) => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  maintenanceLogs={maintenanceLogs}
                  onEdit={(eq) => setEditTarget(eq)}
                  onDelete={(eq) => setDeleteTarget(eq)}
                  onLogMaintenance={handleLogMaintenance}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Maintenance Logs Tab ── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-center mb-5">
            <Select
              value={maintEquipFilter}
              onChange={(e) => setMaintEquipFilter(e.target.value)}
              className="w-full sm:w-64"
            >
              <option value="">All Equipment</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </Select>
            <Button onClick={() => { setPreselectedEquipId(''); setShowMaintModal(true) }}>
              <Plus size={15} /> Add Maintenance Log
            </Button>
          </div>

          <Card padding={false} className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
            {filteredLogs.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No maintenance logs yet"
                description="Log your first maintenance activity to keep track of service history."
                className="py-16"
                action={
                  <Button onClick={() => { setPreselectedEquipId(''); setShowMaintModal(true) }}>
                    <Plus size={15} /> Add Maintenance Log
                  </Button>
                }
              />
            ) : (
              <Table
                columns={maintColumns}
                data={filteredLogs}
                emptyText="No maintenance logs found"
              />
            )}
          </Card>
        </div>
      )}

      {/* ── Add Equipment Modal ── */}
      <EquipmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        initial={emptyEquipmentForm}
        onSave={handleAddEquipment}
        title="Add Equipment"
      />

      {/* ── Edit Equipment Modal ── */}
      <EquipmentModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget}
        onSave={handleEditEquipment}
        title="Edit Equipment"
      />

      {/* ── Maintenance Log Modal ── */}
      <MaintenanceModal
        open={showMaintModal}
        onClose={() => setShowMaintModal(false)}
        onSave={handleAddMaintenanceLog}
        equipment={equipment}
        preselectedEquipmentId={preselectedEquipId}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
