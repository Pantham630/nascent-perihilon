import React from 'react'

// ─── Avatar ────────────────────────────────────────────────────
export function Avatar({ user, size = 'md' }) {
    const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
    const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
    const color = colors[(user?.id || 0) % colors.length]
    if (user?.avatar_url) {
        return <img src={user.avatar_url} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10`} alt={user.name} />
    }
    return (
        <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white/10 flex-shrink-0`}
            style={{ background: color }}>
            {initials}
        </div>
    )
}

// ─── Badge ─────────────────────────────────────────────────────
const BADGE_VARIANTS = {
    status: {
        todo: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        done: 'bg-green-500/20 text-green-400 border-green-500/30',
        blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
        active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        on_hold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        completed: 'bg-green-500/20 text-green-400 border-green-500/30',
        cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    },
    priority: {
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
        medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        high: 'bg-red-500/20 text-red-400 border-red-500/30',
        critical: 'bg-red-600/30 text-red-300 border-red-500/50',
    },
    health: {
        green: 'bg-green-500/20 text-green-400 border-green-500/30',
        yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
}

export function Badge({ type = 'status', value, className = '' }) {
    const cls = BADGE_VARIANTS[type]?.[value] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    const label = value?.replace(/_/g, ' ')
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${cls} ${className}`}>
            {label}
        </span>
    )
}

// ─── Health Dot ────────────────────────────────────────────────
export function HealthDot({ health, size = 'sm' }) {
    const colors = { green: 'bg-green-400', yellow: 'bg-amber-400', red: 'bg-red-400' }
    const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3' }
    return <span className={`${sizes[size]} ${colors[health] || colors.green} rounded-full inline-block flex-shrink-0`} />
}

// ─── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ pct, color = '#3b82f6', height = 5 }) {
    return (
        <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(99,140,187,0.12)' }}>
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    )
}

// ─── Button ────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
    const base = 'inline-flex items-center gap-2 font-semibold rounded-md transition-all duration-150 cursor-pointer border'
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' }
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white hover:from-blue-500 hover:to-indigo-500 shadow-md',
        ghost: 'bg-transparent border-white/10 text-[#8da4bf] hover:bg-[#1a2e4a] hover:text-white',
        danger: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
        success: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
        outline: 'bg-transparent border-[rgba(99,140,187,0.25)] text-[#8da4bf] hover:border-blue-500 hover:text-blue-400',
    }
    return (
        <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    )
}

// ─── Card ──────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
    return (
        <div
            className={`glass-card rounded-lg p-5 group relative overflow-hidden transition-all duration-300 
            ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow hover:border-blue-500/30' : ''} ${className}`}
            onClick={onClick}
        >
            {/* Subtle inner glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-sm" />
            {children}
        </div>
    )
}

// ─── Modal ─────────────────────────────────────────────────────
export function Modal({ children, onClose, title, wide = false }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in" onClick={onClose}>
            <div
                className={`glass-card border-white/10 rounded-xl shadow-2xl ${wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'} max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
                        <button onClick={onClose} className="text-[#4d6480] hover:text-white text-2xl transition-colors">×</button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    )
}

// ─── Input ─────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</label>}
            <input
                className="bg-slate-900/50 border border-white/10 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 shadow-inner"
                {...props}
            />
            {error && <span className="text-[10px] text-red-400 font-medium">{error}</span>}
        </div>
    )
}

export function Select({ label, children, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</label>}
            <select
                className="bg-slate-900/50 border border-white/10 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 appearance-none shadow-inner"
                {...props}
            >
                {children}
            </select>
        </div>
    )
}

export function Textarea({ label, className = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</label>}
            <textarea
                className="bg-slate-900/50 border border-white/10 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 resize-none placeholder:text-slate-600 shadow-inner"
                {...props}
            />
        </div>
    )
}

// ─── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
    const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' }
    return (
        <div className={`${sizes[size]} border-[rgba(99,140,187,0.2)] border-t-blue-500 rounded-full animate-spin`} />
    )
}

// ─── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            {icon && <div className="text-5xl mb-2">{icon}</div>}
            <div className="text-[#f0f6ff] font-semibold text-lg">{title}</div>
            {description && <div className="text-[#4d6480] text-sm max-w-xs">{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}

// ─── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, icon, colorClass = 'from-blue-600 to-blue-400', onClick }) {
    return (
        <Card className={`relative flex flex-col items-center text-center group cursor-pointer border-white/5`} onClick={onClick}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <div className="text-4xl font-extrabold text-white tracking-tighter mb-1 select-none whitespace-nowrap drop-shadow-sm">{value ?? '—'}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-black">{label}</div>
        </Card>
    )
}

// ─── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, badge, action }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#f0f6ff] uppercase tracking-wider">{title}</span>
                {badge != null && (
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            {action}
        </div>
    )
}
