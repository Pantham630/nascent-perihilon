import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { Card, Button, Badge, HealthDot, ProgressBar, Avatar, Modal, Input, Select, Textarea, SectionHeader, EmptyState, Spinner } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'

const HEALTH_ICONS = { green: '🟢', yellow: '🟡', red: '🔴' }

function CreateProjectModal({ onClose, onCreated }) {
    const { currentUser, users, addToast } = useApp()
    const [templates, setTemplates] = useState([])
    const [form, setForm] = useState({ name: '', description: '', client_name: '', client_email: '', due_date: '', template_id: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { api.getTemplates().then(setTemplates).catch(() => { }) }, [])

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

    const handleSave = async () => {
        if (!form.name.trim()) { addToast('Project name is required', 'error'); return }
        setSaving(true)
        try {
            const payload = {
                name: form.name, description: form.description,
                client_name: form.client_name || null, client_email: form.client_email || null,
                due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
                template_id: form.template_id ? parseInt(form.template_id) : null,
                created_by: currentUser?.id || null,
            }
            const proj = await api.createProject(payload)
            addToast(`Project "${proj.name}" created!`, 'success')
            onCreated(proj)
        } catch (err) {
            addToast(`Failed: ${err.message}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal title="✦ New Project" onClose={onClose}>
            <div className="px-6 py-4 flex flex-col gap-4">
                <Input label="Project Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Corp Onboarding" autoFocus />
                <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What will this project deliver?" rows={2} />
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Client Name" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="ACME Inc." />
                    <Input label="Client Email" type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="client@acme.com" />
                </div>
                <Input label="Due Date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                {templates.length > 0 && (
                    <Select label="Template (optional)" value={form.template_id} onChange={e => set('template_id', e.target.value)}>
                        <option value="">— Blank project —</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                )}
            </div>
            <div className="px-6 py-4 border-t border-[rgba(99,140,187,0.1)] flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</Button>
            </div>
        </Modal>
    )
}

function ProjectCard({ project, onClick }) {
    const daysLeft = project.due_date
        ? Math.round((new Date(project.due_date) - Date.now()) / 86400000) : null
    const healthColor = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' }[project.health] || '#3b82f6'

    return (
        <Card onClick={onClick} className="hover:shadow-lg hover:border-[rgba(99,140,187,0.3)] transition-all duration-200 group">
            {/* Top accent */}
            <div className="h-0.5 rounded-full mb-4" style={{ background: `linear-gradient(90deg, ${healthColor}, transparent)` }} />

            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[#f0f6ff] truncate group-hover:text-blue-300 transition-colors">{project.name}</h3>
                    {project.client_name && (
                        <p className="text-xs text-[#4d6480] mt-0.5">🏢 {project.client_name}</p>
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <HealthDot health={project.health} />
                    <Badge type="status" value={project.status} />
                </div>
            </div>

            {project.description && (
                <p className="text-xs text-[#8da4bf] mb-3 line-clamp-2">{project.description}</p>
            )}

            {/* Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#4d6480]">Progress</span>
                    <span className="font-bold text-[#8da4bf]">{Math.round(project.completion_pct)}%</span>
                </div>
                <ProgressBar pct={project.completion_pct} color={healthColor} height={4} />
            </div>

            {/* Foot */}
            <div className="flex items-center justify-between text-xs text-[#4d6480] pt-2 border-t border-[rgba(99,140,187,0.08)]">
                <span>📋 {project.done_count}/{project.task_count} tasks</span>
                <span>
                    {project.overdue_tasks > 0 && <span className="text-red-400 font-semibold mr-2">⚠ {project.overdue_tasks} overdue</span>}
                    {daysLeft !== null && (
                        <span className={daysLeft < 0 ? 'text-red-400' : daysLeft < 7 ? 'text-amber-400' : ''}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                    )}
                </span>
            </div>
        </Card>
    )
}

function ProjectsList({ onProjectClick }) {
    const { addToast } = useApp()
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [filter, setFilter] = useState('')
    const [search, setSearch] = useState('')

    const loadProjects = useCallback(async () => {
        try {
            const data = await api.getProjects(filter || undefined)
            setProjects(data)
        } catch (err) {
            addToast('Failed to load projects', 'error')
        } finally {
            setLoading(false)
        }
    }, [filter, addToast])

    useEffect(() => { loadProjects() }, [loadProjects])
    useEffect(() => {
        const interval = setInterval(loadProjects, 30000)
        return () => clearInterval(interval)
    }, [loadProjects])

    const filtered = projects.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(search.toLowerCase())
    )

    const healthCounts = { green: 0, yellow: 0, red: 0 }
    projects.forEach(p => { if (healthCounts[p.health] !== undefined) healthCounts[p.health]++ })

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Header + filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex gap-2">
                    {[['', 'All'], ['active', 'Active'], ['on_hold', 'On Hold'], ['completed', 'Completed']].map(([val, label]) => (
                        <button key={val}
                            onClick={() => setFilter(val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${filter === val ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-[#121f35] text-[#8da4bf] border-[rgba(99,140,187,0.15)] hover:bg-[#1a2e4a]'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4d6480] text-xs">🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search projects…"
                        className="w-full bg-[#121f35] border border-[rgba(99,140,187,0.2)] text-[#f0f6ff] rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:border-blue-500 placeholder:text-[#4d6480]" />
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {/* Health summary pills */}
                    {[['green', '🟢'], ['yellow', '🟡'], ['red', '🔴']].map(([h, icon]) => healthCounts[h] > 0 && (
                        <span key={h} className="text-xs text-[#8da4bf]">{icon} {healthCounts[h]}</span>
                    ))}
                    <Button onClick={() => setShowCreate(true)}>＋ New Project</Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="📂" title="No projects yet"
                    description="Create your first project to start managing client onboarding."
                    action={<Button onClick={() => setShowCreate(true)}>＋ Create Project</Button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <ProjectCard key={p.id} project={p} onClick={() => onProjectClick(p.id)} />
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={(p) => { setShowCreate(false); loadProjects(); onProjectClick(p.id) }} />
            )}
        </div>
    )
}

export default ProjectsList
