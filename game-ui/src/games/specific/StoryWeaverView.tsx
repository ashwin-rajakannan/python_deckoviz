import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sendAction } from '../../api/client';
import { PremiumButton, PremiumText } from '../../components/shared/PremiumComponents';
import { Book, Star, Ghost, Award, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumGameLayout } from '../PremiumGameLayout';

export const StoryWeaverView = () => {
    const { gameState, sessionId, userId, updateGameState, gameSlug, players } = useGame();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const narrative = gameState.last_ai_response?.narrative || (gameState.story_text && gameState.story_text.length > 0 ? gameState.story_text[gameState.story_text.length - 1] : "The page is empty. The ink waits for your imagination.");
    const phase = gameState.last_ai_response?.phase || gameState.phase || "Prologue";


    // New Stats
    const karma = gameState.karma ?? 50;
    const arc = gameState.character_arc || "The Wanderer";
    const chapter = gameState.chapter || 1;

    const handleContribute = async () => {
        if (!input.trim() || !sessionId || !gameSlug) return;
        setLoading(true);
        try {
            const resp = await sendAction(gameSlug, sessionId, userId, 'contribute', input);
            if (resp.ok) updateGameState(resp.state);
        } catch (e) { console.error(e); }
        setLoading(false);
        setInput("");
    };

    const playerOrder = gameState.player_order || [];
    const turnIndex = gameState.turn_index || 0;
    const currentTurnUserId = playerOrder.length > 0 ? playerOrder[turnIndex % playerOrder.length] : null;
    const isMyTurn = !currentTurnUserId || currentTurnUserId === userId;

    const currentTurnParams = players[currentTurnUserId] || {};
    const currentTurnName = currentTurnParams.name || (currentTurnUserId === userId ? "You" : "Another Weaver");

    return (
        <PremiumGameLayout
            title="The Story Weaver"
            subtitle={`Chapter ${chapter}: ${phase}`}
            icon={Book}
            backgroundVar="starfield"
            guideText="1. Read the current scene.\n2. Shape the hero's path with your words.\n3. Your choices affect Karma and Character Arcs.\n4. Collaborate with others to build a legacy."
        >
            <div className="flex flex-col h-full relative">

                {/* Top Overlay Stats */}
                <div className="absolute top-0 right-12 flex gap-4 p-2 z-20">
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-2">
                        <Star className={`w-3 h-3 ${karma > 50 ? 'text-yellow-400' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Karma: {karma}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 flex items-center gap-2">
                        <Award className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{arc}</span>
                    </div>
                </div>

                {/* Turn Indicator */}
                <div className="absolute top-0 left-12 p-2 text-[10px] uppercase tracking-widest bg-black/20 rounded-br-xl border-b border-r border-white/5 backdrop-blur-sm z-20">
                    {isMyTurn ? (
                        <span className="text-orange-400 font-bold animate-pulse">Your Turn to Write</span>
                    ) : (
                        <span className="text-white/40">Waiting for {currentTurnName}...</span>
                    )}
                </div>


                {/* Main Content Area - The "Book" */}
                <div className="relative flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                    <div className="max-w-prose mx-auto">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={narrative.substring(0, 30)}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="font-serif text-xl md:text-2xl text-gray-200 leading-[2] tracking-wide first-letter:text-6xl first-letter:text-orange-500 first-letter:font-bold first-letter:float-left first-letter:mr-4 first-letter:mt-1 drop-shadow-sm"
                            >
                                <PremiumText text={narrative} />
                            </motion.div>
                        </AnimatePresence>

                        {(gameState.story_text?.length > 1) && (
                            <div className="mt-16 pt-10 border-t border-white/5">
                                <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6 block text-center font-bold">PREVIOUS ENTRIES</span>
                                <div className="space-y-6">
                                    {gameState.story_text.slice(-4, -1).map((text: string, idx: number) => (
                                        <motion.p
                                            key={idx}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.4 }}
                                            className="text-sm md:text-base text-gray-400 font-serif italic leading-relaxed"
                                        >
                                            {text}
                                        </motion.p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Karma Bar (Subtle bottom line) */}
                <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${karma}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 via-orange-500 to-yellow-400 shadow-[0_0_10px_orange]"
                    />
                </div>

                {/* Interaction Footer */}
                <div className="p-4 md:p-8 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex gap-4 items-end relative z-30">
                    <div className="flex-1 relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl transition duration-700 blur-xl ${isMyTurn ? 'opacity-100' : 'opacity-0'}`} />
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleContribute())}
                            placeholder={isMyTurn ? "Weave the next thread of fate..." : `The ink is dry while ${currentTurnName} writes...`}
                            className={`relative w-full bg-black/40 border-2 rounded-2xl px-6 py-4 min-h-[80px] max-h-[160px] text-gray-100 placeholder:text-gray-700 focus:outline-none resize-none custom-scrollbar font-serif text-xl transition-all ${isMyTurn ? 'border-white/10 focus:border-orange-500/30 shadow-inner' : 'border-white/5 opacity-50 cursor-not-allowed'}`}
                            disabled={loading || !isMyTurn}
                        />
                        {isMyTurn && (
                            <div className="absolute top-2 right-4 text-[9px] font-black uppercase tracking-widest text-white/10 pointer-events-none">
                                ESC to clear • ENTER to weave
                            </div>
                        )}
                    </div>
                    <PremiumButton
                        onClick={handleContribute}
                        disabled={loading || !input || !isMyTurn}
                        className={`h-[80px] px-8 rounded-2xl ${loading || !isMyTurn ? 'opacity-30' : 'hover:scale-105 shadow-xl shadow-orange-950/20'}`}
                    >
                        {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} >
                                <Ghost size={24} className="text-orange-500" />
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-1 font-black text-[10px] tracking-tighter">
                                <Send size={24} />
                                WEAVE
                            </div>
                        )}
                    </PremiumButton>
                </div>
            </div>
        </PremiumGameLayout>
    );
};

