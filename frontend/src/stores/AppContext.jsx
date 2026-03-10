import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import * as api from '../lib/api'

const AppContext = createContext(null)

let _toastId = 0

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [users, setUsers] = useState([])
    const [toasts, setToasts] = useState([])
    const [notifications, setNotifications] = useState([])
    const [globalLoading, setGlobalLoading] = useState(true)

    const addToast = useCallback((message, type = 'success', duration = 3200) => {
        const id = ++_toastId
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('launchpad_token')
        setCurrentUser(null)
    }, [])

    const loadMe = useCallback(async () => {
        const token = localStorage.getItem('launchpad_token')
        if (!token) {
            setGlobalLoading(false)
            return
        }
        try {
            const user = await api.getMe()
            setCurrentUser(user)
        } catch (err) {
            console.error('Auth check failed:', err)
            logout()
        } finally {
            setGlobalLoading(false)
        }
    }, [logout])

    const loadUsers = useCallback(async () => {
        try {
            const data = await api.getUsers()
            setUsers(data)
        } catch (err) {
            console.error('Failed to load users:', err)
        }
    }, [])

    const login = useCallback(async (email, password) => {
        try {
            const { access_token } = await api.login(email, password)
            localStorage.setItem('launchpad_token', access_token)
            const user = await api.getMe()
            setCurrentUser(user)
            addToast(`Welcome back, ${user.name}!`)
            return user
        } catch (err) {
            addToast(err.message, 'error')
            throw err
        }
    }, [addToast])

    const loadNotifications = useCallback(async () => {
        if (!currentUser) return
        try {
            const data = await api.getNotifications(currentUser.id)
            setNotifications(data)
        } catch (err) {
            console.error('Failed to load notifications:', err)
        }
    }, [currentUser])

    useEffect(() => {
        loadMe()
        loadUsers()
        const handleAuthFail = () => logout()
        window.addEventListener('auth_fail', handleAuthFail)
        return () => window.removeEventListener('auth_fail', handleAuthFail)
    }, [loadMe, loadUsers, logout])

    useEffect(() => {
        if (currentUser) {
            loadNotifications()
            const interval = setInterval(loadNotifications, 30000)
            return () => clearInterval(interval)
        }
    }, [currentUser, loadNotifications])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <AppContext.Provider value={{
            currentUser, setCurrentUser, login, logout,
            users, loadUsers,
            toasts, addToast, removeToast,
            notifications, loadNotifications, unreadCount,
            globalLoading, setGlobalLoading,
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = () => useContext(AppContext)
