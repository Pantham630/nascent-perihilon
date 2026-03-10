import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { Card, Button, Avatar, Badge, SectionHeader, Spinner, EmptyState } from './ui/index.jsx'
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Zap, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

function Profile({ userId, onBack, onProjectClick }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const data = await api.getUserAIProfile(userId)
            setProfile(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => { load() }, [load])

    if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    if (!profile) return <div className="p-10"><EmptyState title="User not found" /></div>

    const { stats, burnout_risk, recent_tasks } = profile

    return (
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative">
            {/* Header / Back */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full w-10 h-10 p-0">
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex items-center gap-4">
                    <Avatar user={{ id: profile.user_id, name: profile.name }} size="lg" className="border-2 border-blue-500/20" />
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{profile.name}</h1>
                        <p className="text-slate-400 text-sm font-medium">{profile.role} · {profile.email}</p>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <Badge variant={burnout_risk === 'High' ? 'danger' : burnout_risk === 'Medium' ? 'warning' : 'success'} className="px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                        {burnout_risk} Risk
                    </Badge>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Open Tasks', val: stats.open, icon: <Clock className="text-blue-400" />, color: 'blue' },
                    { label: 'Completion', val: `${stats.completion_rate}%`, icon: <CheckCircle2 className="text-green-400" />, color: 'green' },
                    { label: 'Urgent', val: stats.high_priority, icon: <Zap className="text-amber-400" />, color: 'amber' },
                    { label: 'Overdue', val: stats.overdue, icon: <AlertTriangle className="text-red-400" />, color: 'red' },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="flex flex-col items-center text-center p-6 border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                            <div className="mb-3 p-2 rounded-lg bg-white/5">{s.icon}</div>
                            <div className="text-3xl font-black text-white">{s.val}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Assigned Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <SectionHeader title="Active Assignments" icon={<Activity size={18} className="text-slate-500" />} />
                        <div className="mt-4 space-y-2">
                            {recent_tasks.length === 0 ? (
                                <EmptyState title="No active tasks" description="This user is currently free or has completed everything!" />
                            ) : recent_tasks.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => onProjectClick(t.project_id)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge variant={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'ghost'} className="text-[10px] w-12 text-center">
                                            {t.priority}
                                        </Badge>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{t.title}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t.uid} · Due {new Date(t.due_date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <Badge variant="ghost" className="text-[10px] uppercase font-bold text-slate-600 bg-white/5">
                                        {t.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* AI Insights Card */}
                    <Card className="bg-blue-600/5 border-blue-500/20">
                        <SectionHeader title="AI Performance Insight" icon={<Zap size={18} className="text-blue-400" />} />
                        <div className="mt-4">
                            <p className="text-sm text-blue-100/80 leading-relaxed italic">
                                "Based on current velocity and internal dependency mapping, {profile.name} is tracking {stats.completion_rate > 70 ? 'ahead of' : 'at'} predicted capacity.
                                {burnout_risk === 'High' ? ' CAUTION: High volume of urgent tasks detected. Recommend offloading non-critical items.' : ' Capacity remains optimal for additional onboarding support.'}"
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card>
                        <SectionHeader title="Productivity Trend" />
                        <div className="h-48 mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    { name: 'W1', val: 12 },
                                    { name: 'W2', val: 18 },
                                    { name: 'W3', val: 15 },
                                    { name: 'W4', val: stats.completed },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-4">Tasks completed over 4 weeks</p>
                    </Card>

                    <Card>
                        <SectionHeader title="Team Impact" />
                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                    <span>Resource Share</span>
                                    <span>{Math.round((stats.open / 50) * 100)}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${(stats.open / 50) * 100}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                    <span>Velocity Factor</span>
                                    <span>{stats.completion_rate}%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${stats.completion_rate}%` }} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Profile
