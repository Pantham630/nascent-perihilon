import React, { useState, useEffect } from 'react'
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

const PAGE_TITLES = {
    dashboard: { title: 'Dashboard', subtitle: 'Project health at a glance' },
    projects: { title: 'Projects', subtitle: 'Manage your delivery portfolio' },
    project_detail: { title: 'Project Detail', subtitle: 'Tasks, milestones, and activity' },
    people: { title: 'People', subtitle: 'Team workload & capacity' },
    portal: { title: 'Client Portal', subtitle: 'Client-facing project progress' },
    settings: { title: 'Settings', subtitle: 'Team, roles, and configuration' },
    profile: { title: 'User Profile', subtitle: 'Workload & Task Insights' },
}

import { motion, AnimatePresence } from 'framer-motion'

const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 10, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

function AppShell() {
    const { toasts, removeToast } = useApp()
    const [currentPage, setCurrentPage] = useState('dashboard')
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const [selectedUserId, setSelectedUserId] = useState(null)

    const handleProjectClick = (id) => {
        setSelectedProjectId(id)
        setCurrentPage('project_detail')
    }

    const { title, subtitle } = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard

    return (
        <div className="flex h-screen bg-[#020617] font-sans text-slate-200 overflow-hidden">
            <Sidebar currentPage={currentPage} setCurrentPage={(page) => {
                setCurrentPage(page)
                if (page !== 'project_detail') setSelectedProjectId(null)
                if (page !== 'profile') setSelectedUserId(null)
            }} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background decorative blob */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

                <Topbar
                    title={title}
                    subtitle={subtitle}
                    onNavigate={setCurrentPage}
                    onProjectClick={handleProjectClick}
                />

                <main className="flex-1 overflow-hidden flex flex-col relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage + (selectedProjectId || '')}
                            variants={PAGE_VARIANTS}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            {currentPage === 'dashboard' && (
                                <Dashboard setCurrentPage={setCurrentPage} setSelectedProjectId={setSelectedProjectId} />
                            )}
                            {currentPage === 'projects' && (
                                <ProjectsList onProjectClick={handleProjectClick} />
                            )}
                            {currentPage === 'project_detail' && selectedProjectId && (
                                <ProjectDetail
                                    projectId={selectedProjectId}
                                    onBack={() => setCurrentPage('projects')}
                                />
                            )}
                            {currentPage === 'people' && (
                                <People onSelectUser={(id) => { setSelectedUserId(id); setCurrentPage('profile') }} />
                            )}
                            {currentPage === 'portal' && <ClientPortal />}
                            {currentPage === 'settings' && <Settings />}
                            {currentPage === 'profile' && selectedUserId && (
                                <Profile userId={selectedUserId} onBack={() => setCurrentPage('people')} onProjectClick={handleProjectClick} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Toast stack */}
            <Toast toasts={toasts} removeToast={removeToast} />
        </div>
    )
}

function App() {
    return (
        <AppProvider>
            <AppShell />
        </AppProvider>
    )
}

export default App
