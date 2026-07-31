import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Tractor,
  Users,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Edit2,
  Shield,
} from 'lucide-react'
import useFarmStore from '../store'
import {
  Button,
  Card,
  CardHeader,
  Input,
  Select,
  Badge,
  Alert,
  Modal,
  Table,
  PageHeader,
  ConfirmDialog,
} from '../components/ui'
import { FARM_TYPES, ROLES, UNITS } from '../data/farmTypes'
import { classNames } from '../utils/helpers'

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={classNames(
          'w-11 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2',
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        )}
      />
      <div
        className={classNames(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </label>
  )
}

// ─── Section nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'farm',    label: 'Farm Profile',  Icon: Tractor },
  { id: 'modules', label: 'Modules',       Icon: SettingsIcon },
  { id: 'team',    label: 'Team / Users',  Icon: Users },
  { id: 'danger',  label: 'Danger Zone',   Icon: AlertTriangle },
]

// ─── Module config ────────────────────────────────────────────────────────────
const MODULE_LIST = [
  { key: 'fields',    label: 'Fields & Crops',   description: 'Manage fields, crops, and field activities' },
  { key: 'livestock', label: 'Livestock',         description: 'Track animals, health records, and production logs' },
  { key: 'inventory', label: 'Inventory',         description: 'Monitor stock levels and supply chain' },
  { key: 'tasks',     label: 'Tasks',             description: 'Assign and track farm tasks' },
  { key: 'finance',   label: 'Finance',           description: 'Record income, expenses, and generate reports' },
  { key: 'equipment', label: 'Equipment',         description: 'Manage machinery and maintenance logs' },
  { key: 'reports',   label: 'Reports',           description: 'Analytics and summary reports' },
  { key: 'weather',   label: 'Weather',           description: 'Live weather data for your farm location' },
]

