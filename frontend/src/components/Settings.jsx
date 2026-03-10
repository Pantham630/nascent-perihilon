import React, { useState } from 'react'
import * as api from '../lib/api'
import { Card, Button, SectionHeader, Avatar, Input, Select, Modal, Textarea, EmptyState } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'

function Settings() {
    const { users, currentUser, loadUsers, addToast } = useApp()
    const [showAddUser, setShowAddUser] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', role: 'member' })
    const [saving, setSaving] = useState(false)

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const handleAddUser = async () => {
        if (!form.name.trim() || !form.email.trim()) { addToast('Name and email required', 'error'); return }
        setSaving(true)
        try {
            await api.createUser(form)
            await loadUsers()
            setShowAddUser(false)
            setForm({ name: '', email: '', role: 'member' })
            addToast(`User "${form.name}" added!`, 'success')
        } catch (err) {
            addToast(`Failed: ${err.message}`, 'error')
        } finally { setSaving(false) }
    }

    const ROLE_COLORS = {
        admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        pm: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        member: 'text-green-400 bg-green-500/10 border-green-500/30',
        client: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="max-w-2xl">
                <Card className="mb-4">
                    <SectionHeader title="Team Members" badge={users.length}
                        action={<Button onClick={() => setShowAddUser(true)}>＋ Add User</Button>} />
                    <div className="flex flex-col divide-y divide-[rgba(99,140,187,0.08)]">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center gap-3 py-3">
                                <Avatar user={u} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#f0f6ff] flex items-center gap-2">
                                        {u.name}
                                        {u.id === currentUser?.id && <span className="text-[9px] text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full uppercase">You</span>}
                                    </div>
                                    <div className="text-xs text-[#4d6480]">{u.email}</div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role] || ''}`}>
                                    {u.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="mb-4">
                    <SectionHeader title="Platform Info" />
                    <div className="flex flex-col gap-2 text-sm text-[#8da4bf]">
                        {[
                            ['Platform', 'LaunchPad v3.0'],
                            ['Database', 'PostgreSQL (local Docker)'],
                            ['Backend', 'FastAPI (Python)'],
                            ['Frontend', 'React 18 + Tailwind CSS + Vite'],
                            ['Polling', '30s auto-refresh on all pages'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                                <span className="text-[#4d6480] w-28 flex-shrink-0 text-xs">{k}</span>
                                <span className="text-[#8da4bf] text-xs">{v}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <SectionHeader title="Role Permissions" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-[#4d6480] uppercase tracking-wider">
                                    <th className="text-left pb-2">Action</th>
                                    {['Admin', 'PM', 'Member', 'Client'].map(r => <th key={r} className="pb-2">{r}</th>)}
                                </tr>
                            </thead>
                            <tbody className="text-[#8da4bf]">
                                {[
                                    ['Create Project', true, true, false, false],
                                    ['Edit Project', true, true, false, false],
                                    ['Create Task', true, true, true, false],
                                    ['Edit Task', true, true, true, false],
                                    ['View Progress', true, true, true, true],
                                    ['Upload Documents', true, true, true, true],
                                    ['Manage Users', true, false, false, false],
                                ].map(([action, ...perms]) => (
                                    <tr key={action} className="border-t border-[rgba(99,140,187,0.07)]">
                                        <td className="py-1.5">{action}</td>
                                        {perms.map((p, i) => (
                                            <td key={i} className="text-center">{p ? '✅' : '—'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {showAddUser && (
                <Modal title="Add Team Member" onClose={() => setShowAddUser(false)}>
                    <div className="px-6 py-4 flex flex-col gap-4">
                        <Input label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" autoFocus />
                        <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" />
                        <Select label="Role" value={form.role} onChange={e => set('role', e.target.value)}>
                            <option value="member">Member</option>
                            <option value="pm">Project Manager</option>
                            <option value="admin">Admin</option>
                            <option value="client">Client</option>
                        </Select>
                    </div>
                    <div className="px-6 py-3 border-t border-[rgba(99,140,187,0.1)] flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowAddUser(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={saving}>{saving ? 'Adding…' : 'Add Member'}</Button>
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default Settings
