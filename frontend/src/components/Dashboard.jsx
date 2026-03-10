import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { StatCard, Card, SectionHeader, Badge, HealthDot, ProgressBar, Avatar, Button, Spinner, EmptyState } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'
import { motion } from 'framer-motion'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import {
    LayoutDashboard, Briefcase, CheckCircle2, AlertCircle, Clock,
    ChevronRight, RefreshCw, BarChart3, Activity, ListChecks
} from 'lucide-react'

const COLORS = {
    active: '#3b82f6',
    completed: '#10b981',
    on_hold: '#f59e0b',
    overdue: '#ef4444',
    done: '#10b981',
    blocked: '#ef4444',
    todo: '#64748b'
}

function PortfolioHealthDial({ projects }) {
    if (!projects?.length) return null
    const avgHealth = projects.reduce((acc, p) => {
        const scores = { green: 100, yellow: 60, red: 20 }
        return acc + (scores[p.health] || 50)
    }, 0) / projects.length

    const radius = 70
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (avgHealth / 100) * circumference
    const color = avgHealth > 80 ? '#22c55e' : avgHealth > 50 ? '#eab308' : '#ef4444'

    return (
        <Card className="flex flex-row items-center justify-between p-8 bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.05)]">
            <div className="flex-1">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Portfolio Health Index</h3>
                <div className="text-5xl font-black text-white flex items-baseline gap-2">
                    {Math.round(avgHealth)}<span className="text-xl text-slate-500 font-bold uppercase tracking-tighter">PHI</span>
                </div>
                <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
                    Overall performance is <span className="text-white font-bold">{avgHealth > 80 ? 'Optimal' : 'Compromised'}</span> based on active milestone tracking and resource distribution.
                </p>
                <div className="flex gap-4 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Warning</span>
                    </div>
                </div>
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r={radius} fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                    <motion.circle
                        cx="96" cy="96" r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Global</span>
                    <span className="text-2xl font-black text-white uppercase">{avgHealth > 80 ? 'Safe' : avgHealth > 50 ? 'Alert' : 'Critical'}</span>
                </div>
            </div>
        </Card>
    )
}

