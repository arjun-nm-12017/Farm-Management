import { useState } from 'react'
import { Wheat, Plus, Edit2, Trash2, Activity } from 'lucide-react'
import useFarmStore from '../store'
import {
  Button, Card, Input, Textarea, Select, Badge, Modal,
  Table, EmptyState, SearchBar, PageHeader, Tabs, ConfirmDialog,
} from '../components/ui'
import { formatDate, searchFilter } from '../utils/helpers'
import { GROWTH_STAGES } from '../data/farmTypes'

// ─── Constants ───────────────────────────────────────────────────────────────

const AREA_UNITS = ['Acres', 'Hectares', 'm²']
const SOIL_TYPES = ['Clay', 'Sandy', 'Loam', 'Silt', 'Peaty', 'Chalky']
const ACTIVITY_TYPES = ['Irrigation', 'Fertilizing', 'Spraying', 'Weeding', 'Pruning', 'Other']

const STAGE_BADGE_VARIANT = {
  Seedling: 'blue',
  Vegetative: 'green',
  Flowering: 'yellow',
  Fruiting: 'orange',
  'Harvest Ready': 'red',
  Harvested: 'default',
}

const BLANK_FIELD = { name: '', area: '', areaUnit: 'Acres', soilType: '', location: '', notes: '' }
const BLANK_CROP = { name: '', variety: '', fieldId: '', plantingDate: '', expectedHarvestDate: '', stage: '', notes: '' }
const BLANK_ACTIVITY = { type: 'Irrigation', date: '', amount: '', unit: '', notes: '' }

// ─── Field Modal ─────────────────────────────────────────────────────────────

function FieldModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || BLANK_FIELD)
  const [errors, setErrors] = useState({})

  // Reset form when modal opens with new initial value
  const handleOpen = () => {
    setForm(initial || BLANK_FIELD)
    setErrors({})
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Field name is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit Field' : 'Add Field'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="button">
            {initial?.id ? 'Save Changes' : 'Add Field'}
          </Button>
        </div>
      }
    >
      {/* Re-initialise form whenever modal visibility changes */}
      {open && (() => { /* side-effect trick — we use useEffect-less pattern via key */ })()}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Field Name"
          placeholder="e.g. North Paddock"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Area"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={form.area}
            onChange={(e) => set('area', e.target.value)}
          />
          <Select
            label="Unit"
            value={form.areaUnit}
            onChange={(e) => set('areaUnit', e.target.value)}
          >
            {AREA_UNITS.map((u) => <option key={u}>{u}</option>)}
          </Select>
        </div>
        <Select
          label="Soil Type"
          value={form.soilType}
          onChange={(e) => set('soilType', e.target.value)}
        >
          <option value="">Select soil type…</option>
          {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Input
          label="Location / GPS Reference"
          placeholder="e.g. Section A, near river"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
        />
        <Textarea
          label="Notes"
          placeholder="Additional information…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </form>
    </Modal>
  )
}

// ─── Crop Modal ───────────────────────────────────────────────────────────────

