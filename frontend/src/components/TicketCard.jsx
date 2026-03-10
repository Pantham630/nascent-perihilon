import React, { useState } from 'react'

function getDeadlineInfo(deadline) {
    if (!deadline) return null
    const now = new Date()
    const dl = new Date(deadline)
    const diffH = (dl - now) / 3600000
    if (diffH < 0) return { label: '⚠ Overdue', cls: 'overdue' }
    if (diffH < 24) return { label: `⏰ ${Math.ceil(diffH)}h left`, cls: 'soon' }
    if (diffH < 48) return { label: `🟡 <48h left`, cls: 'soon' }
    return { label: dl.toLocaleDateString(), cls: 'ok' }
}

function ProgressRing({ pct }) {
    const r = 14
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ
    const color = pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b'
    return (
        <svg width="36" height="36" style={{ flexShrink: 0 }}>
            <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(99,140,187,0.15)" strokeWidth="3" />
            <circle
                cx="18" cy="18" r={r} fill="none"
                stroke={color} strokeWidth="3"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
            <text x="18" y="22" textAnchor="middle" fontSize="8" fill={color} fontWeight="700">
                {pct}%
            </text>
        </svg>
    )
}

function TicketCard({ ticket, onCopyId }) {
    const [copied, setCopied] = useState(false)
    const completedTodos = ticket.todos?.filter(t => t.is_completed).length || 0
    const totalTodos = ticket.todos?.length || 0
    const pct = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : null
    const dl = getDeadlineInfo(ticket.deadline)
    const tags = ticket.tags ? JSON.parse(ticket.tags) : []

    const handleCopy = (e) => {
        e.stopPropagation()
        const uid = ticket.ticket_uid || `#${ticket.id}`
        navigator.clipboard.writeText(uid)
        setCopied(true)
        onCopyId && onCopyId(uid)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className={`ticket-card priority-${ticket.priority}`}>
            {/* Header row: UID + priority badge */}
            <div className="ticket-uid-row">
                <button
                    className={`ticket-uid-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                    title="Click to copy ID"
                >
                    {copied ? '✅ Copied!' : (ticket.ticket_uid || `#${ticket.id}`)}
                </button>
                <span className={`priority-badge priority-${ticket.priority}`}>{ticket.priority}</span>
                {pct !== null && <ProgressRing pct={pct} />}
            </div>

            {/* Title */}
            <h4 className="ticket-title">{ticket.title}</h4>

            {ticket.description && (
                <p className="ticket-desc">{ticket.description}</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div className="ticket-tags">
                    {tags.map(tag => (
                        <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                </div>
            )}

            {/* Meta row */}
            <div className="ticket-meta">
                {dl && (
                    <span className={`meta-chip deadline-chip ${dl.cls}`}>{dl.label}</span>
                )}
                {ticket.assignee_name && (
                    <span className="meta-chip assignee-chip">
                        <span className="assignee-avatar">{ticket.assignee_name.charAt(0).toUpperCase()}</span>
                        {ticket.assignee_name}
                    </span>
                )}
                {!ticket.assignee_name && ticket.assignee_email && (
                    <span className="meta-chip">
                        👤 {ticket.assignee_email.split('@')[0]}
                    </span>
                )}
                {ticket.comments?.length > 0 && (
                    <span className="meta-chip">
                        💬 {ticket.comments.length}
                    </span>
                )}
                {totalTodos > 0 && (
                    <span className="meta-chip todos-chip">
                        ☑ {completedTodos}/{totalTodos}
                    </span>
                )}
            </div>
        </div>
    )
}

export default TicketCard
