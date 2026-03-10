import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000/tickets'

function TicketModal({ ticket, onClose, onSave, onDelete, refreshTickets }) {
    const [title, setTitle] = useState(ticket?.title || '')
    const [description, setDescription] = useState(ticket?.description || '')
    const [priority, setPriority] = useState(ticket?.priority || 'medium')
    const [status, setStatus] = useState(ticket?.status || 'todo')
    const [deadline, setDeadline] = useState(
        ticket?.deadline ? new Date(ticket.deadline).toISOString().slice(0, 16) : ''
    )
    const [assigneeEmail, setAssigneeEmail] = useState(ticket?.assignee_email || '')
    const [assigneeName, setAssigneeName] = useState(ticket?.assignee_name || '')
    const [tagsText, setTagsText] = useState(ticket?.tags ? JSON.parse(ticket.tags).join(', ') : '')

    // Sub-items
    const [todos, setTodos] = useState(ticket?.todos || [])
    const [newTodoText, setNewTodoText] = useState('')
    const [comments, setComments] = useState(ticket?.comments || [])
    const [newComment, setNewComment] = useState('')
    const [activityLogs, setActivityLogs] = useState(ticket?.activity_logs || [])

    // UI state
    const [activeTab, setActiveTab] = useState('details') // details, activity, comments

    const handleSave = () => {
        if (!title.trim()) return

        let tags = []
        try {
            tags = tagsText.split(',').map(t => t.trim()).filter(t => t !== '')
        } catch (e) {
            tags = []
        }

        onSave({
            title,
            description,
            priority,
            status,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            assignee_email: assigneeEmail || null,
            assignee_name: assigneeName || null,
            tags: JSON.stringify(tags)
        })
    }

    const handleAddTodo = async () => {
        if (!newTodoText.trim() || !ticket) return
        try {
            const res = await fetch(`${API_BASE}/${ticket.id}/todos/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: newTodoText, is_completed: false })
            })
            const added = await res.json()
            setTodos([...todos, added])
            setNewTodoText('')
            refreshTickets()
        } catch (err) { console.error(err) }
    }

    const handleToggleTodo = async (todoId, current) => {
        try {
            await fetch(`${API_BASE}/todos/${todoId}?is_completed=${!current}`, { method: 'PUT' })
            setTodos(todos.map(t => t.id === todoId ? { ...t, is_completed: !current } : t))
            refreshTickets()
        } catch (err) { console.error(err) }
    }

    const handleDeleteTodo = async (todoId) => {
        try {
            await fetch(`${API_BASE}/todos/${todoId}`, { method: 'DELETE' })
            setTodos(todos.filter(t => t.id !== todoId))
            refreshTickets()
        } catch (err) { console.error(err) }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !ticket) return
        try {
            const res = await fetch(`${API_BASE}/${ticket.id}/comments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: newComment, author: 'You' })
            })
            const added = await res.json()
            setComments([...comments, added])
            setNewComment('')
            refreshTickets()
        } catch (err) { console.error(err) }
    }

    const handleDeleteTicket = async () => {
        if (!ticket || !confirm('Delete this ticket?')) return
        try {
            await fetch(`${API_BASE}/${ticket.id}`, { method: 'DELETE' })
            onClose()
            onDelete && onDelete()
            refreshTickets()
        } catch (err) { console.error(err) }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-row">
                        <h2 className="modal-title">
                            {ticket ? (
                                <><span className="id-badge">{ticket.ticket_uid}</span> Edit Ticket</>
                            ) : '✦ New Ticket'}
                        </h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Tab Navigation */}
                {ticket && (
                    <div className="modal-tabs">
                        <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
                        <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                            Comments {comments.length > 0 && <span className="tab-count">{comments.length}</span>}
                        </button>
                        <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</button>
                    </div>
                )}

                <div className="modal-body-scroll">
                    {activeTab === 'details' && (
                        <div className="tab-pane">
                            {/* Title */}
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" className="form-control" value={title}
                                    onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows="3" value={description}
                                    onChange={e => setDescription(e.target.value)} placeholder="Add context or details…" />
                            </div>

                            {/* Tags */}
                            <div className="form-group">
                                <label>Tags (comma separated)</label>
                                <input type="text" className="form-control" value={tagsText}
                                    onChange={e => setTagsText(e.target.value)} placeholder="frontend, bug, urgent" />
                            </div>

                            {/* Priority + Status */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select className="form-control" value={priority} onChange={e => setPriority(e.target.value)}>
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                                        <option value="todo">⏸ To Do</option>
                                        <option value="in_progress">⚡ In Progress</option>
                                        <option value="done">✅ Done</option>
                                    </select>
                                </div>
                            </div>

                            {/* Assignee Info */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>👤 Assignee Name</label>
                                    <input type="text" className="form-control" value={assigneeName}
                                        onChange={e => setAssigneeName(e.target.value)} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label>📧 Assignee Email</label>
                                    <input type="email" className="form-control" value={assigneeEmail}
                                        onChange={e => setAssigneeEmail(e.target.value)} placeholder="name@example.com" />
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="form-group">
                                <label>📅 Deadline</label>
                                <input type="datetime-local" className="form-control" value={deadline}
                                    onChange={e => setDeadline(e.target.value)} />
                            </div>

                            {/* Sub-tasks */}
                            <div className="divider" />
                            <div className="todo-label">Sub-tasks</div>
                            <div className="todo-list">
                                {todos.map(todo => (
                                    <div key={todo.id} className="todo-item">
                                        <input type="checkbox" checked={todo.is_completed}
                                            onChange={() => handleToggleTodo(todo.id, todo.is_completed)} />
                                        <span className={`todo-text ${todo.is_completed ? 'done' : ''}`}>{todo.task}</span>
                                        <button className="todo-del" onClick={() => handleDeleteTodo(todo.id)}>×</button>
                                    </div>
                                ))}
                                <div className="add-todo-row">
                                    <input type="text" className="form-control" placeholder="Add a sub-task…"
                                        value={newTodoText} onChange={e => setNewTodoText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTodo()} />
                                    <button className="btn-ghost" onClick={handleAddTodo}>Add</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="tab-pane">
                            <div className="comments-list">
                                {comments.length === 0 && <div className="empty-state">No comments yet.</div>}
                                {comments.map(c => (
                                    <div key={c.id} className="comment-bubble">
                                        <div className="comment-header">
                                            <span className="comment-author">{c.author}</span>
                                            <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="comment-body">{c.body}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="add-comment-box">
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleAddComment} style={{ marginTop: '0.5rem' }}>Post Comment</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="tab-pane">
                            <div className="activity-timeline">
                                {activityLogs.length === 0 && <div className="empty-state">No activity recorded.</div>}
                                {activityLogs.map(log => (
                                    <div key={log.id} className="activity-item">
                                        <div className="activity-dot" />
                                        <div className="activity-content">
                                            <div className="activity-action">{log.action}</div>
                                            <div className="activity-time">{new Date(log.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    {ticket && (
                        <button className="btn-danger" onClick={handleDeleteTicket}>Delete</button>
                    )}
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>
                        {ticket ? 'Save Changes' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TicketModal
