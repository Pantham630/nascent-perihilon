import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { Card, Button, SectionHeader, Badge, ProgressBar, EmptyState, Spinner, Avatar } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'

function ClientPortal({ onProjectClick }) {
    const { addToast } = useApp()
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [tasks, setTasks] = useState([])
    const [milestones, setMilestones] = useState([])
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [clientName, setClientName] = useState('')
    const [uploadName, setUploadName] = useState('')
    const [view, setView] = useState('projects') // 'projects' | 'project'

    const loadProjects = useCallback(async () => {
        try {
            const data = await api.getProjects('active')
            const clientProjects = data.filter(p => p.client_name)
            setProjects(clientProjects)
        } catch (err) {
            addToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    const loadProject = useCallback(async (projId) => {
        try {
            const [ms, ts, docList] = await Promise.all([
                api.getMilestones(projId),
                api.getTasks(projId),
                api.getDocuments(projId),
            ])
            setMilestones(ms)
            setTasks(ts)
            setDocs(docList)
        } catch (err) { }
    }, [])

    useEffect(() => { loadProjects() }, [loadProjects])
    useEffect(() => {
        if (selectedProject) loadProject(selectedProject.id)
    }, [selectedProject, loadProject])

    const handleUpload = async () => {
        if (!uploadName.trim() || !selectedProject) return
        setUploading(true)
        try {
            await api.uploadDocument(selectedProject.id, { filename: uploadName, is_client: true })
            setUploadName('')
            addToast('Document noted!', 'success')
            loadProject(selectedProject.id)
        } catch (err) { addToast('Upload failed', 'error') } finally { setUploading(false) }
    }

    if (view === 'project' && selectedProject) {
        const done = tasks.filter(t => t.status === 'done').length
        const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0, blocked: 0 }
        tasks.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++ })

        return (
            <div className="flex-1 overflow-y-auto px-6 py-5">
                <button onClick={() => { setView('projects'); setSelectedProject(null) }}
                    className="text-[#4d6480] hover:text-white text-sm mb-4 flex items-center gap-1">
                    ← Back to Portal
                </button>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0d1526] to-[#121f35] border border-[rgba(99,140,187,0.15)] rounded-xl p-5 mb-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#f0f6ff] mb-1">{selectedProject.name}</h2>
                            <p className="text-xs text-[#4d6480]">Progress update for your team</p>
                        </div>
                        <Badge type="status" value={selectedProject.status} />
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-[#8da4bf] mb-1">
                            <span>Overall Completion</span>
                            <span className="font-bold">{Math.round(selectedProject.completion_pct)}%</span>
                        </div>
                        <ProgressBar pct={selectedProject.completion_pct} color="#10b981" height={8} />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                        {Object.entries(statusCounts).map(([s, c]) => (
                            <div key={s} className="bg-[#060c1a] rounded-lg py-2">
                                <div className="text-lg font-extrabold text-[#f0f6ff]">{c}</div>
                                <div className="text-[9px] text-[#4d6480] uppercase tracking-wide">{s.replace('_', ' ')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Milestones */}
                    <Card>
                        <SectionHeader title="Milestones" badge={milestones.length} />
                        {milestones.length === 0 && <p className="text-xs text-[#4d6480]">No milestones defined</p>}
                        {milestones.map(ms => {
                            const msTasks = tasks.filter(t => t.milestone_id === ms.id)
                            const msDone = msTasks.filter(t => t.status === 'done').length
                            const pct = msTasks.length ? Math.round(msDone / msTasks.length * 100) : 0
                            return (
                                <div key={ms.id} className="mb-3 last:mb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-[#f0f6ff]">{ms.title}</span>
                                        <span className="text-xs text-[#8da4bf] font-bold">{pct}%</span>
                                    </div>
                                    <ProgressBar pct={pct} height={4} />
                                    <p className="text-xs text-[#4d6480] mt-0.5">{msDone}/{msTasks.length} tasks done</p>
                                </div>
                            )
                        })}
                    </Card>

                    {/* Documents */}
                    <Card>
                        <SectionHeader title="Documents" badge={docs.length} />
                        <div className="flex flex-col gap-2 mb-3 max-h-40 overflow-y-auto">
                            {docs.length === 0 && <p className="text-xs text-[#4d6480]">No documents yet</p>}
                            {docs.map(d => (
                                <div key={d.id} className="flex items-center gap-2 p-2 bg-[#060c1a] rounded-lg border border-[rgba(99,140,187,0.1)]">
                                    <span className="text-sm">{d.mime_type?.includes('pdf') ? '📄' : d.mime_type?.includes('image') ? '🖼' : '📎'}</span>
                                    <span className="flex-1 text-xs text-[#8da4bf] truncate">{d.filename}</span>
                                    {d.is_client_upload && <span className="text-[9px] text-blue-400 border border-blue-500/30 px-1 rounded">CLIENT</span>}
                                </div>
                            ))}
                        </div>
                        {/* Upload area */}
                        <div className="border-t border-[rgba(99,140,187,0.1)] pt-3">
                            <p className="text-xs text-[#4d6480] mb-2">Submit a document:</p>
                            <div className="flex gap-2">
                                <input
                                    value={uploadName} onChange={e => setUploadName(e.target.value)}
                                    placeholder="Filename or reference (e.g. signed-msa.pdf)"
                                    className="flex-1 bg-[#060c1a] border border-[rgba(99,140,187,0.2)] text-[#f0f6ff] rounded-md px-2 py-1.5 text-xs outline-none focus:border-blue-500 placeholder:text-[#4d6480]"
                                />
                                <Button size="sm" onClick={handleUpload} disabled={uploading || !uploadName.trim()}>
                                    {uploading ? '…' : '↑ Submit'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-5">
                <h2 className="text-xl font-extrabold text-[#f0f6ff] mb-1">🌐 Client Portal</h2>
                <p className="text-sm text-[#8da4bf]">View project progress, milestones, and submit documents for your active projects.</p>
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : projects.length === 0 ? (
                <EmptyState icon="🌐" title="No client projects" description="Active projects with client information will appear here." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(p => (
                        <Card key={p.id} onClick={() => { setSelectedProject(p); setView('project') }}
                            className="cursor-pointer hover:border-blue-500/30 hover:shadow-glow transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-[#f0f6ff]">{p.name}</span>
                                <Badge type="health" value={p.health} />
                            </div>
                            <p className="text-xs text-[#4d6480] mb-3">🏢 {p.client_name}</p>
                            <ProgressBar pct={p.completion_pct} color="#3b82f6" height={4} />
                            <div className="flex justify-between text-xs text-[#4d6480] mt-1.5">
                                <span>{Math.round(p.completion_pct)}% complete</span>
                                <span>{p.done_count}/{p.task_count} tasks</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ClientPortal