function Dashboard({ setCurrentPage, setSelectedProjectId }) {
    const { addToast } = useApp()
    const [stats, setStats] = useState(null)
    const [lastRefreshed, setLastRefreshed] = useState(null)
    const [secondsAgo, setSecondsAgo] = useState(0)

    const load = useCallback(async () => {
        try {
            const data = await api.getDashboard()
            setStats(data)
            setLastRefreshed(Date.now())
            setSecondsAgo(0)
        } catch (err) {
            addToast('Failed to load dashboard', 'error')
        }
    }, [addToast])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const interval = setInterval(() => setSecondsAgo(s => s + 5), 5000)
        const pollInterval = setInterval(load, 30000)
        return () => { clearInterval(interval); clearInterval(pollInterval) }
    }, [load])

    if (!stats) return (
        <div className="flex-1 flex items-center justify-center bg-[#020617]">
            <Spinner size="lg" />
        </div>
    )

    const { projects: p, tasks: t, recent_activity, recent_projects } = stats

    const projectData = [
        { name: 'Active', value: p.active, color: COLORS.active },
        { name: 'Completed', value: p.completed, color: COLORS.completed },
        { name: 'On Hold', value: p.on_hold, color: COLORS.on_hold },
        { name: 'Overdue', value: p.overdue, color: COLORS.overdue },
    ].filter(d => d.value > 0)

    const taskData = [
        { name: 'Done', value: t.done, color: COLORS.done },
        { name: 'Blocked', value: t.blocked, color: COLORS.blocked },
        { name: 'Pending', value: t.total - t.done - t.blocked, color: COLORS.active },
    ].filter(d => d.value > 0)

    return (
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 pb-12">
            {/* Header / Refresh */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-blue-500" size={28} />
                        Portfolio Overview
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Real-time health of your customer onboarding projects</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Live Status
                    </span>
                    <div className="h-4 w-px bg-white/10" />
                    <button
                        onClick={() => { load(); addToast('Stats updated', 'info') }}
                        className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 font-bold uppercase"
                    >
                        <RefreshCw size={12} className={secondsAgo === 0 ? 'animate-spin' : ''} />
                        {secondsAgo === 0 ? 'Syncing...' : `Refreshed ${secondsAgo}s ago`}
                    </button>
                </div>
            </header>

            <PortfolioHealthDial projects={recent_projects} />

            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Live Projects" value={p.active} icon={<Activity className="text-blue-400" />} colorClass="from-blue-600 to-indigo-600" onClick={() => setCurrentPage('projects')} />
                <StatCard label="Successful Delivery" value={p.completed} icon={<CheckCircle2 className="text-emerald-400" />} colorClass="from-emerald-600 to-teal-600" />
                <StatCard label="Risk Alerts" value={p.overdue} icon={<AlertCircle className="text-rose-400" />} colorClass="from-rose-600 to-pink-600" />
                <StatCard label="Tasks Completed" value={t.done} icon={<ListChecks className="text-violet-400" />} colorClass="from-violet-600 to-purple-600" />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Distribution Chart */}
                <Card className="lg:col-span-2">
                    <SectionHeader title="Portfolio Distribution" action={<BarChart3 size={18} className="text-slate-500" />} />
                    <div className="h-[280px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis hide />
                                <RechartsTooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {projectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Task Health Pie */}
                <Card>
                    <SectionHeader title="Task Status" action={<CheckCircle2 size={18} className="text-slate-500" />} />
                    <div className="h-[220px] mt-8 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {taskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{t.total}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Tasks</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {taskData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Projects List */}
                <Card className="flex flex-col">
                    <SectionHeader title="Recent Activity" icon={<Briefcase size={18} className="text-slate-500" />}
                        action={<Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setCurrentPage('projects')}>View All <ChevronRight size={14} /></Button>} />

                    <div className="space-y-3 mt-4 flex-1">
                        {!recent_projects?.length && <EmptyState title="No active projects" description="Create a project to see progress here." />}
                        {recent_projects?.map(proj => (
                            <div key={proj.id}
                                onClick={() => { setSelectedProjectId(proj.id); setCurrentPage('project_detail') }}
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 shadow-sm">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5`}>
                                    {proj.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{proj.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{proj.client_name || 'Internal'}</span>
                                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                                        <HealthDot health={proj.health} />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-white">{Math.round(proj.completion_pct)}%</div>
                                    <div className="w-16 bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${proj.completion_pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Activity Feed */}
                <Card>
                    <SectionHeader title="Timeline" icon={<Clock size={18} className="text-slate-500" />} />
                    <div className="space-y-4 mt-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {!recent_activity?.length && <EmptyState title="Quiet day" description="New events will appear as your team works." />}
                        {recent_activity?.map((log, idx) => (
                            <div key={log.id} className="relative flex gap-4 pl-1 group">
                                {idx !== recent_activity.length - 1 && (
                                    <div className="absolute left-[9px] top-6 bottom-[-16px] w-[2px] bg-white/5" />
                                )}
                                <div className="mt-1.5 w-4 h-4 rounded-full border-2 border-slate-800 bg-slate-900 flex-shrink-0 z-10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                </div>
                                <div className="flex-1 pb-4">
                                    <p className="text-sm text-slate-200 leading-snug group-hover:text-white transition-colors">{log.action}</p>

                                    {log.meta && log.meta.type === 'status_change' && (
                                        <div className="mt-1 flex gap-2">
                                            <Badge variant="ghost" className="text-[10px] py-0 px-1.5 opacity-60 uppercase">{log.meta.old}</Badge>
                                            <span className="text-[10px] text-slate-600">→</span>
                                            <Badge variant="success" className="text-[10px] py-0 px-1.5 uppercase">{log.meta.new}</Badge>
                                        </div>
                                    )}

                                    {log.meta && log.meta.type === 'health_change' && (
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full bg-${log.meta.new}-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Health Shift</span>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard
