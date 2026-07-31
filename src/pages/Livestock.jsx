import { useState, useMemo } from 'react'
import { Heart, Plus, Edit2, Trash2, Syringe, Activity } from 'lucide-react'
import useFarmStore from '../store'
import {
  Button, Card, CardHeader, Input, Textarea, Select, Badge, Modal,
  Table, StatCard, EmptyState, SearchBar, PageHeader, Tabs, ConfirmDialog,
} from '../components/ui'
import {
  formatDate, formatCurrency, formatNumber, isUpcoming, classNames, groupBy, sumBy, searchFilter,
} from '../utils/helpers'
import { ANIMAL_SPECIES } from '../data/farmTypes'

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_SPECIES = Object.values(ANIMAL_SPECIES).flat()

const HEALTH_TYPES = ['Vaccination', 'Treatment', 'Checkup', 'Deworming', 'Other']
const PRODUCTION_TYPES = ['Milk', 'Eggs', 'Wool', 'Other']
const ANIMAL_STATUSES = ['Active', 'Sold', 'Deceased', 'Quarantine']
const SEX_OPTIONS = ['Male', 'Female', 'Unknown']
const WEIGHT_UNITS = ['kg', 'lbs']

const TABS = [
  { id: 'animals', label: 'Animals' },
  { id: 'health', label: 'Health Records' },
  { id: 'production', label: 'Production' },
]

// ─── Blank form states ────────────────────────────────────────────────────────
const blankAnimal = {
  species: '', breed: '', tag: '', name: '', sex: 'Unknown',
  birthDate: '', weight: '', weightUnit: 'kg', status: 'Active', notes: '',
}

const blankHealth = {
  animalId: '', type: 'Checkup', date: '', description: '',
  vetName: '', cost: '', nextDue: '', notes: '',
}

