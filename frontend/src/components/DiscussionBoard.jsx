import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as api from '../lib/api'
import {
    MessageSquare, Send, Plus, ChevronDown, ChevronUp,
    Reply, AtSign, Paperclip, File, X, Globe, Lock,
    Clock, MoreHorizontal, User
} from 'lucide-react'
import { useApp } from '../stores/AppContext'
import RichText from './ui/RichText.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, Button, Card, Badge, Spinner } from './ui/index.jsx'

function DiscussionBoard({ projectId }) {
    const { currentUser, addToast } = useApp()
    const [threads, setThreads] = useState([])
    const [loading, setLoading] = useState(true)
    const [newThreadTitle, setNewThreadTitle] = useState('')
    const [newThreadBody, setNewThreadBody] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [expandedThread, setExpandedThread] = useState(null)
    const [commentBody, setCommentBody] = useState({})
    const [members, setMembers] = useState([])
    const [showMentions, setShowMentions] = useState({ type: null, id: null })
    const [mentionFilter, setMentionFilter] = useState('')
    const [attachments, setAttachments] = useState({}) // { thread: [], threadId: [] }
    const fileInputRef = useRef(null)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [tData, pData] = await Promise.all([
                api.getThreads(projectId),
                api.getProject(projectId)
            ])
            setThreads(tData)
            setMembers(pData.members || [])
        } catch (err) {
            addToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }, [projectId, addToast])

    useEffect(() => { loadData() }, [loadData])

    const handleCreateThread = async () => {
        if (!newThreadTitle.trim() || !newThreadBody.trim()) {
            addToast('Title and message are required', 'error')
            return
        }
        try {
            let finalBody = newThreadBody
            const threadFiles = attachments['thread'] || []

            // Append attachment links if any
            if (threadFiles.length > 0) {
                finalBody += '\n\n**Attachments:**\n' + threadFiles.map(f => `📎 [${f.name}](file://${f.url})`).join('\n')
            }

            await api.createThread(projectId, {
                title: newThreadTitle,
                body: finalBody,
                created_by: currentUser.id
            })
            setNewThreadTitle('')
            setNewThreadBody('')
            setAttachments(prev => ({ ...prev, thread: [] }))
            setShowCreate(false)
            loadData()
            addToast('Discussion started', 'success')
        } catch (err) {
            addToast('Failed to start discussion', 'error')
        }
    }

    const handleAddComment = async (threadId) => {
        const body = commentBody[threadId]
        if (!body?.trim()) return

        try {
            let finalBody = body
            const commentFiles = attachments[threadId] || []

            if (commentFiles.length > 0) {
                finalBody += '\n\n**Attachments:**\n' + commentFiles.map(f => `📎 [${f.name}](file://${f.url})`).join('\n')
            }

            await api.addThreadComment(projectId, threadId, {
                body: finalBody,
                author_id: currentUser.id,
                author_name: currentUser.name
            })
            setCommentBody(prev => ({ ...prev, [threadId]: '' }))
            setAttachments(prev => ({ ...prev, [threadId]: [] }))
            loadData()
            addToast('Reply posted', 'success')
        } catch (err) {
            addToast('Failed to post reply', 'error')
        }
    }

    const handleFileUpload = async (event, type, id = 'thread') => {
        const file = event.target.files[0]
        if (!file) return

        try {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1]
                const doc = await api.uploadDocument(projectId, {
                    filename: file.name,
                    mime_type: file.type,
                    size_bytes: file.size,
                    uploaded_by: currentUser.id,
                    file_data: base64
                })
                setAttachments(prev => ({
                    ...prev,
                    [id]: [...(prev[id] || []), { name: file.name, url: doc.id }] // assuming doc.id for now
                }))
                addToast('File attached', 'success')
            }
        } catch (err) {
            addToast('Attachment failed', 'error')
        }
    }

    const handleTextareaChange = (value, type, id = null) => {
        if (type === 'thread') setNewThreadBody(value)
        else setCommentBody(prev => ({ ...prev, [id]: value }))

        const lastWord = value.split(/\s/).pop()
        if (lastWord.startsWith('@')) {
            setMentionFilter(lastWord.slice(1))
            setShowMentions({ type, id })
        } else {
            setShowMentions({ type: null, id: null })
        }
    }

    const insertMention = (member, type, id = null) => {
        const value = type === 'thread' ? newThreadBody : commentBody[id]
        const words = value.split(/\s/)
        words.pop()
        const newValue = [...words, `@[${member.user.name}]`].join(' ') + ' '

        if (type === 'thread') setNewThreadBody(newValue)
        else setCommentBody(prev => ({ ...prev, [id]: newValue }))

        setShowMentions({ type: null, id: null })
    }

    const MentionSuggestor = ({ type, id = null }) => {
        const filteredMembers = members.filter(m =>
            m.user.name.toLowerCase().includes(mentionFilter.toLowerCase())
        ).slice(0, 5)

        if (showMentions.type !== type || showMentions.id !== id || filteredMembers.length === 0) return null

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-2 w-64 glass-card bg-[#020617]/95 border-blue-500/30 rounded-xl shadow-2xl overflow-hidden z-[100]"
            >
                <div className="px-3 py-2 border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AtSign size={10} /> Mention Team Member
                </div>
                {filteredMembers.map(m => (
                    <button
                        key={m.id}
                        onClick={() => insertMention(m, type, id)}
                        className="w-full text-left p-2.5 hover:bg-blue-500/10 flex items-center gap-3 group transition-colors"
                    >
                        <Avatar user={m.user} size="xs" />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-blue-400 truncate">{m.user.name}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">{m.role}</div>
                        </div>
                    </button>
                ))}
            </motion.div>
        )
    }

    if (loading) return <div className="p-12 flex justify-center h-full items-center"><Spinner size="lg" /></div>

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent p-6 space-y-8 overflow-y-auto custom-scrollbar font-inter">
            {/* Header / Stats Overlay */}
            <div className="flex items-center justify-between relative group">
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] border border-white/20"
                    >
                        <MessageSquare size={28} strokeWidth={2.5} />
                    </motion.div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Discussion <span className="text-blue-500">Hub</span></h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <Globe size={12} className="text-green-500" /> Public to Team
                            </span>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {threads.length} active threads
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowCreate(!showCreate)}
                        variant={showCreate ? 'ghost' : 'primary'}
                        className={`h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all
                            ${showCreate ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'shadow-[0_10px_20px_rgba(37,99,235,0.2)]'}`}
                    >
                        {showCreate ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                        {showCreate ? 'Cancel' : 'New Transmission'}
                    </Button>
                </div>
            </div>

            {/* Create Thread Form - Futuristic Glow */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-blue-500/30 bg-[#020617]/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Paperplane size={80} className="text-blue-500" />
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1">Topic Frequency / Title</label>
                                    <input
                                        value={newThreadTitle}
                                        onChange={e => setNewThreadTitle(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-base placeholder:text-slate-700"
                                        placeholder="Broadcast a new topic..."
                                    />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1">Transmission Message</label>
                                    <textarea
                                        value={newThreadBody}
                                        onChange={e => handleTextareaChange(e.target.value, 'thread')}
                                        rows={5}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500/50 transition-all font-medium text-sm placeholder:text-slate-700 resize-none"
                                        placeholder="Enter details here... Use @name to notify specific team members."
                                    />
                                    <MentionSuggestor type="thread" />

                                    {/* Attachment Strip */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attachments['thread']?.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-400">
                                                <File size={12} /> {file.name}
                                                <button onClick={() => setAttachments(p => ({ ...p, thread: p.thread.filter((_, idx) => idx !== i) }))}><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'thread')}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest"
                                        >
                                            <Paperclip size={14} /> Attach Systems Data
                                        </button>
                                    </div>
                                    <Button onClick={handleCreateThread} className="px-10 h-11">Broadcast Signal</Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Threads List - Futuristic Cards */}
            <div className="space-y-6">
                <AnimatePresence>
                    {threads.map((thread, idx) => (
                        <motion.div
                            key={thread.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`group relative rounded-[1.5rem] border transition-all duration-500 
                                ${expandedThread === thread.id
                                    ? 'bg-[#020617]/60 border-blue-500/40 shadow-[0_20px_80px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/20'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:translate-x-1'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />

                            {/* Thread Header */}
                            <div
                                className="p-6 cursor-pointer flex items-center gap-5 relative z-10"
                                onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                            >
                                <div className="relative">
                                    <Avatar user={thread.author} size="lg" className="ring-2 ring-white/10 shadow-xl" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#020617] rounded-full" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate tracking-tight">{thread.title}</h3>
                                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 text-[9px]">
                                            {thread.comments?.length || 0} DECRYPTED REPLIES
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-[10px] text-blue-400 font-black uppercase tracking-widest">
                                            <User size={12} /> {thread.author_name}
                                        </span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <Clock size={12} /> {new Date(thread.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                                        <MoreHorizontal size={18} />
                                    </div>
                                    <div className={`p-2 rounded-xl transition-all ${expandedThread === thread.id ? 'bg-blue-600 text-white rotate-180' : 'text-slate-600'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Thread Expansion */}
                            <AnimatePresence>
                                {expandedThread === thread.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden border-t border-white/5"
                                    >
                                        <div className="p-8 space-y-8">
                                            <div className="pl-6 border-l-2 border-blue-500/20">
                                                <RichText text={thread.body} className="text-base text-slate-300 leading-relaxed font-medium" />
                                            </div>

                                            {/* Replies Stream */}
                                            <div className="space-y-6">
                                                {thread.comments?.map((comment, cidx) => (
                                                    <motion.div
                                                        key={comment.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: cidx * 0.1 }}
                                                        className="flex gap-5 group/reply"
                                                    >
                                                        <Avatar user={comment.author} size="md" className="ring-2 ring-white/5 flex-shrink-0" />
                                                        <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 group-hover/reply:bg-white/[0.05] transition-all">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{comment.author_name}</span>
                                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter opacity-50">{new Date(comment.created_at).toLocaleString()}</span>
                                                            </div>
                                                            <RichText text={comment.body} className="text-sm text-slate-200 leading-snug font-medium" />
                                                        </div>
                                                    </motion.div>
                                                ))}

                                                {/* Transmission Input */}
                                                <div className="flex gap-5 mt-10 relative">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg ring-4 ring-blue-600/10 flex-shrink-0">
                                                        <Reply size={20} />
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <textarea
                                                            value={commentBody[thread.id] || ''}
                                                            onChange={e => handleTextareaChange(e.target.value, 'comment', thread.id)}
                                                            rows={2}
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-bold text-sm placeholder:text-slate-700 resize-none shadow-inner"
                                                            placeholder="Compose tactical response... (@name)"
                                                        />
                                                        <MentionSuggestor type="comment" id={thread.id} />

                                                        {/* Attachments for Reply */}
                                                        <div className="flex flex-wrap gap-2 mt-2 px-2">
                                                            {attachments[thread.id]?.map((file, i) => (
                                                                <div key={i} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-[9px] font-bold text-blue-400">
                                                                    <File size={10} /> {file.name}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3 px-1">
                                                            <button
                                                                onClick={() => {
                                                                    const input = document.createElement('input');
                                                                    input.type = 'file';
                                                                    input.onchange = (e) => handleFileUpload(e, 'comment', thread.id);
                                                                    input.click();
                                                                }}
                                                                className="text-slate-500 hover:text-white transition-colors"
                                                            >
                                                                <Paperclip size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddComment(thread.id)}
                                                                disabled={!commentBody[thread.id]?.trim()}
                                                                className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-30 transition-all active:scale-95"
                                                            >
                                                                <Send size={14} /> Send Signal
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Background Grain/Light */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent)] z-0" />
        </div>
    )
}

export default DiscussionBoard
