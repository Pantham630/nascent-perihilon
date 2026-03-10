import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import * as api from '../lib/api'

const AppContext = createContext(null)

let _toastId = 0

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [users, setUsers] = useState([])
    const [toasts, setToasts] = useState([])
    const [notifications, setNotifications] = useState([])
    const [globalLoading, setGlobalLoading] = useState(false)

    const addToast = useCallback((message, type = 'success', duration = 3200) => {
        const id = ++_toastId
        setToasts(prev => [...prev, { id, message, type, duration }])
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const loadUsers = useCallback(async () => {
        try {
            const data = await api.getUsers()
            setUsers(data)
            // Default to first user as "me"
            if (data.length > 0 && !currentUser) {
                setCurrentUser(data[0])
            }
        } catch (err) {
            console.error('Failed to load users:', err)
        }
    }, [currentUser])

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
        loadUsers()
    }, [])

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [loadNotifications])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <AppContext.Provider value={{
            currentUser, setCurrentUser,
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
