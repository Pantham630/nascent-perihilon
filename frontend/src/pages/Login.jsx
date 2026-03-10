import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../stores/AppContext'
import { LogIn, Shield, ArrowRight, Activity, Cpu } from 'lucide-react'

export default function Login() {
    const { login } = useApp()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await login(email, password)
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-inter">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.15, 0.1],
                        x: [0, -50, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] mb-6 border border-white/20"
                    >
                        <Shield className="text-white" size={32} strokeWidth={2.5} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-2">
                        Launch<span className="text-blue-500">Pad</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Command Center Login v1.4</p>
                </div>

                {/* Login Card */}
                <div className="glass-card bg-[#020617]/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Cpu size={40} className="text-blue-500" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Authorized ID (Email)</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
                                    placeholder="alex@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Key (Password)</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                                >
                                    <p className="text-[11px] text-red-400 font-bold text-center uppercase tracking-wide">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Activity size={20} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="flex items-center gap-2"
                                    >
                                        Initiate Authentication
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Secure Encrypted Tunnel • v{window.LAUNCHPAD_VERSION || '1.0.0'}
                        </p>
                    </div>
                </div>

                {/* Footer hints */}
                <div className="mt-8 flex justify-between px-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Systems Nominal</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                        <LogIn size={12} />
                        <span className="text-[9px] font-black uppercase tracking-tighter underline underline-offset-2">Need Credentials?</span>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none" />
        </div>
    )
}
