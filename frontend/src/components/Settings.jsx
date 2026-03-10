import React, { useState } from 'react'
import * as api from '../lib/api'
import { Card, Button, SectionHeader, Avatar, Input, Select, Modal, Spinner } from './ui/index.jsx'
import { useApp } from '../stores/AppContext'
import { Shield, Users, Server, Zap, ShieldCheck, Mail, UserPlus, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Settings() {
    const { users, currentUser, loadUsers, addToast } = useApp()
    const [showAddUser, setShowAddUser] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', role: 'member', password: 'Password123' })
    const [saving, setSaving] = useState(false)

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const handleAddUser = async () => {
        if (!form.name.trim() || !form.email.trim()) { addToast('Name and email required', 'error'); return }
        setSaving(true)
        try {
            await api.createUser(form)
            await loadUsers()
            setShowAddUser(false)
            setForm({ name: '', email: '', role: 'member', password: 'Password123' })
            addToast(`User "${form.name}" added!`, 'success')
        } catch (err) {
            addToast(`Failed: ${err.message}`, 'error')
        } finally { setSaving(false) }
    }

    const ROLE_COLORS = {
        admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
        pm: 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]',
        member: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        client: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    }

    const isAdmin = currentUser?.role === 'admin'

    return (
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-transparent space-y-8 custom-scrollbar font-inter">
            {/* Header section with Stats Overlay */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Control Center</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Global Protocol & User Protocols</p>
                    </div>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => setShowAddUser(true)}
                        className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
                    >
                        <UserPlus size={16} className="mr-2" /> Provision New User
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Members List */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-white/10 bg-white/[0.02] overflow-hidden">
                        <SectionHeader
                            title="Authorized Personnel"
                            badge={`${users.length} Active`}
                            icon={<Users size={16} />}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 pt-0">
                            {users.map((u, idx) => (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group"
                                >
                                    <Avatar user={u} size="md" className="ring-2 ring-white/5 shadow-lg" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                            {u.name}
                                            {u.id === currentUser?.id && <span className="text-[8px] bg-blue-600/20 text-blue-400 border border-blue-500/40 px-1.5 py-0.5 rounded-full uppercase font-black">Local</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-tighter">
                                            <Mail size={10} /> {u.email}
                                        </div>
                                    </div>
                                    <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border tracking-widest ${ROLE_COLORS[u.role]}`}>
                                        {u.role}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* Permissions Matrix */}
                    <Card className="border-white/10 bg-white/[0.02]">
                        <SectionHeader title="Authorization Protocols" icon={<ShieldCheck size={16} />} />
                        <div className="px-6 pb-6 overflow-x-auto">
                            <table className="w-full text-[10px] font-bold uppercase tracking-widest">
                                <thead>
                                    <tr className="text-slate-600">
                                        <th className="text-left pb-4 pl-2">Security Level</th>
                                        {['Admin', 'PM', 'Member', 'Client'].map(r => <th key={r} className="pb-4">{r}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="text-slate-400">
                                    {[
                                        ['System Architecture', true, true, false, false],
                                        ['Resource Deployment', true, true, false, false],
                                        ['Mission Creation', true, true, true, false],
                                        ['Data Modification', true, true, true, false],
                                        ['Intelligence Access', true, true, true, true],
                                        ['Encrypted Uploads', true, true, true, true],
                                        ['User Provisioning', true, false, false, false],
                                    ].map(([action, ...perms]) => (
                                        <tr key={action} className="border-t border-white/5 group hover:bg-white/[0.01] transition-colors">
                                            <td className="py-4 pl-2 text-white group-hover:text-blue-400 transition-colors">{action}</td>
                                            {perms.map((p, i) => (
                                                <td key={i} className="text-center py-4">
                                                    {p ? <Zap size={10} fill="currentColor" className="text-blue-500 mx-auto" /> : <div className="w-1 h-1 bg-slate-800 rounded-full mx-auto" />}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Info & Secondary Ops */}
                <div className="space-y-8">
                    <Card className="border-white/10 bg-white/[0.02]">
                        <SectionHeader title="System Architecture" icon={<Server size={16} />} />
                        <div className="p-6 pt-0 space-y-4">
                            {[
                                ['Project Base', 'LaunchPad v1.4'],
                                ['Infrastructure', 'FastAPI Pulse'],
                                ['UI Core', 'Vite 5.0 / React 18'],
                                ['Styling', 'Tailwind / Glass 2.0'],
                                ['Sync Rate', '30s Refresh Cycle'],
                                ['Encryption', 'JWT / SHA-256'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                    <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{k}</span>
                                    <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" /> {v}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-red-500/10 bg-red-500/[0.02]">
                        <SectionHeader title="Danger Zone" icon={<Info size={16} className="text-red-500" />} />
                        <div className="p-6 pt-0 space-y-4">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                Irreversible actions that modify the core system integrity or delete active project data.
                            </p>
                            <Button variant="ghost" className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 h-10 text-[9px] font-black uppercase tracking-widest">
                                Self-Destruct Metadata
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal for Provisioning */}
            <AnimatePresence>
                {showAddUser && (
                    <Modal title="Provision New Authorized ID" onClose={() => setShowAddUser(false)}>
                        <div className="px-8 py-6 space-y-6">
                            <Input
                                label="Operational Name *"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="e.g., COMMANDER SHEPARD"
                                autoFocus
                            />
                            <Input
                                label="Secure Identifier (Email) *"
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="id@citadel.com"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Access Clearance" value={form.role} onChange={e => set('role', e.target.value)}>
                                    <option value="member">MEMBER</option>
                                    <option value="pm">PROJECT MANAGER</option>
                                    <option value="admin">ADMINISTRATOR</option>
                                    <option value="client">EXTERNAL CLIENT</option>
                                </Select>
                                <Input
                                    label="Security Sequence *"
                                    type="password"
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="px-8 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3 rounded-b-3xl">
                            <Button variant="ghost" onClick={() => setShowAddUser(false)} className="h-10 text-[10px]">Terminate</Button>
                            <Button onClick={handleAddUser} disabled={saving} className="h-10 text-[10px] px-8">
                                {saving ? <Spinner size="xs" /> : 'Confirm Provisioning'}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Settings
