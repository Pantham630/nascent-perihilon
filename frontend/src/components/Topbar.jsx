import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search, Settings2, Moon, Sun, X, ExternalLink, Briefcase, ListChecks, Users } from 'lucide-react'
import { useApp } from '../stores/AppContext'
import * as api from '../lib/api'
import { Avatar } from './ui/index.jsx'
import { motion, AnimatePresence } from 'framer-motion'

function Topbar({ title, subtitle, onNavigate, onProjectClick, action }) {
    const { currentUser, notifications, unreadCount, markRead, loadNotifications } = useApp()
    const [showNotifs, setShowNotifs] = useState(false)
    const [theme, setTheme] = useState('dark')

    // Search State
    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState({ projects: [], tasks: [], people: [] })
    const [showResults, setShowResults] = useState(false)
    const searchRef = useRef(null)

    const handleMarkRead = async () => {
        if (!currentUser) return
        await api.markNotificationsRead(currentUser.id)
        await loadNotifications()
    }

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true)
                try {
                    const data = await api.globalSearch(query)
                    setResults(data)
                    setShowResults(true)
                } catch (err) {
                    console.error('Search failed', err)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setResults({ projects: [], tasks: [], people: [] })
                setShowResults(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    // Close results on click outside
    useEffect(() => {
        const clickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', clickOutside)
        return () => document.removeEventListener('mousedown', clickOutside)
    }, [])

    const handleResultClick = (type, item) => {
        setShowResults(false)
        setQuery('')
        if (type === 'projects') onProjectClick(item.id)
        if (type === 'people') onNavigate('people')
        if (type === 'tasks') {
            onProjectClick(item.project_id)
        }
    }

    return (
        <header className="topbar">
            {/* Title & Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-white tracking-tight uppercase truncate">{title}</h1>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{subtitle || 'Live'}</span>
                </div>
            </div>

            {/* Global Search Hub */}
            <div className="relative group flex-1 max-w-lg mx-8" ref={searchRef}>
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${query ? 'text-blue-400' : 'text-slate-500'}`} size={16} />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && setShowResults(true)}
                        className="w-full bg-white/5 border border-white/5 text-white pl-11 pr-11 py-3 rounded-2xl text-xs outline-none focus:border-blue-500/30 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/5 transition-all font-bold placeholder:text-slate-600 shadow-inner"
                        placeholder="Search for projects, tasks, or team members..."
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {showResults && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-14 left-0 right-0 glass-card bg-[#020617]/95 border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] p-2"
                        >
                            {isSearching ? (
                                <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Searching Intelligence...</div>
                            ) : (Object.values(results).every(r => r.length === 0)) ? (
                                <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">No matches found</div>
                            ) : (
                                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Projects */}
                                    {results.projects.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-4 py-2 text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                <Briefcase size={10} /> Projects
                                            </div>
                                            {results.projects.map(p => (
                                                <button key={p.id} onClick={() => handleResultClick('projects', p)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all flex items-center gap-4 group">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all font-bold text-xs">{p.name[0]}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{p.name}</div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-tighter">
                                                            <span>{p.client_name || 'Internal'}</span>
                                                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                                                            <span>{Math.round(p.completion_pct)}% Complete</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tasks */}
                                    {results.tasks.length > 0 && (
                                        <div className="mb-4">
                                            <div className="px-4 py-2 text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                <ListChecks size={10} /> Tasks
                                            </div>
                                            {results.tasks.map(t => (
                                                <button key={t.id} onClick={() => handleResultClick('tasks', t)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all flex items-center gap-4 group">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all font-bold text-[8px]">{t.task_uid}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{t.title}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Status: {t.status}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* People */}
                                    {results.people.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                <Users size={10} /> People
                                            </div>
                                            {results.people.map(u => (
                                                <button key={u.id} onClick={() => handleResultClick('people', u)} className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-all flex items-center gap-4 group">
                                                    <Avatar user={u} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{u.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{u.role}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {action}
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markRead() }}
                        className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${showNotifs ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-glow' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifs && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: -20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-12 w-80 glass-card bg-[#020617]/95 border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in p-1"
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">Team Updates</span>
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkRead} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase transition-colors">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-10 opacity-30 text-xs font-bold uppercase tracking-widest">No notifications</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className="p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all mb-1 group">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-700'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">{n.title}</p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                                                        <p className="text-[8px] text-slate-600 mt-2 font-black uppercase tracking-tighter">{new Date(n.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <div className="text-[11px] font-black text-white uppercase tracking-tighter">{currentUser?.name}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser?.role}</div>
                    </div>
                    <Avatar user={currentUser} size="md" className="ring-2 ring-blue-500/20" />
                </div>
            </div>
        </header>
    )
}

export default Topbar
