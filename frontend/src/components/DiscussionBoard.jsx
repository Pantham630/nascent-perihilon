import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'
import { MessageSquare, Send, Plus, ChevronDown, ChevronUp, Reply, AtSign } from 'lucide-react'
import { useApp } from '../stores/AppContext'
import RichText from './ui/RichText.jsx'

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
    const [showMentions, setShowMentions] = useState({ type: null, id: null }) // { type: 'thread'|'comment', id: threadId|null }
    const [mentionFilter, setMentionFilter] = useState('')

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
            await api.createThread(projectId, {
                title: newThreadTitle,
                body: newThreadBody,
                author_id: currentUser.id,
                author_name: currentUser.name
            })
            setNewThreadTitle('')
            setNewThreadBody('')
            setShowCreate(false)
            setCommentBody(prev => ({ ...prev, [threadId]: '' }))
            loadData()
            addToast('Reply posted', 'success')
        } catch (err) {
            addToast('Failed to post reply', 'error')
        }
    }

    const handleTextareaChange = (value, type, id = null) => {
        if (type === 'thread') setNewThreadBody(value)
        else setCommentBody(prev => ({ ...prev, [id]: value }))

        const lastChar = value.slice(-1)
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
        words.pop() // remove @filter
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
            <div className="absolute bottom-full left-0 mb-2 w-64 glass-card bg-[#020617]/95 border-blue-500/30 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in">
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
            </div>
        )
    }

    if (loading) return <div className="p-12 flex justify-center"><Spinner size="lg" /></div>

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white tracking-tight uppercase">Discussion Hub</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project-wide coordination & threads</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowCreate(!showCreate)}
                    variant={showCreate ? 'ghost' : 'primary'}
                    className="h-10 px-4"
                >
                    {showCreate ? 'Cancel' : <><Plus size={16} className="mr-2" /> Start Discussion</>}
                </Button>
            </div>

            {/* Create Thread Form */}
            {showCreate && (
                <Card className="animate-in border-blue-500/30 bg-blue-500/[0.02]">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Topic / Title</label>
                            <input
                                value={newThreadTitle}
                                onChange={e => setNewThreadTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500/50 transition-all font-semibold text-sm"
                                placeholder="What's on your mind?"
                            />
                        </div>
                        <div className="space-y-1 relative">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Message</label>
                            <Textarea
                                value={newThreadBody}
                                onChange={e => handleTextareaChange(e.target.value, 'thread')}
                                rows={4}
                                placeholder="Describe the topic in detail... (@mention team members)"
                            />
                            <MentionSuggestor type="thread" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleCreateThread} className="px-8">Post Discussion</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Threads List */}
            <div className="space-y-4">
                {threads.length === 0 && !showCreate && (
                    <EmptyState
                        title="No discussions yet"
                        description="Start a thread to coordinate with your team and client."
                    />
                )}
                {threads.map(thread => (
                    <div
                        key={thread.id}
                        className={`group rounded-2xl border transition-all duration-300 overflow-hidden
                            ${expandedThread === thread.id ? 'bg-white/[0.03] border-blue-500/20 ring-4 ring-blue-500/5' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                        {/* Thread Header */}
                        <div
                            className="p-5 cursor-pointer flex items-start gap-4 transition-colors"
                            onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                        >
                            <Avatar user={thread.author} size="md" className="ring-2 ring-white/5" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors truncate">{thread.title}</h3>
                                    {thread.comments?.length > 0 && (
                                        <div className="bg-white/5 px-2 py-0.5 rounded-full text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {thread.comments.length} replies
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-tight">{thread.author_name}</span>
                                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {new Date(thread.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-slate-600 group-hover:text-blue-400 transition-colors">
                                {expandedThread === thread.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>

                        {/* Thread Body & Comments */}
                        {expandedThread === thread.id && (
                            <div className="px-5 pb-5 animate-in">
                                <div className="pl-14 mb-8">
                                    <RichText text={thread.body} className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap" />
                                </div>

                                {/* Comments Flow */}
                                <div className="space-y-4 relative">
                                    <div className="absolute left-7 top-0 bottom-0 w-px bg-white/5" />

                                    {thread.comments?.map(comment => (
                                        <div key={comment.id} className="relative flex gap-4 pl-4 group/reply">
                                            <div className="mt-2 w-6 h-6 rounded-full border border-white/5 overflow-hidden flex-shrink-0 z-10">
                                                <Avatar user={comment.author} size="sm" />
                                            </div>
                                            <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4 group-hover/reply:border-white/10 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-tight">{comment.author_name}</span>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleString()}</span>
                                                </div>
                                                <RichText text={comment.body} className="text-sm text-white/80 leading-relaxed" />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Reply Input */}
                                    <div className="relative flex gap-4 pl-4 mt-6">
                                        <div className="mt-2 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0 z-10 border border-blue-500/20">
                                            <Reply size={12} />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <Textarea
                                                value={commentBody[thread.id] || ''}
                                                onChange={e => handleTextareaChange(e.target.value, 'comment', thread.id)}
                                                rows={2}
                                                placeholder="Write your reply... (@mention team members)"
                                                className="bg-black/20 border-white/5 focus:border-blue-500/30"
                                            />
                                            <MentionSuggestor type="comment" id={thread.id} />
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddComment(thread.id)}
                                                    disabled={!commentBody[thread.id]?.trim()}
                                                    className="h-8 px-4"
                                                >
                                                    <Send size={12} className="mr-2" />
                                                    Post Reply
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DiscussionBoard
