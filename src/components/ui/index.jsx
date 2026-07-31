import { classNames } from '../../utils/helpers'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Search } from 'lucide-react'

// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow focus-visible:ring-emerald-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 shadow-sm focus-visible:ring-slate-400',
    earth: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm focus-visible:ring-amber-400',
  }
  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={classNames(
        'bg-white rounded-2xl border border-slate-200/80 shadow-sm',
        padding && 'p-5',
        hover && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={classNames('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className = '', required, ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={classNames(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150',
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', rows = 3, ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <textarea
        rows={rows}
        className={classNames(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150 resize-none',
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Select({ label, error, hint, className = '', children, ...props }) {
  return (
    <div className={classNames('flex flex-col gap-1.5', className)}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <select
        className={classNames(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-150 cursor-pointer',
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  }
  return (
    <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export function Alert({ children, variant = 'info', onClose, className = '' }) {
  const configs = {
    info: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: 'text-blue-500', Icon: Info },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500', Icon: CheckCircle },
    warning: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'text-amber-500', Icon: AlertTriangle },
    error: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: 'text-red-500', Icon: AlertCircle },
  }
  const { bg, border, text, icon, Icon } = configs[variant]
  return (
    <div className={classNames('flex items-start gap-3 p-4 rounded-xl border text-sm', bg, border, text, className)}>
      <Icon size={16} className={classNames('shrink-0 mt-0.5', icon)} />
      <div className="flex-1 leading-relaxed">{children}</div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={classNames(
        'relative bg-white w-full flex flex-col max-h-[95vh] sm:max-h-[90vh] shadow-2xl',
        'rounded-t-3xl sm:rounded-2xl',
        sizes[size]
      )}>
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────
export function Table({ columns, data, emptyText = 'No records found', onRowClick }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  'px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400 text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={classNames(
                  'hover:bg-slate-50/80 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={classNames('px-5 py-3.5 text-slate-700', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'emerald', trend, subtext }) {
  const colors = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
    slate: { bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-600' },
  }
  const c = colors[color] || colors.emerald
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={classNames('rounded-xl p-2.5', c.light)}>
            <Icon size={18} className={c.text} />
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>}
        {trend != null && (
          <p className={classNames('text-xs mt-1.5 font-semibold flex items-center gap-1', trend > 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-6 mb-5 shadow-inner">
          <Icon size={32} className="text-slate-300" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

// ─── Search Bar ──────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={classNames('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-slate-300 transition-all duration-150 placeholder:text-slate-400"
      />
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-7">
      <div>
        {breadcrumb && <p className="text-xs text-slate-400 mb-1.5 font-medium">{breadcrumb}</p>}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 mt-0.5">{action}</div>}
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={classNames(
            'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-150',
            active === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  )
}

// ─── Priority Badge ──────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = { Low: 'blue', Medium: 'yellow', High: 'orange', Urgent: 'red' }
  return <Badge variant={map[priority] || 'default'}>{priority}</Badge>
}

// ─── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = { 'To Do': 'default', 'In Progress': 'blue', Done: 'green', Cancelled: 'red' }
  return <Badge variant={map[status] || 'default'}>{status}</Badge>
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</h2>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}
