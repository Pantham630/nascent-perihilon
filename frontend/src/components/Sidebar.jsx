import React, { useState } from 'react'
import { useApp } from '../stores/AppContext'
import { Avatar } from './ui/index.jsx'
import {
    LayoutDashboard, Briefcase, Users, Globe, Settings as SettingsIcon,
    ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: Briefcase, label: 'Projects' },
    { id: 'people', icon: Users, label: 'People' },
    { id: 'portal', icon: Globe, label: 'Client Portal' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
]

function Sidebar({ currentPage, setCurrentPage }) {
    const { currentUser, setCurrentUser, users, unreadCount } = useApp()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-72'} flex-shrink-0 sidebar transition-all duration-300`}>
            {/* Header */}
            <div className="sidebar-header overflow-hidden">
                <div className="brand-logo">
                    <div className="brand-icon">
                        <Zap size={22} fill="white" className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 animate-in">
                            <div className="brand-name font-black text-white">LAUNCHPAD</div>
                            <div className="brand-sub">Platform v1.0</div>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <button className="create-btn animate-in group">
                        <span className="group-hover:rotate-90 transition-transform duration-300 font-bold">＋</span>
                        Create Project
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-section-label tracking-widest">{collapsed ? 'Nav' : 'Main Menu'}</div>
                <div className="space-y-1">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id)}
                            className={`nav-item w-full ${currentPage === item.id ? 'active' : ''}`}
                            title={collapsed ? item.label : ''}
                        >
                            <item.icon size={20} className={currentPage === item.id ? 'text-blue-400' : 'text-slate-500'} />
                            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                            {!collapsed && item.id === 'portal' && unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            {/* User Switcher */}
            {!collapsed && users.length > 0 && (
                <div className="px-5 py-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Internal Team</div>
                    <div className="space-y-1">
                        {users.slice(0, 3).map(u => (
                            <button
                                key={u.id}
                                onClick={() => setCurrentUser(u)}
                                className={`flex items-center gap-3 w-full p-2 rounded-lg transition-all text-xs border border-transparent
                                    ${currentUser?.id === u.id ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                <Avatar user={u} size="sm" />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="truncate font-bold tracking-tight">{u.name}</div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{u.role}</div>
                                </div>
                                {currentUser?.id === u.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="sidebar-footer flex items-center justify-between mt-auto">
                <span className="opacity-50 text-[10px] font-bold tracking-widest uppercase">v1.2.0</span>
                <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-slate-500 hover:text-white">
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
