import React, { useState } from 'react'
import TicketCard from './TicketCard'

const STATUSES = [
    { id: 'todo', label: 'To Do', dotCls: 'todo' },
    { id: 'in_progress', label: 'In Progress', dotCls: 'in_progress' },
    { id: 'done', label: 'Done', dotCls: 'done' },
]

function KanbanBoard({ tickets, urgentTickets, onTicketClick, onStatusChange, onCopyId }) {
    const [dragOverCol, setDragOverCol] = useState(null)

    const handleDragStart = (e, ticketId) => e.dataTransfer.setData('ticketId', String(ticketId))
    const handleDragOver = (e, statusId) => {
        e.preventDefault()
        setDragOverCol(statusId)
    }
    const handleDragLeave = () => setDragOverCol(null)
    const handleDrop = (e, statusId) => {
        e.preventDefault()
        setDragOverCol(null)
        const id = parseInt(e.dataTransfer.getData('ticketId'), 10)
        if (id) onStatusChange(id, statusId)
    }

    return (
        <div className="board-wrapper">
            <div className="kanban-board">
                {/* Urgent Swimlane */}
                {urgentTickets.length > 0 && (
                    <div className="column" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                        <div className="column-header" style={{ background: 'rgba(239,68,68,0.07)' }}>
                            <div className="column-title-wrap">
                                <div className="column-dot urgent" />
                                <span className="column-title" style={{ color: 'var(--danger)' }}>🔴 Urgent</span>
                            </div>
                            <div className="column-count" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>{urgentTickets.length}</div>
                        </div>
                        <div className="column-content">
                            {urgentTickets.map(ticket => (
                                <div key={ticket.id} onClick={() => onTicketClick(ticket)}>
                                    <TicketCard ticket={ticket} onCopyId={onCopyId} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Regular Kanban Columns */}
                {STATUSES.map(status => {
                    const columnTickets = tickets.filter(t => t.status === status.id)
                    const isDragOver = dragOverCol === status.id
                    return (
                        <div
                            key={status.id}
                            className={`column ${isDragOver ? 'drop-target' : ''}`}
                            onDragOver={e => handleDragOver(e, status.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={e => handleDrop(e, status.id)}
                        >
                            <div className="column-header">
                                <div className="column-title-wrap">
                                    <div className={`column-dot ${status.dotCls}`} />
                                    <span className="column-title">{status.label}</span>
                                </div>
                                <div className="column-count">{columnTickets.length}</div>
                            </div>
                            <div className="column-content">
                                {columnTickets.length === 0 ? (
                                    <div className={`empty-col ${isDragOver ? 'drop-hint' : ''}`}>
                                        <div className="empty-icon">{isDragOver ? '↓' : '○'}</div>
                                        <span>{isDragOver ? 'Drop here' : 'Drop tickets here'}</span>
                                    </div>
                                ) : columnTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, ticket.id)}
                                        onClick={() => onTicketClick(ticket)}
                                    >
                                        <TicketCard ticket={ticket} onCopyId={onCopyId} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default KanbanBoard
