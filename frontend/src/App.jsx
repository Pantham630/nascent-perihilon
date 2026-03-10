import React, { useState, Component } from 'react'
import { AppProvider, useApp } from './stores/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import ProjectsList from './components/ProjectsList'
import ProjectDetail from './components/ProjectDetail'
import People from './components/People'
import ClientPortal from './components/ClientPortal'
import Settings from './components/Settings'
import Profile from './components/Profile'
import Toast from './components/Toast'
import Login from './pages/Login'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle } from 'lucide-react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("React Error Boundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-slate-200">
                    <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-red-500/30">
                        <div className="flex items-center gap-4 mb-6 text-red-400">
                            <AlertTriangle size={32} />
                            <h1 className="text-2xl font-black uppercase tracking-widest">Application Crash</h1>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto text-red-300 border border-red-500/10">
                            {this.state.error && this.state.error.toString()}
                        </div>
                        <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-400 border border-slate-700">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Protected Route Wrapper ───────────────────────────────────────
function ProtectedRoute({ children }) {
    const { currentUser, globalLoading } = useApp()

    if (globalLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center font-inter text-slate-200">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 mb-6 shadow-[0_0_40px_rgba(37,99,235,0.2)]"
                >
                    <Shield className="text-blue-500" size={40} />
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Secure Tunnel...</p>
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1/2 h-full bg-blue-600 shadow-[0_0_10px_#2563eb]"
                        />
                    </div>
                </div>
            </div>
        )
    }

    if (!currentUser) {
        return <Login />
    }

    return children
}

function AppContent() {
    const [view, setView] = useState('dashboard')
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const [selectedUserId, setSelectedUserId] = useState(null)
    const { currentUser, toasts, removeToast } = useApp()

    const handleSelectProject = (projectId) => {
        setSelectedProjectId(projectId)
        setView('project_detail')
    }

    const handleSelectUser = (userId) => {
        setSelectedUserId(userId)
        setView('profile')
    }

    // Reset IDs when navigating away via Sidebar
    const handleViewChange = (newView) => {
        if (newView !== 'project_detail') setSelectedProjectId(null)
        if (newView !== 'profile') setSelectedUserId(null)
        setView(newView)
    }

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-inter">
                <Sidebar activeView={view} setView={handleViewChange} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 relative">
                        <AnimatePresence mode="wait">
                            {view === 'dashboard' && (
                                <motion.div
                                    key="dash"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <Dashboard onSelectProject={handleSelectProject} />
                                </motion.div>
                            )}
                            {view === 'projects' && (
                                <motion.div
                                    key="list"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <ProjectsList onSelectProject={handleSelectProject} />
                                </motion.div>
                            )}
                            {view === 'project_detail' && (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <ProjectDetail projectId={selectedProjectId} onBack={() => handleViewChange('projects')} />
                                </motion.div>
                            )}
                            {view === 'people' && (
                                <motion.div
                                    key="people"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <People onSelectUser={handleSelectUser} />
                                </motion.div>
                            )}
                            {view === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <Profile userId={selectedUserId || currentUser?.id} onBack={() => handleViewChange('people')} />
                                </motion.div>
                            )}
                            {view === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <Settings />
                                </motion.div>
                            )}
                            {view === 'portal' && (
                                <motion.div
                                    key="portal"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="h-full"
                                >
                                    <ClientPortal />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
                <Toast toasts={toasts} removeToast={removeToast} />
            </div>
        </ProtectedRoute>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </ErrorBoundary>
    )
}
