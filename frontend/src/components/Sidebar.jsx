import React, { useState } from 'react'
import { useApp } from '../stores/AppContext'
import { Avatar } from './ui/index.jsx'
import {
    LayoutDashboard, Briefcase, Users, Globe, Settings as SettingsIcon,
    ChevronLeft, ChevronRight, Zap, LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'pm', 'member'] },
    { id: 'projects', icon: Briefcase, label: 'Projects', roles: ['admin', 'pm', 'member'] },
    { id: 'people', icon: Users, label: 'People', roles: ['admin', 'pm'] },
    { id: 'portal', icon: Globe, label: 'Client Portal', roles: ['admin', 'pm', 'client'] },
    { id: 'settings', icon: SettingsIcon, label: 'Settings', roles: ['admin'] },
]

function Sidebar({ activeView, setView }) {
    const { currentUser, logout, unreadCount } = useApp()
    const [collapsed, setCollapsed] = useState(false)

    const filteredNav = NAV.filter(item =>
        !item.roles || item.roles.includes(currentUser?.role)
    )

    // Fallback for clients who might only see portal
    const isClient = currentUser?.role === 'client'

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-72'} flex-shrink-0 bg-[#020617] border-r border-white/5 flex flex-col transition-all duration-500 overflow-hidden relative z-50`}>
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="p-6">
                <div className="flex items-center gap-4 mb-8">
                    <motion.div
                        whileHover={{ rotate: 180 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg border border-white/20"
                    >
                        <Zap size={22} fill="white" />
                    </motion.div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex-1"
                        >
                            <div className="text-sm font-black text-white tracking-[0.2em] uppercase">Launch<span className="text-blue-500">Pad</span></div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control v{window.LAUNCHPAD_VERSION || '1.0'}</div>
                        </motion.div>
                    )}
                </div>

                {!collapsed && (currentUser?.role === 'admin' || currentUser?.role === 'pm') && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('projects')}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-all"
                    >
                        <span className="text-lg">＋</span> Create Project
                    </motion.button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-4 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
                    {collapsed ? 'Nav' : 'Main Interface'}
                </div>
                {filteredNav.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`group relative flex items-center gap-4 w-full p-3.5 rounded-xl transition-all duration-300
                            ${activeView === item.id
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]'
                                : 'text-slate-500 hover:bg-white/5 border border-transparent hover:text-slate-300'}`}
                        title={collapsed ? item.label : ''}
                    >
                        {activeView === item.id && (
                            <motion.div
                                layoutId="activeNav"
                                className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                            />
                        )}
                        <item.icon size={20} className={activeView === item.id ? 'text-blue-500' : 'group-hover:text-slate-300 transition-colors'} />
                        {!collapsed && <span className="flex-1 text-left font-bold text-xs uppercase tracking-widest">{item.label}</span>}

                        {!collapsed && item.id === 'portal' && unreadCount > 0 && (
                            <div className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black">
                                {unreadCount}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Footer */}
            <div className="p-4 mt-auto">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar user={currentUser} size="sm" className="ring-2 ring-blue-500/20" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-black text-white truncate uppercase tracking-tighter">{currentUser?.name}</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser?.role}</div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest ${collapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={16} />
                        {!collapsed && <span>System Logout</span>}
                    </button>
                </div>

                <div className="flex items-center justify-between px-2 mt-4">
                    {!collapsed && <span className="text-[8px] text-slate-700 font-black uppercase tracking-widest">Protocol 1.4-B</span>}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-all text-slate-500 hover:text-white"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
