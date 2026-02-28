import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Home, MessageSquare, Send, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameActivityFeed } from '../components/shared/GameActivityFeed';
import axios from 'axios';

interface PremiumGameLayoutProps {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    backgroundVar?: 'starfield' | 'nebula' | 'void';
    guideText?: string;
}

export const PremiumGameLayout: React.FC<PremiumGameLayoutProps> = ({
    title,
    subtitle,
    icon: Icon = Gamepad2,
    children,
    backgroundVar = 'starfield',
    guideText
}) => {
    const { leaveSession, players, gameState, sessionId, userId, gameSlug } = useGame();
    const [showChat, setShowChat] = React.useState(false);
    const [chatInput, setChatInput] = React.useState("");
    const chatEndRef = React.useRef<HTMLDivElement>(null);

    const chatMessages = gameState?.chat_messages || [];

    React.useEffect(() => {
        if (showChat) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat]);

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !sessionId || !gameSlug) return;
        const msg = chatInput.trim();
        setChatInput("");
        try {
            const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/games/${gameSlug}` : `http://localhost:8000/games/${gameSlug}`;
            await axios.post(`${apiBase}/chat`, {
                session_id: sessionId,
                user_id: userId,
                message: msg
            });
        } catch (e) { console.error("Chat error", e); }
    };

    return (
        <div className="relative w-full flex-1 flex flex-col items-center py-6 md:py-8 overflow-hidden min-h-0">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-midnight">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-midnight to-midnight" />

                {/* Floating Particles */}
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-deep-purple/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]"
                />

                {/* Star Field Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-150 mix-blend-soft-light" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center relative z-10 px-4 w-full flex justify-between items-center max-w-5xl"
            >
                <button
                    onClick={() => window.confirm("Leave this adventure?") && leaveSession()}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all flex items-center gap-2 group"
                >
                    <Home size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-bold hidden md:block">Exit to Hub</span>
                </button>

                <div>
                    {subtitle && (
                        <div className="inline-flex items-center gap-2 text-gold/60 text-[10px] tracking-[0.3em] uppercase mb-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                            <Sparkles size={10} />
                            <span>{subtitle}</span>
                            <Sparkles size={10} />
                        </div>
                    )}
                    <h2 className="text-2xl md:text-5xl font-premium text-white flex items-center justify-center gap-4 mt-1 text-shadow-lg">
                        <Icon className="text-gold hidden md:block" size={28} />
                        {title}
                        <Icon className="text-gold hidden md:block" size={28} />
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2 mr-4 overflow-hidden">
                        {Object.values(players || {}).map((p: any, i: number) => (
                            <div key={i} title={p.name} className="w-8 h-8 rounded-full border-2 border-[#151220] bg-gold/20 flex items-center justify-center text-[10px] text-gold font-bold">
                                {p.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                        ))}
                    </div>
                    {guideText && (
                        <button
                            onClick={() => alert(guideText)}
                            className="text-[10px] text-gold underline tracking-widest font-bold uppercase opacity-60 hover:opacity-100 transition-opacity hidden md:block"
                        >
                            Guide
                        </button>
                    )}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-3 rounded-xl border transition-all ${showChat ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        <MessageSquare size={18} />
                    </button>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="w-full max-w-6xl flex-1 flex gap-6 px-4 pb-4 min-h-0 relative z-20">
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 flex flex-col relative min-h-0"
                >
                    {/* Universal Activity Feed */}
                    <GameActivityFeed />

                    {/* Glass Container */}
                    <div className="absolute inset-0 bg-[#0f0c18]/80 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl" />
                    <div className="absolute -inset-1 bg-gradient-to-br from-gold/10 to-transparent rounded-[2rem] blur-xl -z-10 opacity-40" />

                    {/* Content Inner */}
                    <div className="relative flex-1 flex flex-col md:p-8 overflow-hidden rounded-3xl">
                        {children}
                    </div>
                </motion.div>

                {/* Chat Sidebar */}
                <motion.div
                    initial={false}
                    animate={{ width: showChat ? 320 : 0, opacity: showChat ? 1 : 0 }}
                    className="flex flex-col bg-[#0f0c18]/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {showChat && (
                        <>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare size={14} className="text-gold" /> Guild Chat
                                </h3>
                                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {chatMessages.map((m: any, i: number) => (
                                    <div key={i} className="space-y-1">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">{m.user_id}</div>
                                        <div className={`p-3 rounded-2xl text-sm border ${m.user_id === userId ? 'bg-gold/10 border-gold/20 text-white' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                            {m.message}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendChat} className="p-4 bg-black/40 border-t border-white/5">
                                <div className="relative">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Send message..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-gold/30 transition-all font-light"
                                    />
                                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gold opacity-50 hover:opacity-100 transition-opacity">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
