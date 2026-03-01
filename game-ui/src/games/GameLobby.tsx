import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { createRoom, joinRoom, getMyGames, getAllGames } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Globe, Layers, Image, Scale, Sword, Compass, Mic2, Hexagon, Scroll, Play, Sparkles, LogOut, User, Users, Clock, Gamepad2
} from 'lucide-react';
import { PremiumButton, PremiumCard } from '../components/shared/PremiumComponents';
import { createCollection } from '../api/collections';
import { streamingManager } from '../api/streaming';

// Fallback icon map
const IconMap: any = {
    'Narrative': BookOpen,
    'Adventure': Sword,
    'Creative': Image,
    'Social': Users,
    'Strategy': Scale,
    'Self-Discovery': Compass,
    'Music': Mic2,
    'Wellbeing': Sparkles,
    'Mystery': Hexagon,
    'Puzzle': Layers,
    'Action': Gamepad2
};

export const GameLobby = () => {
    const { setGameSession, userId } = useGame();
    const { logout, user } = useAuth();
    const [selectedGame, setSelectedGame] = useState<any>(null);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeGames, setActiveGames] = useState<any[]>([]);
    const [allGames, setAllGames] = useState<any[]>([]);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                if (userId) {
                    const myRes = await getMyGames(userId);
                    if (myRes.ok) setActiveGames(myRes.games || []);
                }
                const res = await getAllGames();
                // Ensure res.games is an array
                if (res.ok && Array.isArray(res.games)) {
                    setAllGames(res.games);
                }
            } catch (e) {
                console.error("Failed to load games:", e);
            }
        };
        loadConfig();

        const timer = setInterval(() => {
            setAllGames(current => {
                if (current.length === 0) return current;
                setFeaturedIndex(prev => (prev + 1) % current.length);
                return current;
            });
        }, 8000);

        return () => clearInterval(timer);
    }, [userId]);

    const handleCreateRoom = async (solo = false) => {
        if (!selectedGame) return;
        setLoading(true);
        try {
            const resp = await createRoom(selectedGame.slug, userId, solo ? 1 : 5);
            if (resp.ok) {
                setGameSession(resp.session_id, resp.session_id, selectedGame.slug, {}, resp.room_code, 'lobby');
            }
        } catch (e) {
            console.error("Failed to create room", e);
            alert("Error creating game session.");
        }
        setLoading(false);
    };

    const handleJoinByCode = async () => {
        if (!joinCode || joinCode.length < 4) return;
        setLoading(true);
        try {
            const resp = await joinRoom(joinCode.toUpperCase(), userId);
            if (resp.ok) {
                setGameSession(resp.session_id, resp.session_id, resp.game_slug, {}, joinCode.toUpperCase(), 'lobby');
            } else {
                alert("Room not found or game already started.");
            }
        } catch (e) {
            console.error("Join failed", e);
            alert("Could not join room. Is the code correct?");
        }
        setLoading(false);
    };

    const handleResume = (game: any) => {
        setGameSession(game.session_id, game.session_id, game.game_slug, {}, game.room_code, game.status);
    };

    const handleCreateDemoCollection = async () => {
        try {
            setLoading(true);
            const result = await createCollection("Demo " + Date.now(), "Test");
            alert("Collection created: " + result.name);
        } catch (err) {
            alert("Failed to create collection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20 relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <motion.div
                    animate={{ rotate: 360, x: [0, 100, 0], y: [0, -50, 0] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-900/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ rotate: -360, x: [0, -100, 0], y: [0, 50, 0] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px]"
                />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center py-6 border-b border-white/5 mb-8 gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        <User size={18} />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Adventurer</span>
                        <span className="text-white font-premium text-sm">{user?.email?.split('@')[0] || 'Seeker'}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="ml-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2"
                        title="Sign Out"
                    >
                        <LogOut size={14} />
                        LOGOUT
                    </button>
                    <button onClick={handleCreateDemoCollection} className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg" disabled={loading}>+ COLLECTION</button>
                    <button onClick={() => alert("Streaming soon")} className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg">STREAM</button>
                </div>

                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md w-full md:w-auto">
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        placeholder="ENTER ROOM CODE"
                        className="bg-transparent border-none text-white px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] focus:outline-none w-full md:w-40"
                    />
                    <PremiumButton onClick={handleJoinByCode} className="px-6 py-2 text-xs h-full" disabled={loading || joinCode.length < 4}>
                        JOIN
                    </PremiumButton>
                </div>
            </div>

            {/* Active Games */}
            {activeGames.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            <Clock size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-widest uppercase">Active Sessions</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {activeGames.map((g: any) => (
                            <div key={g.session_id} onClick={() => handleResume(g)} className="cursor-pointer group relative overflow-hidden bg-white/5 border border-white/10 rounded-xl p-4 hover:border-gold/30 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-gold font-mono">{g.room_code || '---'}</span>
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                                </div>
                                <h3 className="font-bold text-white mb-1 group-hover:text-gold transition-colors">{g.game_slug}</h3>
                                <p className="text-xs text-gray-500">{new Date(g.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Games Section */}
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-gold/20 text-gold border border-gold/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-premium font-bold text-white tracking-widest uppercase text-shadow-lg">Premium Experiences</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-gold/50 to-transparent ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allGames.filter(g => g.tier === 'premium').map((game) => {
                        const Icon = IconMap[game.category] || Gamepad2;
                        return (
                            <PremiumCard
                                key={game.slug}
                                className="group relative overflow-hidden h-[360px] hover:border-gold/50 transition-all duration-500 cursor-pointer border-white/10 shadow-2xl hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-50"
                                    style={{ backgroundImage: `url(${game.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b091a] via-[#0b091a]/80 to-transparent" />
                                <div onClick={() => setSelectedGame(game)} className="relative z-10 h-full flex flex-col p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-gold shadow-lg group-hover:scale-110 group-hover:bg-gold/20 transition-all duration-300">
                                            <Icon size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                                            {game.category}
                                        </span>
                                    </div>
                                    <div className="mt-auto">
                                        <h3 className="text-3xl font-premium font-bold text-white mb-2 group-hover:text-gold transition-colors text-shadow-sm leading-tight">
                                            {game.name}
                                        </h3>
                                        <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 mb-4 group-hover:text-white transition-colors">
                                            {game.desc || "A flagship immersive experience."}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gold opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <span>ENTER WORLD</span>
                                            <div className="h-[1px] w-8 bg-gold/50" />
                                        </div>
                                    </div>
                                </div>
                            </PremiumCard>
                        )
                    })}
                </div>
            </div>

            {/* Standard Games Section */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-full bg-white/5 text-gray-400 border border-white/10">
                        <Layers size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-300 tracking-widest uppercase">Standard Library</h2>
                    <div className="h-[1px] flex-1 bg-white/10 ml-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allGames.filter(g => g.tier !== 'premium').map((game) => {
                        const Icon = IconMap[game.category] || Gamepad2;
                        return (
                            <motion.div
                                key={game.slug}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedGame(game)}
                                className="group relative overflow-hidden h-[240px] rounded-xl border border-white/5 bg-[#0f0c18] hover:border-gold/30 transition-colors cursor-pointer"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity"
                                    style={{ backgroundImage: `url(${game.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                                <div className="relative z-10 h-full flex flex-col p-4">
                                    <div className="p-2 w-fit rounded-lg bg-white/5 backdrop-blur-sm text-white/70 mb-auto">
                                        <Icon size={16} />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors leading-tight mb-1">
                                            {game.name}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 group-hover:text-gray-400">
                                            {game.category}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {selectedGame && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-midnight border border-white/10 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative"
                    >
                        <div className="p-8 relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                                        {(() => {
                                            const ModalIcon = IconMap[selectedGame.category] || Gamepad2;
                                            return <ModalIcon size={40} />;
                                        })()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">{selectedGame.name}</h2>
                                        <span className="text-sm text-gray-400 uppercase tracking-widest">{selectedGame.category}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedGame(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                                    <LogOut size={24} className="rotate-45" />
                                </button>
                            </div>

                            <p className="text-gray-300 leading-relaxed mb-8">
                                {selectedGame.desc || "Dive into this immersive AI-powered experience. Shape the narrative, solve mysteries, and explore new worlds."}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <PremiumButton onClick={() => handleCreateRoom(false)} className="w-full">
                                    <Users size={18} className="mr-2" />
                                    MULTIPLAYER
                                </PremiumButton>
                                <PremiumButton onClick={() => handleCreateRoom(true)} variant="secondary" className="w-full">
                                    <User size={18} className="mr-2" />
                                    SOLO JOURNEY
                                </PremiumButton>
                            </div>
                        </div>

                        {/* Modal Background */}
                        <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/80 to-transparent" />
                            <div className="w-full h-full bg-cover bg-center blur-sm" style={{ backgroundImage: `url(${selectedGame.image})` }} />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