// ═══════════════════════════════════════════════════════════════
// SECTION: FARM PROFILE
// ═══════════════════════════════════════════════════════════════
function FarmProfileSection() {
  const farmProfile    = useFarmStore((s) => s.farmProfile)
  const updateFarmProfile = useFarmStore((s) => s.updateFarmProfile)

  const [form, setForm] = useState({
    name:      farmProfile?.name      || '',
    location:  farmProfile?.location  || '',
    latitude:  farmProfile?.latitude  || '',
    longitude: farmProfile?.longitude || '',
    area:      farmProfile?.area      || '',
    areaUnit:  farmProfile?.areaUnit  || 'Acres',
    currency:  farmProfile?.currency  || 'USD',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim()) {
      setError('Farm name is required.')
      return
    }
    setError('')
    updateFarmProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Farm type badges from saved profile
  const farmTypeIds = farmProfile?.farmTypeIds || []
  const farmTypeObjects = farmTypeIds.map((id) => FARM_TYPES.find((t) => t.id === id)).filter(Boolean)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Farm Profile"
          subtitle="Update your farm's basic information"
        />

        {saved && (
          <Alert variant="success" className="mb-4">
            Farm profile saved successfully.
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Farm type read-only */}
        {farmTypeObjects.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Farm Type</p>
            <div className="flex flex-wrap gap-2">
              {farmTypeObjects.map((ft) => (
                <Badge key={ft.id} variant="green">
                  {ft.emoji} {ft.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Farm type is set during onboarding and cannot be changed here.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Farm Name"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Sunrise Valley Farm"
            className="sm:col-span-2"
          />
          <Input
            label="Location / Address"
            value={form.location}
            onChange={set('location')}
            placeholder="e.g. Napa Valley, CA"
            className="sm:col-span-2"
          />
          <Input
            label="Latitude"
            type="number"
            value={form.latitude}
            onChange={set('latitude')}
            placeholder="e.g. 38.2975"
            step="0.0001"
          />
          <Input
            label="Longitude"
            type="number"
            value={form.longitude}
            onChange={set('longitude')}
            placeholder="e.g. -122.2869"
            step="0.0001"
          />
          <Input
            label="Total Area"
            type="number"
            value={form.area}
            onChange={set('area')}
            placeholder="e.g. 120"
            min="0"
          />
          <Select label="Area Unit" value={form.areaUnit} onChange={set('areaUnit')}>
            {UNITS.area.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
          <Select label="Currency" value={form.currency} onChange={set('currency')}>
            {UNITS.currency.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave}>
            <Save size={16} />
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: MODULES
// ═══════════════════════════════════════════════════════════════
function ModulesSection() {
  const enabledModules      = useFarmStore((s) => s.enabledModules)
  const updateEnabledModules = useFarmStore((s) => s.updateEnabledModules)

  const [modules, setModules] = useState({ ...enabledModules })
  const [saved, setSaved]     = useState(false)

  const handleToggle = (key) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    updateEnabledModules(modules)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Feature Modules"
          subtitle="Enable or disable modules based on what your farm needs"
        />

        <Alert variant="warning" className="mb-5">
          Disabling a module hides it from navigation but does not delete your data.
        </Alert>

        {saved && (
          <Alert variant="success" className="mb-4">
            Module settings saved.
          </Alert>
        )}

        <div className="divide-y divide-slate-100">
          {MODULE_LIST.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-4 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
              <ToggleSwitch
                id={`module-${key}`}
                checked={!!modules[key]}
                onChange={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={handleSave}>
            <Save size={16} />
            Save Modules
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: TEAM / USERS
// ═══════════════════════════════════════════════════════════════
const BLANK_USER  = { name: '', email: '', role: 'worker', pin: '' }
const BLANK_EDIT  = { role: 'worker' }

function TeamSection() {
  const users      = useFarmStore((s) => s.users)
  const addUser    = useFarmStore((s) => s.addUser)
  const updateUser = useFarmStore((s) => s.updateUser)
  const removeUser = useFarmStore((s) => s.removeUser)
  const currentUser = useFarmStore((s) => s.currentUser)

  const [showAdd,    setShowAdd]    = useState(false)
  const [addForm,    setAddForm]    = useState(BLANK_USER)
  const [addError,   setAddError]   = useState('')

  const [editUser,   setEditUser]   = useState(null)   // user object being edited
  const [editRole,   setEditRole]   = useState('')

  const [removeTarget, setRemoveTarget] = useState(null)

  const ownerCount = users.filter((u) => u.role === 'owner').length

  // ── Add user ────────────────────────────────────────────────
  const handleAdd = () => {
    if (!addForm.name.trim()) { setAddError('Name is required.'); return }
    if (!addForm.email.trim()) { setAddError('Email is required.'); return }
    setAddError('')
    addUser({ name: addForm.name.trim(), email: addForm.email.trim(), role: addForm.role, pin: addForm.pin })
    setAddForm(BLANK_USER)
    setShowAdd(false)
  }

  // ── Edit role ────────────────────────────────────────────────
  const openEdit = (user) => {
    setEditUser(user)
    setEditRole(user.role)
  }

  const handleEditSave = () => {
    if (editUser) {
      updateUser(editUser.id, { role: editRole })
    }
    setEditUser(null)
  }

  // ── Remove ───────────────────────────────────────────────────
  const handleRemoveConfirm = () => {
    if (removeTarget) removeUser(removeTarget.id)
    setRemoveTarget(null)
  }

  const canRemove = (user) => {
    if (user.role === 'owner' && ownerCount <= 1) return false
    return true
  }

  const roleName = (roleId) => ROLES.find((r) => r.id === roleId)?.name || roleId

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {currentUser?.id === row.id && (
            <span className="text-xs text-emerald-600 font-medium">You</span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-slate-600">{row.email || <span className="text-slate-400 italic">—</span>}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <Badge variant={row.role === 'owner' ? 'green' : row.role === 'viewer' ? 'blue' : 'default'}>
          {roleName(row.role)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Edit role"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => canRemove(row) ? setRemoveTarget(row) : undefined}
            disabled={!canRemove(row)}
            className={classNames(
              'p-1.5 rounded-lg transition-colors',
              canRemove(row)
                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                : 'text-slate-200 cursor-not-allowed'
            )}
            title={canRemove(row) ? 'Remove user' : 'Cannot remove the only owner'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Team Members"
          subtitle="Manage who has access to your farm"
          action={
            <Button size="sm" onClick={() => { setShowAdd(true); setAddError('') }}>
              <Plus size={14} />
              Add User
            </Button>
          }
        />

        <Table
          columns={columns}
          data={users}
          emptyText="No users found."
        />
      </Card>

      {/* Role info cards */}
      <Card>
        <CardHeader title="Role Permissions" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map((role) => (
            <div key={role.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Shield size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">{role.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Team Member"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>
              <Plus size={14} />
              Add Member
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {addError && <Alert variant="error">{addError}</Alert>}
          <Input
            label="Full Name"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Jane Smith"
          />
          <Input
            label="Email Address"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="e.g. jane@example.com"
          />
          <Select
            label="Role"
            value={addForm.role}
            onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <Input
            label="PIN (optional)"
            type="password"
            value={addForm.pin}
            onChange={(e) => setAddForm((f) => ({ ...f, pin: e.target.value }))}
            placeholder="4-digit PIN"
            maxLength={4}
            hint="Used for quick login on shared devices"
          />
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User Role"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>
              <Save size={14} />
              Save Role
            </Button>
          </div>
        }
      >
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm shrink-0">
                {editUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{editUser.name}</p>
                <p className="text-xs text-slate-500">{editUser.email}</p>
              </div>
            </div>
            <Select
              label="Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
            <p className="text-xs text-slate-500">
              {ROLES.find((r) => r.id === editRole)?.description}
            </p>
          </div>
        )}
      </Modal>

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${removeTarget?.name}? They will lose access to this farm.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: DANGER ZONE
// ═══════════════════════════════════════════════════════════════
function DangerZoneSection() {
  const resetApp = useFarmStore((s) => s.resetApp)
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = () => {
    resetApp()
    navigate('/')
  }

  return (
    <div className="space-y-4">
      <Card className="border-red-200">
        <CardHeader
          title={
            <span className="text-red-700 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              Danger Zone
            </span>
          }
          subtitle="These actions are irreversible. Proceed with caution."
        />

        <Alert variant="error" className="mb-5">
          This will permanently delete all farm data and reset to onboarding. There is no undo.
        </Alert>

        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-red-200 bg-red-50">
          <div>
            <p className="text-sm font-semibold text-red-800">Reset All Data</p>
            <p className="text-xs text-red-600 mt-0.5">
              Deletes all fields, crops, animals, inventory, tasks, finance records, equipment, and users.
              Resets the app to the onboarding wizard.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            className="shrink-0"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={14} />
            Reset All Data
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        title="Reset All Farm Data?"
        message="This will permanently delete ALL farm data and reset to onboarding. This action cannot be undone. Are you absolutely sure?"
        confirmLabel="Yes, Reset Everything"
        variant="danger"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════
export default function Settings() {
  const [activeSection, setActiveSection] = useState('farm')

  const renderSection = () => {
    switch (activeSection) {
      case 'farm':    return <FarmProfileSection />
      case 'modules': return <ModulesSection />
      case 'team':    return <TeamSection />
      case 'danger':  return <DangerZoneSection />
      default:        return <FarmProfileSection />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          title="Settings"
          subtitle="Manage your farm profile, modules, team, and account settings"
        />

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Vertical nav (desktop) / horizontal nav (mobile) ── */}
          <nav className="md:w-52 shrink-0">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <li key={id} className="shrink-0">
                  <button
                    onClick={() => setActiveSection(id)}
                    className={classNames(
                      'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap',
                      activeSection === id
                        ? id === 'danger'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon
                      size={16}
                      className={classNames(
                        activeSection === id
                          ? id === 'danger' ? 'text-red-600' : 'text-emerald-600'
                          : 'text-slate-400'
                      )}
                    />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
}