const blankProduction = {
  animalId: '', date: '', type: 'Milk', quantity: '', unit: '', notes: '',
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function AnimalStatusBadge({ status }) {
  const map = { Active: 'green', Sold: 'default', Deceased: 'red', Quarantine: 'yellow' }
  return <Badge variant={map[status] || 'default'}>{status}</Badge>
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Livestock() {
  const animals = useFarmStore((s) => s.animals)
  const healthRecords = useFarmStore((s) => s.healthRecords)
  const productionLogs = useFarmStore((s) => s.productionLogs)
  const addAnimal = useFarmStore((s) => s.addAnimal)
  const updateAnimal = useFarmStore((s) => s.updateAnimal)
  const removeAnimal = useFarmStore((s) => s.removeAnimal)
  const addHealthRecord = useFarmStore((s) => s.addHealthRecord)
  const addProductionLog = useFarmStore((s) => s.addProductionLog)

  const [activeTab, setActiveTab] = useState('animals')

  // ── Animals tab state ──
  const [animalSearch, setAnimalSearch] = useState('')
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [animalForm, setAnimalForm] = useState(blankAnimal)
  const [editingAnimalId, setEditingAnimalId] = useState(null)
  const [animalErrors, setAnimalErrors] = useState({})
  const [deleteAnimal, setDeleteAnimal] = useState(null)

  // ── Health tab state ──
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthForm, setHealthForm] = useState(blankHealth)
  const [healthErrors, setHealthErrors] = useState({})

  // ── Production tab state ──
  const [showProdModal, setShowProdModal] = useState(false)
  const [prodForm, setProdForm] = useState(blankProduction)
  const [prodErrors, setProdErrors] = useState({})

  // ─── Derived data ──────────────────────────────────────────────────────────
  const filteredAnimals = useMemo(() =>
    searchFilter(animals, animalSearch, ['name', 'tag', 'species', 'breed']),
    [animals, animalSearch]
  )

  const speciesCounts = useMemo(() => {
    const groups = groupBy(animals, 'species')
    return Object.entries(groups)
      .map(([species, list]) => ({ species, count: list.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [animals])

  const animalMap = useMemo(() =>
    animals.reduce((acc, a) => { acc[a.id] = a; return acc }, {}),
    [animals]
  )

  // Monthly production totals grouped by type
  const monthlyProductionTotals = useMemo(() => {
    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7) // 'YYYY-MM'
    const thisMonthLogs = productionLogs.filter((l) => l.date && l.date.startsWith(thisMonth))
    const byType = groupBy(thisMonthLogs, 'type')
    return Object.entries(byType).map(([type, logs]) => ({
      type,
      total: sumBy(logs, 'quantity'),
      unit: logs[0]?.unit || '',
    }))
  }, [productionLogs])

  // ─── Animal form handlers ──────────────────────────────────────────────────
  const openAddAnimal = () => {
    setAnimalForm(blankAnimal)
    setEditingAnimalId(null)
    setAnimalErrors({})
    setShowAnimalModal(true)
  }

  const openEditAnimal = (animal) => {
    setAnimalForm({
      species: animal.species || '',
      breed: animal.breed || '',
      tag: animal.tag || '',
      name: animal.name || '',
      sex: animal.sex || 'Unknown',
      birthDate: animal.birthDate || '',
      weight: animal.weight || '',
      weightUnit: animal.weightUnit || 'kg',
      status: animal.status || 'Active',
      notes: animal.notes || '',
    })
    setEditingAnimalId(animal.id)
    setAnimalErrors({})
    setShowAnimalModal(true)
  }

  const validateAnimal = (form) => {
    const errs = {}
    if (!form.tag.trim()) errs.tag = 'Tag / ID is required'
    if (!form.species) errs.species = 'Species is required'
    return errs
  }

  const handleSaveAnimal = () => {
    const errs = validateAnimal(animalForm)
    if (Object.keys(errs).length) { setAnimalErrors(errs); return }
    if (editingAnimalId) {
      updateAnimal(editingAnimalId, animalForm)
    } else {
      addAnimal(animalForm)
    }
    setShowAnimalModal(false)
  }

  // ─── Health record handlers ────────────────────────────────────────────────
  const openHealthModal = (animalId = '') => {
    setHealthForm({ ...blankHealth, animalId })
    setHealthErrors({})
    setShowHealthModal(true)
  }

  const validateHealth = (form) => {
    const errs = {}
    if (!form.animalId) errs.animalId = 'Select an animal'
    if (!form.date) errs.date = 'Date is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    return errs
  }

  const handleSaveHealth = () => {
    const errs = validateHealth(healthForm)
    if (Object.keys(errs).length) { setHealthErrors(errs); return }
    addHealthRecord({
      ...healthForm,
      cost: healthForm.cost ? Number(healthForm.cost) : null,
    })
    setShowHealthModal(false)
  }

  // ─── Production log handlers ───────────────────────────────────────────────
  const validateProd = (form) => {
    const errs = {}
    if (!form.animalId) errs.animalId = 'Select an animal'
    if (!form.date) errs.date = 'Date is required'
    if (!form.quantity || isNaN(Number(form.quantity))) errs.quantity = 'Enter a valid quantity'
    return errs
  }

  const handleSaveProd = () => {
    const errs = validateProd(prodForm)
    if (Object.keys(errs).length) { setProdErrors(errs); return }
    addProductionLog({
      ...prodForm,
      quantity: Number(prodForm.quantity),
    })
    setShowProdModal(false)
  }

  // ─── Table column definitions ──────────────────────────────────────────────
  const animalColumns = [
    {
      key: 'tag',
      label: 'Tag / ID',
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
          {row.tag || '—'}
        </span>
      ),
    },
    { key: 'name', label: 'Name', render: (row) => row.name || <span className="text-slate-400">—</span> },
    { key: 'species', label: 'Species' },
    { key: 'breed', label: 'Breed', render: (row) => row.breed || <span className="text-slate-400">—</span> },
    { key: 'sex', label: 'Sex', render: (row) => row.sex || '—' },
    { key: 'birthDate', label: 'Birth Date', render: (row) => formatDate(row.birthDate) },
    {
      key: 'weight',
      label: 'Weight',
      render: (row) =>
        row.weight ? `${formatNumber(row.weight, 1)} ${row.weightUnit || 'kg'}` : <span className="text-slate-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <AnimalStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Add Health Record"
            onClick={(e) => { e.stopPropagation(); openHealthModal(row.id) }}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <Syringe size={15} />
          </button>
          <button
            title="Edit"
            onClick={(e) => { e.stopPropagation(); openEditAnimal(row) }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            title="Delete"
            onClick={(e) => { e.stopPropagation(); setDeleteAnimal(row) }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  const healthColumns = [
    {
      key: 'animalId',
      label: 'Animal',
      render: (row) => {
        const a = animalMap[row.animalId]
        if (!a) return <span className="text-slate-400">Unknown</span>
        return (
          <div>
            <p className="font-medium text-slate-800">{a.name || a.tag}</p>
            {a.name && <p className="text-xs text-slate-400 font-mono">{a.tag}</p>}
          </div>
        )
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const typeColors = {
          Vaccination: 'blue', Treatment: 'orange', Checkup: 'green',
          Deworming: 'purple', Other: 'default',
        }
        return <Badge variant={typeColors[row.type] || 'default'}>{row.type}</Badge>
      },
    },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs">{row.description || '—'}</span>
      ),
    },
    { key: 'vetName', label: 'Vet', render: (row) => row.vetName || <span className="text-slate-400">—</span> },
    {
      key: 'cost',
      label: 'Cost',
      render: (row) => row.cost != null
        ? <span className="text-red-500">{formatCurrency(row.cost)}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'nextDue',
      label: 'Next Due',
      render: (row) => {
        if (!row.nextDue) return <span className="text-slate-400">—</span>
        const upcoming = isUpcoming(row.nextDue, 7)
        return (
          <span className={classNames('font-medium', upcoming ? 'text-amber-700' : 'text-slate-700')}>
            {formatDate(row.nextDue)}
            {upcoming && <span className="ml-1 text-xs">(soon)</span>}
          </span>
        )
      },
    },
  ]

  const productionColumns = [
    {
      key: 'animalId',
      label: 'Animal',
      render: (row) => {
        const a = animalMap[row.animalId]
        if (!a) return <span className="text-slate-400">Unknown</span>
        return (
          <div>
            <p className="font-medium text-slate-800">{a.name || a.tag}</p>
            {a.name && <p className="text-xs text-slate-400 font-mono">{a.tag}</p>}
          </div>
        )
      },
    },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const typeColors = { Milk: 'blue', Eggs: 'yellow', Wool: 'purple', Other: 'default' }
        return <Badge variant={typeColors[row.type] || 'default'}>{row.type}</Badge>
      },
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => `${formatNumber(row.quantity, 2)} ${row.unit || ''}`.trim(),
    },
    { key: 'notes', label: 'Notes', render: (row) => row.notes || <span className="text-slate-400">—</span> },
  ]

  // ─── Custom health row renderer (amber highlight for upcoming nextDue) ──────
  const healthTableData = useMemo(() =>
    healthRecords.map((r) => ({
      ...r,
      _upcoming: isUpcoming(r.nextDue, 7),
    })),
    [healthRecords]
  )

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      {/* Page Header */}
      <PageHeader
        title="Livestock Management"
        subtitle="Track your animals, health records, and production"
        action={
          activeTab === 'animals' ? (
            <Button onClick={openAddAnimal}>
              <Plus size={16} /> Add Animal
            </Button>
          ) : activeTab === 'health' ? (
            <Button onClick={() => openHealthModal()}>
              <Plus size={16} /> Add Health Record
            </Button>
          ) : (
            <Button onClick={() => { setProdForm(blankProduction); setProdErrors({}); setShowProdModal(true) }}>
              <Plus size={16} /> Log Production
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="mb-5">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── ANIMALS TAB ── */}
      {activeTab === 'animals' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Animals"
              value={animals.length}
              icon={Heart}
              color="emerald"
              subtext={`${animals.filter((a) => a.status === 'Active').length} active`}
            />
            {speciesCounts.map(({ species, count }) => (
              <StatCard
                key={species}
                label={species}
                value={count}
                icon={Activity}
                color="blue"
                subtext={`${Math.round((count / animals.length) * 100)}% of herd`}
              />
            ))}
          </div>

          {/* Search + Table */}
          <Card padding={false} className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center px-5 py-4 border-b border-slate-100">
              <SearchBar
                value={animalSearch}
                onChange={setAnimalSearch}
                placeholder="Search by name, tag or species..."
                className="max-w-sm"
              />
            </div>
            {filteredAnimals.length === 0 && animals.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No animals yet"
                description="Add your first animal to start tracking your herd."
                action={
                  <Button onClick={openAddAnimal}>
                    <Plus size={16} /> Add Animal
                  </Button>
                }
              />
            ) : (
              <Table
                columns={animalColumns}
                data={filteredAnimals}
                emptyText="No animals match your search."
              />
            )}
          </Card>
        </div>
      )}

      {/* ── HEALTH RECORDS TAB ── */}
      {activeTab === 'health' && (
        <Card padding={false} className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
          {healthRecords.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="No health records"
              description="Log vaccinations, treatments, and checkups for your animals."
              action={
                <Button onClick={() => openHealthModal()}>
                  <Plus size={16} /> Add Health Record
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    {healthColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {healthTableData.map((row, i) => (
                    <tr
                      key={row.id || i}
                      className={classNames(
                        'border-b border-slate-100 transition-colors',
                        row._upcoming ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'
                      )}
                    >
                      {healthColumns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-slate-700">
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── PRODUCTION TAB ── */}
      {activeTab === 'production' && (
        <div className="space-y-5">
          {/* Monthly totals */}
          {monthlyProductionTotals.length > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {monthlyProductionTotals.map(({ type, total, unit }) => (
                <StatCard
                  key={type}
                  label={`Total ${type} this month`}
                  value={`${formatNumber(total, 1)} ${unit}`}
                  icon={Activity}
                  color={type === 'Milk' ? 'blue' : type === 'Eggs' ? 'amber' : type === 'Wool' ? 'purple' : 'emerald'}
                />
              ))}
            </div>
          )}

          <Card padding={false} className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
            {productionLogs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No production logs"
                description="Start logging milk, eggs, wool, and other animal production."
                action={
                  <Button onClick={() => { setProdForm(blankProduction); setProdErrors({}); setShowProdModal(true) }}>
                    <Plus size={16} /> Log Production
                  </Button>
                }
              />
            ) : (
              <Table
                columns={productionColumns}
                data={productionLogs}
                emptyText="No production records found."
              />
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ANIMAL MODAL
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showAnimalModal}
        onClose={() => setShowAnimalModal(false)}
        title={editingAnimalId ? 'Edit Animal' : 'Add Animal'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAnimalModal(false)}>Cancel</Button>
            <Button onClick={handleSaveAnimal}>
              {editingAnimalId ? 'Save Changes' : 'Add Animal'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Species"
            value={animalForm.species}
            onChange={(e) => setAnimalForm((f) => ({ ...f, species: e.target.value }))}
            error={animalErrors.species}
          >
            <option value="">Select species…</option>
            {Object.entries(ANIMAL_SPECIES).map(([group, list]) => (
              <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
                {list.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}
          </Select>

          <Input
            label="Breed"
            placeholder="e.g. Angus, Merino"
            value={animalForm.breed}
            onChange={(e) => setAnimalForm((f) => ({ ...f, breed: e.target.value }))}
          />

          <Input
            label="Tag / ID"
            placeholder="e.g. A-001"
            value={animalForm.tag}
            onChange={(e) => setAnimalForm((f) => ({ ...f, tag: e.target.value }))}
            error={animalErrors.tag}
          />

          <Input
            label="Name (optional)"
            placeholder="e.g. Bessie"
            value={animalForm.name}
            onChange={(e) => setAnimalForm((f) => ({ ...f, name: e.target.value }))}
          />

          <Select
            label="Sex"
            value={animalForm.sex}
            onChange={(e) => setAnimalForm((f) => ({ ...f, sex: e.target.value }))}
          >
            {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>

          <Input
            label="Birth Date"
            type="date"
            value={animalForm.birthDate}
            onChange={(e) => setAnimalForm((f) => ({ ...f, birthDate: e.target.value }))}
          />

          <div className="flex gap-2">
            <Input
              label="Weight"
              type="number"
              placeholder="0"
              value={animalForm.weight}
              onChange={(e) => setAnimalForm((f) => ({ ...f, weight: e.target.value }))}
              className="flex-1"
            />
            <Select
              label="Unit"
              value={animalForm.weightUnit}
              onChange={(e) => setAnimalForm((f) => ({ ...f, weightUnit: e.target.value }))}
              className="w-24"
            >
              {WEIGHT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>

          <Select
            label="Status"
            value={animalForm.status}
            onChange={(e) => setAnimalForm((f) => ({ ...f, status: e.target.value }))}
          >
            {ANIMAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>

          <Textarea
            label="Notes"
            placeholder="Any additional notes…"
            value={animalForm.notes}
            onChange={(e) => setAnimalForm((f) => ({ ...f, notes: e.target.value }))}
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          HEALTH RECORD MODAL
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        title="Add Health Record"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowHealthModal(false)}>Cancel</Button>
            <Button onClick={handleSaveHealth}>Save Record</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Animal"
            value={healthForm.animalId}
            onChange={(e) => setHealthForm((f) => ({ ...f, animalId: e.target.value }))}
            error={healthErrors.animalId}
            className="sm:col-span-2"
          >
            <option value="">Select animal…</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ? `${a.name} (${a.tag})` : a.tag} — {a.species}
              </option>
            ))}
          </Select>

          <Select
            label="Type"
            value={healthForm.type}
            onChange={(e) => setHealthForm((f) => ({ ...f, type: e.target.value }))}
          >
            {HEALTH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>

          <Input
            label="Date"
            type="date"
            value={healthForm.date}
            onChange={(e) => setHealthForm((f) => ({ ...f, date: e.target.value }))}
            error={healthErrors.date}
          />

          <Textarea
            label="Description"
            placeholder="Describe the treatment or finding…"
            value={healthForm.description}
            onChange={(e) => setHealthForm((f) => ({ ...f, description: e.target.value }))}
            error={healthErrors.description}
            className="sm:col-span-2"
          />

          <Input
            label="Vet Name"
            placeholder="Dr. Smith"
            value={healthForm.vetName}
            onChange={(e) => setHealthForm((f) => ({ ...f, vetName: e.target.value }))}
          />

          <Input
            label="Cost"
            type="number"
            placeholder="0.00"
            value={healthForm.cost}
            onChange={(e) => setHealthForm((f) => ({ ...f, cost: e.target.value }))}
          />

          <Input
            label="Next Due Date"
            type="date"
            value={healthForm.nextDue}
            onChange={(e) => setHealthForm((f) => ({ ...f, nextDue: e.target.value }))}
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes…"
            value={healthForm.notes}
            onChange={(e) => setHealthForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          PRODUCTION LOG MODAL
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        open={showProdModal}
        onClose={() => setShowProdModal(false)}
        title="Log Production"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowProdModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProd}>Save Log</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Animal"
            value={prodForm.animalId}
            onChange={(e) => setProdForm((f) => ({ ...f, animalId: e.target.value }))}
            error={prodErrors.animalId}
            className="sm:col-span-2"
          >
            <option value="">Select animal…</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ? `${a.name} (${a.tag})` : a.tag} — {a.species}
              </option>
            ))}
          </Select>

          <Input
            label="Date"
            type="date"
            value={prodForm.date}
            onChange={(e) => setProdForm((f) => ({ ...f, date: e.target.value }))}
            error={prodErrors.date}
          />

          <Select
            label="Production Type"
            value={prodForm.type}
            onChange={(e) => setProdForm((f) => ({ ...f, type: e.target.value }))}
          >
            {PRODUCTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>

          <Input
            label="Quantity"
            type="number"
            placeholder="0"
            value={prodForm.quantity}
            onChange={(e) => setProdForm((f) => ({ ...f, quantity: e.target.value }))}
            error={prodErrors.quantity}
          />

          <Input
            label="Unit"
            placeholder="e.g. L, kg, dozen"
            value={prodForm.unit}
            onChange={(e) => setProdForm((f) => ({ ...f, unit: e.target.value }))}
          />

          <Textarea
            label="Notes"
            placeholder="Any notes about this production log…"
            value={prodForm.notes}
            onChange={(e) => setProdForm((f) => ({ ...f, notes: e.target.value }))}
            className="sm:col-span-2"
          />
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ════════════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        open={!!deleteAnimal}
        onClose={() => setDeleteAnimal(null)}
        onConfirm={() => { removeAnimal(deleteAnimal.id); setDeleteAnimal(null) }}
        title="Delete Animal"
        message={`Are you sure you want to delete "${deleteAnimal?.name || deleteAnimal?.tag}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
