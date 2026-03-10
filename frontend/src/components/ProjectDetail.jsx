import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { Badge, Button, Avatar, Card, Modal, Input, Select, Textarea, SectionHeader, EmptyState, Spinner, ProgressBar, HealthDot } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'
import { MessageSquare, AtSign, Send, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react'
import RichText from './ui/RichText.jsx'
import DiscussionBoard from './DiscussionBoard.jsx'

// ─── Task Modal ─────────────────────────────────────────────────
function TaskModal({ task, projectId, milestones, onClose, onSaved }) {
    const { currentUser, users, addToast } = useApp()
    const isNew = !task
    const [form, setForm] = useState({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || 'todo',
        priority: task?.priority || 'medium',
        assignee_id: task?.assignee_id || '',
        milestone_id: task?.milestone_id || '',
        due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        estimated_hours: task?.estimated_hours || '',
        tags: task?.tags ? JSON.parse(task.tags).join(', ') : '',
    })
    const [newComment, setNewComment] = useState('')
    const [activeTab, setActiveTab] = useState('details')
    const [saving, setSaving] = useState(false)
    const [timeHours, setTimeHours] = useState('')
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState('')

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const handleSave = async () => {
        if (!form.title.trim()) { addToast('Title required', 'error'); return }
        setSaving(true)
        try {
            const tags = form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)) : null
            const payload = {
                ...form,
                assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
                milestone_id: form.milestone_id ? parseInt(form.milestone_id) : null,
                due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
                estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
                tags,
            }
            if (isNew) {
                await api.createTask(projectId, payload, currentUser?.id)
                addToast('Task created!', 'success')
            } else {
                await api.updateTask(task.id, payload, currentUser?.id)
                addToast('Task updated', 'success')
            }
            onSaved()
        } catch (err) {
            addToast(`Failed: ${err.message}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!task || !confirm('Delete this task?')) return
        try {
            await api.deleteTask(task.id)
            addToast('Task deleted', 'warning'); onSaved()
        } catch (err) { addToast('Failed to delete', 'error') }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return
        try {
            await api.addComment(task.id, { body: newComment, author_name: currentUser?.name || 'Team Member', author_id: currentUser?.id })
            setNewComment(''); onSaved()
            addToast('Comment added', 'success')
        } catch (err) { addToast('Failed', 'error') }
    }

    const handleLogTime = async () => {
        if (!timeHours || !task) return
        try {
            await api.logTime(task.id, { hours: parseFloat(timeHours), user_id: currentUser?.id, note: '' })
            setTimeHours(''); onSaved()
            addToast(`${timeHours}h logged`, 'success')
        } catch (err) { addToast('Failed to log time', 'error') }
    }

    const handleCommentChange = (val) => {
        setNewComment(val)
        const lastWord = val.split(/\s/).pop()
        if (lastWord.startsWith('@')) {
            setMentionFilter(lastWord.slice(1))
            setShowMentions(true)
        } else {
            setShowMentions(false)
        }
    }

    const insertMention = (user) => {
        const words = newComment.split(/\s/)
        words.pop()
        setNewComment([...words, `@[${user.name}]`].join(' ') + ' ')
        setShowMentions(false)
    }

    const handleRequestApproval = async () => {
        try {
            await api.requestApproval(task.id, {
                task_id: task.id,
                requested_by: currentUser.id
            })
            addToast('Approval requested', 'success')
            onSaved()
        } catch (err) { addToast('Failed to request approval', 'error') }
    }

    const handleRespondApproval = async (approvalId, status) => {
        try {
            await api.respondApproval(task.id, approvalId, {
                status,
                approver_id: currentUser.id
            })
            addToast(`Task ${status}`, 'success')
            onSaved()
        } catch (err) { addToast('Action failed', 'error') }
    }

    const tags = task?.tags ? JSON.parse(task.tags) : []
    const TABS = ['details', ...(task ? ['comments', 'time', 'approvals'] : [])]

    return (
        <Modal title={isNew ? '✦ New Task' : `${task.task_uid || ''} Edit Task`} onClose={onClose} wide>
            {task && (
                <div className="flex border-b border-[rgba(99,140,187,0.1)] px-6 gap-4">
                    {TABS.map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2.5 text-xs font-semibold capitalize border-b-2 transition-all -mb-px
                                ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#4d6480] hover:text-[#8da4bf]'}`}>
                            {tab} {tab === 'comments' && task.comments?.length > 0 && `(${task.comments.length})`}
                        </button>
                    ))}
                </div>
            )}

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                {activeTab === 'details' && (
                    <div className="flex flex-col gap-4">
                        <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title…" autoFocus />
                        <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Details…" />
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
                                {['todo', 'in_progress', 'review', 'blocked', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </Select>
                            <Select label="Priority" value={form.priority} onChange={e => set('priority', e.target.value)}>
                                {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Assignee" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                                <option value="">— Unassigned —</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </Select>
                            <Select label="Milestone" value={form.milestone_id} onChange={e => set('milestone_id', e.target.value)}>
                                <option value="">— None —</option>
                                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Due Date" type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                            <Input label="Est. Hours" type="number" value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} placeholder="0" />
                        </div>
                        <Input label="Tags (comma-separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="frontend, bug, setup" />
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div className="flex flex-col gap-3">
                        {(task?.comments || []).length === 0 && <p className="text-[#4d6480] text-sm text-center py-4">No comments yet</p>}
                        {(task?.comments || []).map(c => (
                            <div key={c.id} className="bg-[#121f35] rounded-lg p-3 border border-[rgba(99,140,187,0.1)]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-blue-400">{c.author_name || c.author?.name || 'Someone'}</span>
                                    <span className="text-[10px] text-[#4d6480]">{new Date(c.created_at).toLocaleString()}</span>
                                </div>
                                <RichText text={c.body} className="text-sm text-[#f0f6ff]" />
                            </div>
                        ))}
                        <div className="relative">
                            <Textarea
                                value={newComment}
                                onChange={e => handleCommentChange(e.target.value)}
                                placeholder="Add a comment... (@mention team members)"
                                rows={2}
                            />
                            {showMentions && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 glass-card bg-[#020617] border border-[rgba(99,140,187,0.2)] rounded-xl shadow-2xl z-[100] overflow-hidden">
                                    <div className="px-3 py-2 border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <AtSign size={10} /> Mention Team Member
                                    </div>
                                    {users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).slice(0, 5).map(u => (
                                        <button key={u.id} onClick={() => insertMention(u)} className="w-full text-left p-2.5 hover:bg-white/5 flex items-center gap-3 transition-colors group">
                                            <Avatar user={u} size="xs" />
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white group-hover:text-blue-400">{u.name}</div>
                                                <div className="text-[9px] text-slate-500 uppercase">{u.role}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button onClick={handleAddComment} disabled={!newComment.trim()}>Post Comment</Button>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="space-y-4">
                        <SectionHeader title="Task Sign-off" icon={<ShieldCheck size={16} />} />

                        {(task?.approvals || []).length === 0 ? (
                            <div className="text-center py-10 bg-[#121f35] rounded-xl border border-dashed border-white/5">
                                <ShieldCheck size={32} className="mx-auto mb-3 text-slate-600 opacity-20" />
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No approval history</p>
                                <Button onClick={handleRequestApproval} className="mt-4" variant="primary">
                                    Request Official Sign-off
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {task.approvals.map(app => (
                                    <div key={app.id} className="bg-[#121f35] rounded-xl p-4 border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                                    ${app.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                        app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {app.status === 'pending' ? <Clock size={16} /> :
                                                        app.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-white uppercase tracking-tighter">Sign-off Status: {app.status}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requested by {app.requestor?.name || 'Team'}</div>
                                                </div>
                                            </div>
                                            <Badge variant={app.status === 'approved' ? 'success' : app.status === 'pending' ? 'warning' : 'danger'}>
                                                {app.status}
                                            </Badge>
                                        </div>

                                        {app.status === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'pm') && (
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="success" className="flex-1" onClick={() => handleRespondApproval(app.id, 'approved')}>
                                                    <CheckCircle2 size={14} className="mr-2" /> Approve
                                                </Button>
                                                <Button size="sm" variant="danger" className="flex-1" onClick={() => handleRespondApproval(app.id, 'rejected')}>
                                                    <XCircle size={14} className="mr-2" /> Reject
                                                </Button>
                                            </div>
                                        )}

                                        {app.note && <p className="text-xs text-slate-400 italic">"{app.note}"</p>}
                                    </div>
                                ))}
                                {task.approvals.every(a => a.status !== 'pending') && (
                                    <Button onClick={handleRequestApproval} variant="ghost" className="w-full border-dashed border-white/5">
                                        Request New Approval
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'time' && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#121f35] rounded-lg p-4 border border-[rgba(99,140,187,0.1)]">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-extrabold text-blue-400">{task?.estimated_hours || 0}h</p>
                                    <p className="text-xs text-[#4d6480]">Estimated</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-green-400">{task?.logged_hours || 0}h</p>
                                    <p className="text-xs text-[#4d6480]">Logged</p>
                                </div>
                            </div>
                        </div>
                        {(task?.time_entries || []).map(e => (
                            <div key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-[rgba(99,140,187,0.07)]">
                                <span className="text-[#8da4bf]">{e.user?.name || 'Team'}</span>
                                <span className="text-green-400 font-semibold">+{e.hours}h</span>
                                <span className="text-[10px] text-[#4d6480]">{new Date(e.date).toLocaleDateString()}</span>
                            </div>
                        ))}
                        <div className="flex gap-2 items-end">
                            <Input label="Log Hours" type="number" value={timeHours} onChange={e => setTimeHours(e.target.value)} placeholder="1.5" className="flex-1" />
                            <Button onClick={handleLogTime} disabled={!timeHours}>Log</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-6 py-4 border-t border-[rgba(99,140,187,0.1)] flex justify-between">
                <div>{task && <Button variant="danger" onClick={handleDelete}>Delete</Button>}</div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create Task' : 'Save Changes'}</Button>
                </div>
            </div>
        </Modal>
    )
}

// ─── Kanban Column ──────────────────────────────────────────────
const COLUMNS = [
    { id: 'todo', label: 'To Do', color: '#4d6480' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { id: 'review', label: 'Review', color: '#8b5cf6' },
    { id: 'blocked', label: 'Blocked', color: '#ef4444' },
    { id: 'done', label: 'Done', color: '#10b981' },
]

function TaskCard({ task, onClick, onDragStart }) {
    const tags = task.tags ? JSON.parse(task.tags) : []
    const dl = task.due_date ? new Date(task.due_date) : null
    const isOverdue = dl && dl < new Date() && task.status !== 'done'
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="bg-[#0d1526] border border-[rgba(99,140,187,0.15)] rounded-lg p-3 cursor-pointer hover:border-[rgba(99,140,187,0.3)] hover:-translate-y-0.5 transition-all group"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono text-[#4d6480]">{task.task_uid}</span>
                <Badge type="priority" value={task.priority} />
            </div>
            <p className="text-sm font-semibold text-[#f0f6ff] group-hover:text-blue-300 transition-colors mb-2 line-clamp-2">{task.title}</p>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map(t => <span key={t} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full">{t}</span>)}
                </div>
            )}
            <div className="flex items-center justify-between gap-2">
                {task.assignee ? (
                    <Avatar user={task.assignee} size="sm" />
                ) : (
                    <span className="w-7 h-7 rounded-full border border-dashed border-[rgba(99,140,187,0.3)] flex items-center justify-center text-[#4d6480] text-sm">+</span>
                )}
                <div className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-[#4d6480]'}`}>
                    {dl ? (isOverdue ? `⚠ Overdue` : `📅 ${dl.toLocaleDateString()}`) : ''}
                </div>
                {task.comments?.length > 0 && <span className="text-[10px] text-[#4d6480]">💬{task.comments.length}</span>}
            </div>
        </div>
    )
}

function TaskBoard({ project, tasks, milestones, onRefresh }) {
    const { addToast, currentUser } = useApp()
    const [dragOver, setDragOver] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [showCreate, setShowCreate] = useState(false)

    const handleDrop = async (e, statusId) => {
        e.preventDefault()
        setDragOver(null)
        const taskId = parseInt(e.dataTransfer.getData('taskId'))
        if (!taskId) return
        try {
            await api.updateTask(taskId, { status: statusId }, currentUser?.id)
            const labels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', blocked: 'Blocked', done: 'Done' }
            addToast(`Moved to ${labels[statusId]}`, 'info')
            onRefresh()
        } catch (err) { addToast('Failed to move task', 'error') }
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,140,187,0.1)]">
                <span className="text-xs text-[#8da4bf] font-semibold uppercase tracking-wider">Kanban Board</span>
                <Button size="sm" onClick={() => setShowCreate(true)}>＋ Add Task</Button>
            </div>
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${COLUMNS.length * 280}px` }}>
                    {COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id)
                        const isDragOver = dragOver === col.id
                        return (
                            <div key={col.id}
                                className={`flex flex-col rounded-xl border transition-all duration-150 flex-shrink-0 w-64
                                    ${isDragOver ? 'border-blue-500 shadow-glow bg-blue-500/5' : 'border-[rgba(99,140,187,0.15)] bg-[#0d1526]'}`}
                                onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={e => handleDrop(e, col.id)}>
                                {/* Column header */}
                                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(99,140,187,0.1)]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#8da4bf]">{col.label}</span>
                                    </div>
                                    <span className="w-5 h-5 rounded-full bg-[#121f35] text-[#4d6480] text-[10px] font-bold flex items-center justify-center border border-[rgba(99,140,187,0.1)]">
                                        {colTasks.length}
                                    </span>
                                </div>
                                {/* Tasks */}
                                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-16">
                                    {colTasks.length === 0 ? (
                                        <div className={`flex items-center justify-center h-16 text-xs text-[#4d6480] rounded-lg border border-dashed border-[rgba(99,140,187,0.1)] ${isDragOver ? 'border-blue-500/50 text-blue-400' : ''}`}>
                                            {isDragOver ? '↓ Drop here' : 'Empty'}
                                        </div>
                                    ) : colTasks.map(t => (
                                        <TaskCard key={t.id} task={t}
                                            onClick={() => setSelectedTask(t)}
                                            onDragStart={e => e.dataTransfer.setData('taskId', String(t.id))} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {(selectedTask || showCreate) && (
                <TaskModal
                    task={selectedTask}
                    projectId={project.id}
                    milestones={milestones}
                    onClose={() => { setSelectedTask(null); setShowCreate(false) }}
                    onSaved={() => { setSelectedTask(null); setShowCreate(false); onRefresh() }}
                />
            )}
        </div>
    )
}

// ─── Timeline / Gantt ───────────────────────────────────────────
function Timeline({ milestones, project }) {
    if (!project.start_date && !project.due_date) {
        return <EmptyState icon="📅" title="No dates set" description="Set project start and due dates to see the timeline." />
    }
    const start = new Date(project.start_date || project.created_at)
    const end = new Date(project.due_date || Date.now() + 30 * 86400000)
    const totalDays = Math.max(1, (end - start) / 86400000)

    return (
        <div className="flex-1 overflow-auto p-4">
            <div className="min-w-[700px]">
                {/* Header */}
                <div className="flex items-center mb-4 text-xs text-[#4d6480]">
                    <div className="w-52 flex-shrink-0 font-semibold text-[#8da4bf]">Milestone / Task</div>
                    <div className="flex-1 relative h-6 border-b border-[rgba(99,140,187,0.1)]">
                        {[0, 25, 50, 75, 100].map(pct => (
                            <div key={pct} className="absolute top-0 h-full border-l border-[rgba(99,140,187,0.1)]" style={{ left: `${pct}%` }}>
                                <span className="absolute top-0 left-1 text-[10px] text-[#4d6480]">
                                    {new Date(start.getTime() + (pct / 100) * (end - start)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                        {/* Today */}
                        <div className="absolute top-0 h-24 border-l-2 border-dashed border-blue-500/50"
                            style={{ left: `${Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100))}%` }}>
                            <span className="absolute top-0 left-1 text-[9px] text-blue-400">Today</span>
                        </div>
                    </div>
                </div>
                {/* Milestones */}
                {milestones.map(ms => {
                    const msEnd = ms.due_date ? new Date(ms.due_date) : end
                    const msLeft = Math.max(0, Math.min(100, ((start.getTime()) - start.getTime()) / (end - start) * 100))
                    const msWidth = Math.max(2, Math.min(100 - msLeft, ((msEnd - start) / (end - start)) * 100))
                    return (
                        <div key={ms.id} className="mb-2">
                            <div className="flex items-center gap-2 mb-1 group">
                                <div className="w-52 flex-shrink-0 flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#f0f6ff] truncate">📍 {ms.title}</span>
                                </div>
                                <div className="flex-1 relative h-7">
                                    <div className="absolute h-7 rounded-md flex items-center justify-center text-[10px] text-white font-semibold shadow-md"
                                        style={{ left: `${msLeft}%`, width: `${msWidth}%`, minWidth: 40, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}>
                                        {ms.title.substring(0, 12)}
                                    </div>
                                </div>
                            </div>
                            {ms.tasks?.map(task => {
                                const taskStart = task.start_date ? new Date(task.start_date) : start
                                const taskEnd = task.due_date ? new Date(task.due_date) : msEnd
                                const left = Math.max(0, Math.min(98, ((taskStart - start) / (end - start)) * 100))
                                const width = Math.max(1, Math.min(100 - left, ((taskEnd - taskStart) / (end - start)) * 100))
                                const bg = task.status === 'done' ? '#10b981' : task.status === 'blocked' ? '#ef4444' : '#1a2e4a'
                                return (
                                    <div key={task.id} className="flex items-center mb-1 pl-4">
                                        <div className="w-48 flex-shrink-0 text-xs text-[#8da4bf] truncate pr-2">{task.title}</div>
                                        <div className="flex-1 relative h-5">
                                            <motion.div
                                                layoutId={`gantt-${task.id}`}
                                                whileHover={{ scaleY: 1.1, filter: 'brightness(1.2)' }}
                                                className="absolute h-5 rounded flex items-center px-1.5 text-[9px] text-white/80 cursor-pointer shadow-lg"
                                                style={{ left: `${left}%`, width: `${width}%`, minWidth: 20, background: bg, border: '1px solid rgba(99,140,187,0.2)' }}
                                            >
                                                {task.title.substring(0, 10)}
                                            </motion.div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Activity Feed ──────────────────────────────────────────────
function ActivityFeed({ projectId }) {
    const [logs, setLogs] = useState([])
    useEffect(() => {
        api.getProjectActivity(projectId, 40).then(setLogs).catch(() => { })
        const i = setInterval(() => api.getProjectActivity(projectId, 40).then(setLogs).catch(() => { }), 15000)
        return () => clearInterval(i)
    }, [projectId])
    return (
        <div className="flex-1 overflow-y-auto p-4">
            {logs.length === 0 && <EmptyState icon="🕐" title="No activity yet" description="Actions on this project will appear here." />}
            {logs.map(log => (
                <div key={log.id} className="flex gap-3 py-3 border-b border-[rgba(99,140,187,0.07)] last:border-0">
                    {log.actor ? <Avatar user={log.actor} size="sm" /> : <div className="w-7 h-7 rounded-full bg-[#1a2e4a] flex items-center justify-center text-[#4d6480] text-sm">⚙</div>}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#8da4bf]">{log.action}</p>

                        {log.meta?.type === 'status_change' && (
                            <div className="mt-0.5 flex items-center gap-1.5 opacity-60">
                                <span className="text-[9px] font-bold text-[#4d6480] uppercase tracking-widest">{log.meta.old}</span>
                                <span className="text-[9px] text-[#4d6480]">→</span>
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{log.meta.new}</span>
                            </div>
                        )}

                        {log.meta?.type === 'health_change' && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full bg-${log.meta.new}-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]`} />
                                <span className="text-[9px] font-bold text-[#4d6480] uppercase">Health Alert</span>
                            </div>
                        )}

                        <p className="text-[10px] text-[#4d6480] mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Project Detail ─────────────────────────────────────────────
function ProjectDetail({ projectId, onBack }) {
    const { addToast } = useApp()
    const [project, setProject] = useState(null)
    const [tasks, setTasks] = useState([])
    const [milestones, setMilestones] = useState([])
    const [activeTab, setActiveTab] = useState('board')
    const [riskData, setRiskData] = useState(null)

    const loadAll = useCallback(async () => {
        try {
            const [proj, ms, ts] = await Promise.all([
                api.getProject(projectId),
                api.getMilestones(projectId),
                api.getTasks(projectId),
            ])
            setProject(proj)
            setMilestones(ms)
            setTasks(ts)
        } catch (err) {
            addToast('Failed to load project', 'error')
        }
    }, [projectId, addToast])

    useEffect(() => { loadAll() }, [loadAll])
    useEffect(() => {
        api.getProjectRisk(projectId).then(setRiskData).catch(() => { })
    }, [projectId])

    if (!project) return <div className="flex-1 flex items-center justify-center bg-[#020617]"><Spinner size="lg" /></div>

    const TABS = ['board', 'timeline', 'discussions', 'activity', 'overview']
    const doneTasks = tasks.filter(t => t.status === 'done').length

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
            {/* Project header */}
            <div className="px-8 py-6 border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">←</button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="font-black text-white text-xl tracking-tight uppercase truncate">{project.name}</h2>
                            <HealthDot health={project.health} size="md" />
                            <Badge type="status" value={project.status} className="scale-90" />
                        </div>
                        {project.client_name && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Client: {project.client_name}</span>
                                {project.client_email && <span className="text-[10px] text-blue-500/50 font-bold hidden sm:inline">({project.client_email})</span>}
                            </div>
                        )}
                    </div>
                    {riskData?.risk_count > 0 && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                            <span className="animate-pulse w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] text-rose-400 font-black uppercase tracking-tight">{riskData.risk_count} Alert{riskData.risk_count > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex-1 max-w-sm flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${project.completion_pct}%` }} />
                        </div>
                        <span className="text-[11px] text-white font-black">{Math.round(project.completion_pct)}%</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doneTasks} / {tasks.length} Milestones Reached</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 mt-6">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative
                                ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
                {activeTab === 'board' && <TaskBoard project={project} tasks={tasks} milestones={milestones} onRefresh={loadAll} />}
                {activeTab === 'timeline' && <Timeline milestones={milestones} project={project} />}
                {activeTab === 'discussions' && <DiscussionBoard projectId={projectId} />}
                {activeTab === 'activity' && <ActivityFeed projectId={projectId} />}
                {activeTab === 'overview' && (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Project info */}
                            <Card className="lg:col-span-2">
                                <SectionHeader title="Project DNA" />
                                <div className="space-y-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Description</label>
                                        <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{project.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            ['Start Date', project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'],
                                            ['Target Date', project.due_date ? new Date(project.due_date).toLocaleDateString() : 'TBD'],
                                            ['Health', project.health.toUpperCase()],
                                            ['Status', project.status.toUpperCase()],
                                        ].map(([k, v]) => (
                                            <div key={k} className="space-y-1">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{k}</div>
                                                <div className="text-xs font-black text-white">{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Team */}
                            <div className="space-y-6">
                                <Card>
                                    <SectionHeader title="Active Members" badge={project.members?.length} />
                                    <div className="space-y-3 mt-4">
                                        {(project.members || []).map(m => (
                                            <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                <Avatar user={m.user} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white truncate">{m.user?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{m.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(project.members || []).length === 0 && <p className="text-[10px] text-slate-500 font-bold uppercase italic text-center py-4">No team members assigned</p>}
                                    </div>
                                </Card>
                            </div>

                            {/* Risks */}
                            {riskData && riskData.risks?.length > 0 && (
                                <Card className="lg:col-span-3 border-rose-500/20 bg-rose-500/[0.02]">
                                    <SectionHeader title="High-Risk Intelligence" badge={`${riskData.risk_count} threats identified`} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {riskData.risks.map((r, i) => (
                                            <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all
                                                ${r.level === 'high' ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]' :
                                                    r.level === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                                                        'bg-white/5 border-white/5'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                                                    ${r.level === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    !
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-white text-xs uppercase tracking-tight mb-1">{r.task_title}</p>
                                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{r.reason}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export { TaskModal, TaskBoard, TaskCard }
export default ProjectDetail
