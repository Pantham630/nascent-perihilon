import React, { useState, useEffect } from 'react'

function ToastItem({ toast, onRemove }) {
    const [visible, setVisible] = useState(false)
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true))
        const tid = setTimeout(() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }, toast.duration || 3200)
        return () => clearTimeout(tid)
    }, [])

    const borderColors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' }

    return (
        <div onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl cursor-pointer border transition-all duration-300 min-w-[240px] max-w-xs
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}
            style={{
                background: '#121f35',
                borderColor: `rgba(99,140,187,0.25)`,
                borderLeft: `3px solid ${borderColors[toast.type] || borderColors.info}`
            }}>
            <span className="text-base flex-shrink-0">{icons[toast.type] || icons.info}</span>
            <span className="text-sm text-[#f0f6ff] font-medium flex-1">{toast.message}</span>
            <button className="text-[#4d6480] hover:text-white text-lg leading-none flex-shrink-0">×</button>
        </div>
    )
}

function Toast({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onRemove={removeToast} />
                </div>
            ))}
        </div>
    )
}

export default Toast
