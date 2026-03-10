import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { Avatar, Card, Button, Badge, SectionHeader, EmptyState, Spinner } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'

function PeopleRow({ person, tasks }) {
    const barColors = { high: '#ef4444', medium: '#f59e0b', normal: '#10b981' }
    const barColor = barColors[person.workload] || '#10b981'
    const barWidth = Math.min(100, (person.open_tasks / 15) * 100)

    return (
        <div onClick={() => person.onSelectUser?.(person.user_id)}
            className="flex items-center gap-4 py-3.5 border-b border-[rgba(99,140,187,0.08)] last:border-0 hover:bg-white/5 cursor-pointer transition-all px-2 -mx-2 rounded-lg group">
            <Avatar user={{ id: person.user_id, name: person.name }} size="md" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-[#f0f6ff] group-hover:text-blue-400 transition-colors">{person.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase border
                        ${person.workload === 'high' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                            person.workload === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                'bg-green-500/15 text-green-400 border-green-500/30'}`}>
                        {person.workload}
                    </span>
                </div>
                <div className="text-xs text-[#4d6480] capitalize">{person.role} · {person.email}</div>
                <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[rgba(99,140,187,0.12)] rounded-full overflow-hidden max-w-xs">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, background: barColor }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: barColor }}>{person.open_tasks} open</span>
                </div>
            </div>
            <div className="text-right flex flex-col gap-1">
                {person.overdue_tasks > 0 && <span className="text-xs text-red-400">⚠ {person.overdue_tasks} overdue</span>}
                {person.high_priority_tasks > 0 && <span className="text-xs text-amber-400">⚡ {person.high_priority_tasks} urgent</span>}
            </div>
        </div>
    )
}

function People({ onSelectUser }) {
    const { users, addToast } = useApp()
    const [workload, setWorkload] = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const data = await api.getWorkload()
            setWorkload(data)
        } catch (err) {
            addToast('Failed to load workload data', 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    useEffect(() => { load() }, [load])

    const totalOpen = workload.reduce((s, w) => s + w.open_tasks, 0)
    const overloaded = workload.filter(w => w.workload === 'high').length

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="text-center">
                    <div className="text-3xl font-extrabold text-[#f0f6ff] mb-1">{users.length}</div>
                    <div className="text-xs text-[#4d6480] uppercase tracking-wider font-semibold">Team Members</div>
                </Card>
                <Card className="text-center">
                    <div className="text-3xl font-extrabold text-blue-400 mb-1">{totalOpen}</div>
                    <div className="text-xs text-[#4d6480] uppercase tracking-wider font-semibold">Open Tasks</div>
                </Card>
                <Card className="text-center">
                    <div className={`text-3xl font-extrabold mb-1 ${overloaded > 0 ? 'text-red-400' : 'text-green-400'}`}>{overloaded}</div>
                    <div className="text-xs text-[#4d6480] uppercase tracking-wider font-semibold">Overloaded</div>
                </Card>
            </div>

            <Card>
                <SectionHeader title="Workload Overview" badge={workload.length}
                    action={<Button variant="ghost" size="sm" onClick={() => { load(); }}>↻ Refresh</Button>} />
                {loading ? (
                    <div className="flex justify-center py-10"><Spinner /></div>
                ) : workload.length === 0 ? (
                    <EmptyState icon="👥" title="No team members" description="Users will appear here once added to the system." />
                ) : workload.map(w => <PeopleRow key={w.user_id} person={{ ...w, onSelectUser }} />)}
            </Card>

            {/* Overload warning */}
            {overloaded > 0 && (
                <div className="mt-4 bg-red-500/8 border border-red-500/20 rounded-lg p-4 flex gap-3">
                    <span className="text-red-400 text-lg">⚠</span>
                    <div>
                        <p className="text-sm font-semibold text-red-300">Workload imbalance detected</p>
                        <p className="text-xs text-red-400/80 mt-0.5">{overloaded} team member{overloaded > 1 ? 's are' : ' is'} overloaded (10+ open tasks). Consider redistributing tasks for better balance.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default People