function CropModal({ open, onClose, onSave, initial, fields }) {
  const [form, setForm] = useState(initial || BLANK_CROP)
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Crop name is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit Crop' : 'Add Crop'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="button">
            {initial?.id ? 'Save Changes' : 'Add Crop'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Crop Name"
          placeholder="e.g. Wheat, Maize, Tomato"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Variety"
          placeholder="e.g. Cherry, Roma, Heirloom"
          value={form.variety}
          onChange={(e) => set('variety', e.target.value)}
        />
        <Select
          label="Field"
          value={form.fieldId}
          onChange={(e) => set('fieldId', e.target.value)}
        >
          <option value="">Select field…</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Planting Date"
            type="date"
            value={form.plantingDate}
            onChange={(e) => set('plantingDate', e.target.value)}
          />
          <Input
            label="Expected Harvest"
            type="date"
            value={form.expectedHarvestDate}
            onChange={(e) => set('expectedHarvestDate', e.target.value)}
          />
        </div>
        <Select
          label="Growth Stage"
          value={form.stage}
          onChange={(e) => set('stage', e.target.value)}
        >
          <option value="">Select stage…</option>
          {GROWTH_STAGES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Textarea
          label="Notes"
          placeholder="Additional information…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </form>
    </Modal>
  )
}

// ─── Activity Modal ───────────────────────────────────────────────────────────

function ActivityModal({ open, onClose, onSave, crop }) {
  const [form, setForm] = useState(BLANK_ACTIVITY)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleClose = () => {
    setForm(BLANK_ACTIVITY)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, cropId: crop?.id, fieldId: crop?.fieldId })
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Log Activity${crop ? ` — ${crop.name}` : ''}`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="button">Log Activity</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Activity Type"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
        >
          {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
          <Input
            label="Unit"
            placeholder="e.g. Liters, kg"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
          />
        </div>
        <Textarea
          label="Notes"
          placeholder="Additional details…"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </form>
    </Modal>
  )
}

// ─── Fields Tab ───────────────────────────────────────────────────────────────

function FieldsTab({ fields, crops, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('')

  const filtered = searchFilter(fields, search, ['name', 'location', 'soilType'])

  const cropCountForField = (fieldId) => crops.filter((c) => c.fieldId === fieldId).length

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'area',
      label: 'Area',
      render: (row) =>
        row.area ? (
          <span className="text-slate-600">{row.area} {row.areaUnit || 'Acres'}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'soilType',
      label: 'Soil Type',
      render: (row) => row.soilType || <span className="text-slate-400">—</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) =>
        row.location ? (
          <span className="text-slate-600 max-w-[160px] truncate block">{row.location}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'crops',
      label: 'Crops',
      render: (row) => {
        const count = cropCountForField(row.id)
        return (
          <span className={count > 0 ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
            {count > 0 ? count : '—'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Edit field"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete field"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search fields by name, location, or soil type…"
        className="max-w-sm"
      />
      {filtered.length === 0 && fields.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="No fields added yet"
          description="Add your first field to start tracking crops and farm activities."
          action={
            <Button variant="primary" onClick={onAdd}>
              <Plus size={16} /> Add Field
            </Button>
          }
        />
      ) : (
        <Card padding={false}>
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-400 text-sm">
              No fields match your search.
            </div>
          ) : (
            <Table columns={columns} data={filtered} />
          )}
        </Card>
      )}
    </div>
  )
}

// ─── Crops Tab ────────────────────────────────────────────────────────────────

function CropsTab({ crops, fields, onAdd, onEdit, onDelete, onLogActivity }) {
  const fieldMap = Object.fromEntries(fields.map((f) => [f.id, f]))

  const columns = [
    {
      key: 'name',
      label: 'Crop Name',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'field',
      label: 'Field',
      render: (row) =>
        row.fieldId && fieldMap[row.fieldId] ? (
          <span className="text-slate-600">{fieldMap[row.fieldId].name}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'variety',
      label: 'Variety',
      render: (row) => row.variety || <span className="text-slate-400">—</span>,
    },
    {
      key: 'plantingDate',
      label: 'Planting Date',
      render: (row) => <span className="text-slate-600">{formatDate(row.plantingDate)}</span>,
    },
    {
      key: 'expectedHarvestDate',
      label: 'Expected Harvest',
      render: (row) => <span className="text-slate-600">{formatDate(row.expectedHarvestDate)}</span>,
    },
    {
      key: 'stage',
      label: 'Growth Stage',
      render: (row) =>
        row.stage ? (
          <Badge variant={STAGE_BADGE_VARIANT[row.stage] || 'default'}>{row.stage}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        if (!row.stage) return <span className="text-slate-400">—</span>
        if (row.stage === 'Harvested') return <Badge variant="default">Completed</Badge>
        if (row.stage === 'Harvest Ready') return <Badge variant="red">Ready</Badge>
        return <Badge variant="green">Active</Badge>
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onLogActivity(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Log activity"
          >
            <Activity size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit crop"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete crop"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  if (crops.length === 0) {
    return (
      <EmptyState
        icon={Wheat}
        title="No crops added yet"
        description="Add a crop and assign it to a field to start tracking its growth cycle."
        action={
          <Button variant="primary" onClick={onAdd}>
            <Plus size={16} /> Add Crop
          </Button>
        }
      />
    )
  }

  return (
    <Card padding={false}>
      <Table columns={columns} data={crops} />
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Fields() {
  const { fields, crops, addField, updateField, removeField, addCrop, updateCrop, removeCrop, addFieldActivity } =
    useFarmStore()

  // Tab
  const [activeTab, setActiveTab] = useState('fields')

  // Field modal state
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [deletingField, setDeletingField] = useState(null)

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [deletingCrop, setDeletingCrop] = useState(null)

  // Activity modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [activityCrop, setActivityCrop] = useState(null)

  // ── Field handlers ──

  const handleAddField = () => {
    setEditingField(null)
    setFieldModalOpen(true)
  }

  const handleEditField = (field) => {
    setEditingField(field)
    setFieldModalOpen(true)
  }

  const handleSaveField = (form) => {
    if (editingField?.id) {
      updateField(editingField.id, form)
    } else {
      addField(form)
    }
    setEditingField(null)
  }

  const handleDeleteField = (field) => {
    setDeletingField(field)
  }

  const confirmDeleteField = () => {
    if (deletingField) {
      removeField(deletingField.id)
      setDeletingField(null)
    }
  }

  // ── Crop handlers ──

  const handleAddCrop = () => {
    setEditingCrop(null)
    setCropModalOpen(true)
  }

  const handleEditCrop = (crop) => {
    setEditingCrop(crop)
    setCropModalOpen(true)
  }

  const handleSaveCrop = (form) => {
    if (editingCrop?.id) {
      updateCrop(editingCrop.id, form)
    } else {
      addCrop(form)
    }
    setEditingCrop(null)
  }

  const handleDeleteCrop = (crop) => {
    setDeletingCrop(crop)
  }

  const confirmDeleteCrop = () => {
    if (deletingCrop) {
      removeCrop(deletingCrop.id)
      setDeletingCrop(null)
    }
  }

  // ── Activity handlers ──

  const handleLogActivity = (crop) => {
    setActivityCrop(crop)
    setActivityModalOpen(true)
  }

  const handleSaveActivity = (form) => {
    addFieldActivity(form)
  }

  // ── Tab action button ──

  const tabAction =
    activeTab === 'fields' ? (
      <Button variant="primary" onClick={handleAddField}>
        <Plus size={16} /> Add Field
      </Button>
    ) : (
      <Button variant="primary" onClick={handleAddCrop}>
        <Plus size={16} /> Add Crop
      </Button>
    )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Fields & Crops"
        subtitle={`${fields.length} field${fields.length !== 1 ? 's' : ''} · ${crops.length} crop${crops.length !== 1 ? 's' : ''}`}
        action={tabAction}
      />

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'fields', label: `Fields (${fields.length})` },
            { id: 'crops', label: `Crops (${crops.length})` },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'fields' ? (
        <FieldsTab
          fields={fields}
          crops={crops}
          onAdd={handleAddField}
          onEdit={handleEditField}
          onDelete={handleDeleteField}
        />
      ) : (
        <CropsTab
          crops={crops}
          fields={fields}
          onAdd={handleAddCrop}
          onEdit={handleEditCrop}
          onDelete={handleDeleteCrop}
          onLogActivity={handleLogActivity}
        />
      )}

      {/* Field Modal — key forces re-mount and fresh form state on each open */}
      <FieldModal
        key={fieldModalOpen ? (editingField?.id || 'new-field') : 'closed-field'}
        open={fieldModalOpen}
        onClose={() => { setFieldModalOpen(false); setEditingField(null) }}
        onSave={handleSaveField}
        initial={editingField}
      />

      {/* Crop Modal */}
      <CropModal
        key={cropModalOpen ? (editingCrop?.id || 'new-crop') : 'closed-crop'}
        open={cropModalOpen}
        onClose={() => { setCropModalOpen(false); setEditingCrop(null) }}
        onSave={handleSaveCrop}
        initial={editingCrop}
        fields={fields}
      />

      {/* Activity Modal */}
      <ActivityModal
        key={activityModalOpen ? (activityCrop?.id || 'activity') : 'closed-activity'}
        open={activityModalOpen}
        onClose={() => { setActivityModalOpen(false); setActivityCrop(null) }}
        onSave={handleSaveActivity}
        crop={activityCrop}
      />

      {/* Delete Field Confirmation */}
      <ConfirmDialog
        open={!!deletingField}
        onClose={() => setDeletingField(null)}
        onConfirm={confirmDeleteField}
        title="Delete Field"
        message={`Are you sure you want to delete "${deletingField?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Delete Crop Confirmation */}
      <ConfirmDialog
        open={!!deletingCrop}
        onClose={() => setDeletingCrop(null)}
        onConfirm={confirmDeleteCrop}
        title="Delete Crop"
        message={`Are you sure you want to delete the crop "${deletingCrop?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
