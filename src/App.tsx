import React, { useState, useEffect, useRef } from "react";
import { 
  Gamepad2, 
  Search, 
  HelpCircle, 
  Plus, 
  Star, 
  Share2, 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  Compass, 
  FolderPlus, 
  Terminal as TerminalIcon, 
  Sparkles, 
  VolumeX, 
  Download, 
  Upload, 
  Bookmark,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";

import { Game, Review, RecommendedGame } from "./types";
import initialGames from "./games.json";
import NeonSnake from "./components/NeonSnake";
import VoidExplorer from "./components/VoidExplorer";
import GameGenie from "./components/GameGenie";

export default function App() {
  // Application databases & state
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem("arcade_portal_games_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Set typical defaults inside first run
    return initialGames.map(g => ({
      ...g,
      rating: 4.8,
      ratingsCount: 1,
      isFavorite: false
    })) as Game[];
  });

  const [activeTab, setActiveTab] = useState<"all" | "arcade" | "puzzle" | "action" | "retro" | "curator" | "favorites" | "add">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Game Play reviews
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem("arcade_portal_reviews_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "r1", gameId: "neon-snake", username: "retro_master_99", rating: 5, comment: "Pure adrenaline! The retro sound waves and glowing lasers are epic. 🕹️🔥", timestamp: "05/14/2026" },
      { id: "r2", gameId: "void-explorer", username: "stellar_recon", rating: 4, comment: "Very smooth flight friction physics. Splitting the big celestial asteroids up for massive double combos is awesome!", timestamp: "05/14/2026" },
      { id: "r3", gameId: "game-2048", username: "logic_hustler", rating: 5, comment: "Excellent brain relaxation after dodging asteroids. No frame drops at all.", timestamp: "05/14/2026" }
    ];
  });

  // User comments writing fields
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("Player_One");

  // AI curation generator dashboard state
  const [userMood, setUserMood] = useState("Excited / Energetic");
  const [userCurationGenre, setUserCurationGenre] = useState("Arcade");
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedGame[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // Custom game form setup
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Arcade");
  const [customDesc, setCustomDesc] = useState("");
  const [customControls, setCustomControls] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customThumbnail, setCustomThumbnail] = useState("");

  // Developers Interactive Terminal CLI state
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🌌 ARCADE NEBULA // CENTRAL CORES ON-LINE",
    "Type 'help' to review list of cyber secret commands.",
  ]);

  // Global Interactive Graphic Toggles from Cheat Chevrons
  const [retroCrtEnabled, setRetroCrtEnabled] = useState(false);
  const [laserBorderEnabled, setLaserBorderEnabled] = useState(false);
  const [sidebarChatOpen, setSidebarChatOpen] = useState(true);

  // Sync state
  useEffect(() => {
    localStorage.setItem("arcade_portal_games_v2", JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem("arcade_portal_reviews_v2", JSON.stringify(reviews));
  }, [reviews]);

  // Terminal actions processing
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    setTerminalLogs(prev => [...prev, `> ${terminalInput}`]);
    setTerminalInput("");

    if (cmd === "help") {
      setTerminalLogs(prev => [
        ...prev,
        "=== ARCADE CLI DIRECT DIRECTIVES ===",
        "• 'retro'     - Toggles 80s CRT scanlines grid simulation overlay",
        "• 'nebula'    - Ignites premium glowing purple page margins",
        "• 'unlock'    - Instant unlocks random custom achievements badge",
        "• 'reboot'    - Re-synchronize defaults with games JSON database",
        "• 'clear'     - Wipe console command logs"
      ]);
    } else if (cmd === "retro") {
      setRetroCrtEnabled(prev => !prev);
      setTerminalLogs(prev => [...prev, `[STATUS] CRT Scanlines toggled to: ${!retroCrtEnabled ? "ON" : "OFF"}`]);
    } else if (cmd === "nebula") {
      setLaserBorderEnabled(prev => !prev);
      setTerminalLogs(prev => [...prev, `[STATUS] Cosmic laser border toggled to: ${!laserBorderEnabled ? "ON" : "OFF"}`]);
    } else if (cmd === "unlock") {
      const badges = ["🏆 Galaxy Overlord", "🔮 Zen Sage", "⚡ Light Speed Survivor", "👑 Retro Pioneer"];
      const randomBadge = badges[Math.floor(Math.random() * badges.length)];
      setTerminalLogs(prev => [...prev, `✨ ACHIEVEMENT UNLOCKED: ${randomBadge}! Check your profile.`]);
    } else if (cmd === "reboot") {
      setGames(initialGames.map(g => ({ ...g, rating: 4.8, ratingsCount: 1, isFavorite: false })) as Game[]);
      setTerminalLogs(prev => [...prev, "[SYSTEM] Overwritten state with original games.json defaults successfully."]);
    } else if (cmd === "clear") {
      setTerminalLogs(["Central cores on-line. Buffer cleared."]);
    } else {
      setTerminalLogs(prev => [...prev, `Error: Directory command '${cmd}' not recognized.`]);
    }
  };

  // Favoriting games
  const toggleFavorite = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g));
  };

  // Adding novel external/canvas games
  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customUrl) {
      alert("Please specify at least a title and a valid embed URL!");
      return;
    }

    const newId = customTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
    const newGame: Game = {
      id: newId,
      title: customTitle,
      category: customCategory,
      description: customDesc || "A custom unblocked browser arcade masterpiece loaded directly into the portal.",
      controls: customControls || "Keyboard / Mouse controls.",
      url: customUrl,
      thumbnail: customThumbnail || "custom",
      rating: 5.0,
      ratingsCount: 1,
      isFavorite: false
    };

    setGames(prev => [newGame, ...prev]);
    alert(`🕹️ '${customTitle}' has been uploaded to your personal dashboard database successfully!`);
    
    // Reset Form
    setCustomTitle("");
    setCustomDesc("");
    setCustomControls("");
    setCustomUrl("");
    setCustomThumbnail("");
    setActiveTab("all");
  };

  // JSON exporter
  const exportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "arcadenebula_games_db.json");
    dlAnchorElem.click();
  };

  // JSON importer
  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setGames(parsed);
            alert("✅ Dynamic catalog files imported and fully loaded into localStorage!");
          } else {
            alert("Oops! The database file structure must be formatted as a JSON array.");
          }
        } catch (err) {
          alert("Invalid JSON file provided.");
        }
      };
    }
  };

  // AI Curation Generator using backend /api/recommend
  const requestRecommendation = async () => {
    setRecommendationLoading(true);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: userMood, genre: userCurationGenre })
      });
      const data = await response.json();
      setAiRecommendations(data);
    } catch (err) {
      console.error("AI Curation error:", err);
      // Fallback
      setAiRecommendations([
        {
          title: "Cosmic Mindscape",
          description: "A calming puzzle of aligning mirrors to refract glowing rays through deep space.",
          type: "puzzle",
          difficulty: "Easy",
          achievement: "🔮 Zen master"
        }
      ]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // Submitting reviews
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
    if (!commentInput.trim()) return;

    const newRev: Review = {
      id: Date.now().toString(),
      gameId: selectedGame.id,
      username: usernameInput || "Anonymous",
      rating: ratingInput,
      comment: commentInput.trim(),
      timestamp: new Date().toLocaleDateString()
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    // Recompute score averages
    const gameReviews = updatedReviews.filter(r => r.gameId === selectedGame.id);
    const avgRating = Number((gameReviews.reduce((sum, current) => sum + current.rating, 0) / gameReviews.length).toFixed(1));

    setGames(prev => prev.map(g => g.id === selectedGame.id ? { 
      ...g, 
      rating: avgRating, 
      ratingsCount: gameReviews.length 
    } : g));

    setCommentInput("");
    alert("Review synced to local grid system successfully!");
  };

  // Rendering custom thumbnail widgets
  const renderThumbnail = (game: Game) => {
    const gradients: { [key: string]: string } = {
      space_shooter: "from-[#8a2be2] via-fuchsia-600 to-amber-500",
      neon_snake: "from-[#00f0ff] via-[#8a2be2] to-[#ff007f]",
      grid_puzzle: "from-[#10b981] to-emerald-800",
      block_classic: "from-blue-600 via-[#3b82f6] to-cyan-400",
      chomp_man: "from-amber-400 to-yellow-600"
    };

    const matched = gradients[game.thumbnail];
    const isLocal = !game.thumbnail.startsWith("http");

    if (matched || isLocal) {
      return (
        <div className={`w-full h-40 bg-gradient-to-br ${matched || "from-[#1a113d] to-[#120a2a]"} flex flex-col justify-center items-center text-center p-4 relative overflow-hidden group`}>
          <div className="absolute inset-0 bg-grid-cyber opacity-20" />
          <div className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 bg-black/55 text-[#00f0ff] rounded border border-[#8a2be2]/30 uppercase tracking-widest">{game.category}</div>
          <span className="text-4xl mb-2 select-none float-element duration-1000">
            {game.id === "neon-snake" ? "🐍" : game.id === "void-explorer" ? "🚀" : "🎮"}
          </span>
          <h4 className="font-display font-black text-white text-base tracking-wide z-10 drop-shadow-lg text-center leading-tight">{game.title}</h4>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 font-mono text-[9px] text-gray-300 bg-black/60 px-2 py-0.5 rounded border border-white/5">
            ⭐ {game.rating || 5.0} <span className="opacity-60">({game.ratingsCount || 1})</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-40 overflow-hidden relative group bg-[#09090e]">
        <div className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 bg-black/75 text-[#00f0ff] rounded border border-[#8a2be2]/30 uppercase tracking-widest z-10">{game.category}</div>
        <img 
          src={game.thumbnail} 
          alt={game.title}
          referrerPolicy="no-referrer"
          className="w-full h-40 object-cover group-hover:scale-105 transition-all duration-300"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const backup = e.currentTarget.nextElementSibling as HTMLDivElement;
            if (backup) backup.style.display = 'flex';
          }}
        />
        {/* Fallback stylized gradient */}
        <div style={{ display: 'none' }} className="absolute inset-0 bg-gradient-to-br from-[#1c1c2e] to-[#0d0d14] flex flex-col justify-center items-center text-center p-4">
          <span className="text-3xl mb-1">🎮</span>
          <span className="font-display font-black text-white text-sm">{game.title}</span>
        </div>
      </div>
    );
  };

  // Searching / Categorizing Games logic list
  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
                       (activeTab === "favorites" && game.isFavorite) ||
                       (activeTab !== "curator" && activeTab !== "add" && game.category.toLowerCase() === activeTab);
    return matchesSearch && matchesTab;
  });

  return (
    <div className={`min-h-screen bg-[#0A0A0C] text-slate-100 font-sans relative flex flex-col overflow-x-hidden ${retroCrtEnabled ? "scanline-crt" : ""} ${laserBorderEnabled ? "border-4 border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.25)]" : ""}`}>
      {/* Dynamic Cyber Grid Scrolling Particles */}
      <div className="absolute inset-0 bg-grid-cyber opacity-35 pointer-events-none z-0" />

      {/* Immersive Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F0F12]/85 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedGame(null)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic text-white float-element">Arcade<span className="text-indigo-500">Nebula</span></span>
          </div>
          
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
            <button onClick={() => { setSelectedGame(null); setActiveTab("all"); }} className={`hover:text-white transition-all pb-1 cursor-pointer ${activeTab === "all" ? "text-white border-b-2 border-indigo-500 font-bold" : ""}`}>Discovery</button>
            <button onClick={() => { setSelectedGame(null); setActiveTab("favorites"); }} className={`hover:text-white transition-all pb-1 cursor-pointer ${activeTab === "favorites" ? "text-white border-b-2 border-indigo-500 font-bold" : ""}`}>My Favorites</button>
            <button onClick={() => { setSelectedGame(null); setActiveTab("curator"); }} className={`hover:text-white transition-all pb-1 cursor-pointer ${activeTab === "curator" ? "text-white border-b-2 border-indigo-500 font-bold" : ""}`}>AI Advisor</button>
          </nav>
        </div>

        {/* Global Action Bar with search inside header */}
        <div className="flex items-center gap-4 z-40">
          <div className="relative hidden sm:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search unblocked games..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-100"
            />
          </div>

          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-mono text-[10px] text-slate-300 transition-all cursor-pointer"
            title="Toggle Developer Terminal"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> CLI [~]
          </button>

          <button
            onClick={() => setSidebarChatOpen(!sidebarChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-mono text-[10px] transition-all cursor-pointer ${sidebarChatOpen ? "bg-indigo-950/40 border-indigo-500/50 text-[#818cf8]" : "bg-white/5 border-white/10 text-slate-400"}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> CHIP
          </button>

          <div className="h-6 w-[1px] bg-white/10" />

          <button
            onClick={exportDatabase}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all text-xs"
            title="Export Profile"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label 
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer text-xs"
            title="Import custom games"
          >
            <Upload className="w-3.5 h-3.5" />
            <input 
              type="file" 
              accept=".json" 
              onChange={importDatabase}
              className="hidden" 
            />
          </label>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 border border-white/20 flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-lg">
            P1
          </div>
        </div>
      </header>

      {/* Dev CLI Terminal panel popup */}
      {terminalOpen && (
        <section className="bg-black/95 border-b border-indigo-500/30 p-4 font-mono text-xs text-emerald-400 z-50 relative animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            <div className="h-28 overflow-y-auto space-y-1 bg-[#050508] p-3 rounded border border-white/5">
              {terminalLogs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">{log}</div>
              ))}
            </div>
            <form onSubmit={handleTerminalCommand} className="flex gap-2">
              <span className="text-[#38bdf8] font-bold">nebula_cli#</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="reboot / retro / nebula / help..."
                className="flex-1 bg-black text-emerald-400 border-none outline-none font-mono text-xs focus:ring-0"
              />
              <button type="submit" className="hidden" />
            </form>
          </div>
        </section>
      )}

      {/* Full layout flexbox with left sidebar and main display */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 h-full w-full">
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-white/5 p-6 flex flex-col gap-6 bg-[#0B0B0E] shrink-0">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3 font-mono">Library Portal</h3>
            <ul className="space-y-1 text-xs font-semibold">
              <li 
                onClick={() => { setSelectedGame(null); setActiveTab("all"); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeTab === "all" ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-slate-400 hover:text-white bg-transparent"}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "all" ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-transparent"}`}></div> 
                Trending Games
              </li>
              <li 
                onClick={() => { setSelectedGame(null); setActiveTab("favorites"); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeTab === "favorites" ? "text-indigo-400 bg-indigo-500/10 font-bold" : "text-slate-400 hover:text-white bg-transparent"}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "favorites" ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-transparent"}`}></div>
                My Favorites
              </li>
              <li 
                onClick={() => { setSelectedGame(null); setActiveTab("curator"); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeTab === "curator" ? "text-pink-400 bg-pink-500/10 font-bold" : "text-slate-400 hover:text-white bg-transparent"}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "curator" ? "bg-pink-500 shadow-[0_0_8px_#ec4899]" : "bg-transparent"}`}></div>
                AI Advisor
              </li>
              <li 
                onClick={() => { setSelectedGame(null); setActiveTab("add"); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeTab === "add" ? "text-emerald-400 bg-emerald-500/10 font-bold" : "text-slate-400 hover:text-white bg-transparent"}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === "add" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-transparent"}`}></div>
                Upload Web Game
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3 font-mono">Genre Sectors</h3>
            <ul className="space-y-1 text-xs font-semibold">
              {[
                { id: "arcade", label: "🕹️ Speed Arcade", activeColor: "text-indigo-400" },
                { id: "puzzle", label: "🧩 Logic & Puzzle", activeColor: "text-indigo-400" },
                { id: "action", label: "🚀 Action & Flight", activeColor: "text-indigo-400" },
                { id: "retro", label: "📺 Retro Vintage", activeColor: "text-indigo-400" }
              ].map(item => (
                <li 
                  key={item.id}
                  onClick={() => { setSelectedGame(null); setActiveTab(item.id as any); }}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-between ${activeTab === item.id ? `bg-white/5 ${item.activeColor} font-bold border-l-2 border-indigo-500` : "text-slate-400 hover:text-white"}`}
                >
                  <span>{item.label}</span>
                  {activeTab === item.id && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium promotion box matching the template */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-transparent border border-indigo-500/15 hidden lg:block shadow-md">
            <p className="text-xs text-indigo-300 mb-1 font-bold tracking-wide uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Premium Access
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Unlock infinite unblocked high frequency frames & direct clean gaming streams.</p>
          </div>
        </aside>

        {/* Main interactive workspace column */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto relative z-10">
        
        {/* GAME SCREEN VIEW PLAYER */}
        {selectedGame ? (
          <section className="bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all relative">
            <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
              
              {/* Gameplay Screen (3 columns on desktop) */}
              <div className="lg:col-span-3 p-4 sm:p-6 flex flex-col justify-between gap-6">
                <div>
                  {/* Title and breadcrumbs */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-4 border-b border-white/5">
                    <button 
                      onClick={() => setSelectedGame(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-indigo-600 text-white font-display font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <ArrowLeft className="w-4 h-4" /> ← DISCOVERY SECTOR
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => toggleFavorite(selectedGame.id, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer ${selectedGame.isFavorite ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 border border-white/10 text-slate-300"}`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${selectedGame.isFavorite ? "fill-amber-400" : ""}`} />
                        {selectedGame.isFavorite ? "FAVORITED" : "FAVORITE"}
                      </button>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied! Share it with friends at school or office.");
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
                        title="Copy Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="font-display font-black text-2xl text-white uppercase flex items-center gap-2">
                    👾 PLAYING: {selectedGame.title} 
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-widest">{selectedGame.category}</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">{selectedGame.description}</p>
                </div>

                {/* GAME WORKSPACE DISPLAY ZONE */}
                <div className="w-full flex items-center justify-center overflow-hidden rounded-xl">
                  {selectedGame.url === "local-canvas" ? (
                    selectedGame.id === "neon-snake" ? (
                      <NeonSnake />
                    ) : (
                      <VoidExplorer />
                    )
                  ) : (
                    <div className="relative w-full h-[62vh] min-h-[350px] bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                      <iframe 
                        id="game-frame"
                        src={selectedGame.url} 
                        frameBorder="0" 
                        allowFullScreen
                        className="w-full flex-1 bg-black"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                      {/* Secure sandbox banner */}
                      <div className="bg-[#121216] px-4 py-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                        <span className="flex items-center gap-1 font-semibold uppercase">🔒 SECURED SYSTEM IFRAME</span>
                        <a 
                          href={selectedGame.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-400 flex items-center gap-1 hover:underline font-bold"
                        >
                          Direct Tab <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gameplay Details / Controls / Review Box Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  {/* Instructions */}
                  <div className="p-4 bg-[#121216] border border-white/5 rounded-xl flex flex-col gap-2">
                    <h3 className="font-display font-bold text-xs text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">🎛️ PLAYBACK CONTROLS MANUAL</h3>
                    <p className="text-slate-300 font-mono text-xs whitespace-pre-line leading-relaxed">{selectedGame.controls}</p>
                  </div>

                  {/* Reviews Form */}
                  <div className="p-4 bg-[#121216] border border-white/5 rounded-xl flex flex-col gap-3">
                    <h3 className="font-display font-bold text-xs text-indigo-400 uppercase tracking-wider">⭐ SYSTEM COMMENDATION MATRIX</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-bold">CALLSIGN</label>
                          <input 
                            type="text" 
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-bold">RATING SCORE</label>
                          <select 
                            value={ratingInput} 
                            onChange={(e) => setRatingInput(Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-[#0F0F12]"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                            <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                            <option value={3}>⭐⭐⭐ (3/5)</option>
                            <option value={2}>⭐⭐ (2/5)</option>
                            <option value={1}>⭐ (1/5)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Submit gamer telemetry feedback..." 
                          className="w-full text-xs px-3 py-2 rounded-lg"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-display text-[10px] uppercase font-bold tracking-wider rounded-lg border border-white/10 shadow-lg cursor-pointer transition-all"
                      >
                        SUBMIT DISK TELEMETRY
                      </button>
                    </form>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="pt-4 border-t border-white/5">
                  <h3 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> REVIEWS TELEMETRY DATABASE ({reviews.filter(r => r.gameId === selectedGame.id).length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {reviews.filter(r => r.gameId === selectedGame.id).map(r => (
                      <div key={r.id} className="p-3 bg-[#121216] rounded-xl border border-white/5 text-xs">
                        <div className="flex justify-between text-slate-400 mb-1 font-mono text-[9px]">
                          <span className="font-bold text-white">👤 @{r.username}</span>
                          <span className="text-indigo-400 font-semibold">★ {r.rating}.0 • {r.timestamp}</span>
                        </div>
                        <p className="text-slate-350">{r.comment}</p>
                      </div>
                    ))}
                    {reviews.filter(r => r.gameId === selectedGame.id).length === 0 && (
                      <p className="text-slate-500 text-xs italic">No static reviews submitted for this sector yet. Be the first to catalog telemetry!</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Sidebar AI Chat Genie (1 column) */}
              <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0D0D12]">
                <GameGenie />
              </div>

            </div>
          </section>
        ) : (
          
          /* NORMAL HUB LAYOUT DISPLAY GRID */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* LEFT FILTER BOARD AND STATS BAR */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Cinematic Featured Hero Section */}
              {activeTab === "all" && (
                <section className="relative h-64 w-full rounded-3xl overflow-hidden group border border-white/10 shadow-2xl shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1024&h=300&fit=crop')] bg-cover bg-center group-hover:scale-[1.03] transition-all duration-700" />
                  
                  <div className="relative z-20 h-full flex flex-col justify-center px-8 sm:px-12 gap-2 max-w-lg">
                    <span className="text-indigo-400 text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> Featured Sector Title
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tighter leading-none font-display">NEON SNAKE OVERDRIVE</h2>
                    <p className="text-xs text-slate-350 leading-relaxed font-sans mt-1">Navigate the grid walls, swallow glowing data pellets under dark-ambient electronic beats, and unlock global scoreboard bragging rights instantly.</p>
                    
                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => {
                          const snakeGame = games.find(g => g.id === "neon-snake") || games[0];
                          setSelectedGame(snakeGame);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                      >
                        Launch Direct Stream
                      </button>
                      <button 
                        onClick={() => {
                          const randomG = games[Math.floor(Math.random() * games.length)];
                          setSelectedGame(randomG);
                        }}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                      >
                        Lucky Seed Matchmaker
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Grid Header Info Strip */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h2 className="text-sm font-display font-black tracking-widest uppercase text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm animate-pulse"></span>
                  {activeTab === "all" ? "🔥 Stream Discovery Deck" : 
                   activeTab === "favorites" ? "⭐ Call-sign Favorite Sectors" : 
                   activeTab === "curator" ? "🔮 AI Neural Advisor Terminal" : 
                   activeTab === "add" ? "💾 Sector Custom Upload Deck" : 
                   `🎯 ${activeTab.toUpperCase()} Sector Matrix`}
                </h2>
                <span className="text-[9px] uppercase font-mono text-slate-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  {filteredGames.length} Registered Nodes
                </span>
              </div>

              {/* DYNAMIC CONTENT SWITCH CHRYSOCOLLA */}
              {activeTab === "curator" ? (
                /* AI CURATOR MODULE */
                <section className="bg-[#0F0F12] border border-white/10 rounded-2xl p-6 relative shadow-xl space-y-6 animate-fade-in">
                  <div className="max-w-xl">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> EXPERT MACHINE BRAIN</span>
                    <h3 className="font-display font-black text-2xl text-white uppercase mt-1">GENIE AI SECTOR ADVISOR</h3>
                    <p className="text-slate-400 text-xs mt-1">Examine your real-time emotional vectors to find the exact unblocked entertainment node matching your current mental bandwidth.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">CURRENT MOOD MATRIX</label>
                      <select 
                        value={userMood} 
                        onChange={(e) => setUserMood(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-[#0F0F12] text-slate-100 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Chill & Flow state">Chill & Relaxed / Grid Flow</option>
                        <option value="Excited & Energetic">Excited & High Adrenaline</option>
                        <option value="Frustrated & Competitive">Determined & Challenged</option>
                        <option value="Bored // Need distraction">Bored // Casual distraction</option>
                        <option value="Intellectual & Strategic">Logical & Brain Exercising</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">ORGANIC CATEGORY FOCUS</label>
                      <select 
                        value={userCurationGenre} 
                        onChange={(e) => setUserCurationGenre(e.target.value)} 
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/10 bg-[#0F0F12] text-slate-100 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Arcade">Speed Arcade & Score Chasing</option>
                        <option value="Puzzle">Geometry Puzzles & Logic</option>
                        <option value="Action">Space Flight & Hazard Dodging</option>
                        <option value="Text RPG">AI Text Adventure & Lore</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={requestRecommendation}
                    disabled={recommendationLoading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-display text-xs font-semibold rounded-xl border border-white/10 shadow-lg tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    {recommendationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {recommendationLoading ? "SYNTHESIZING MATRIX DECISION..." : "CALCULATE IDEAL SYSTEM NODE"}
                  </button>

                  {/* AI Recommendations Results */}
                  {aiRecommendations.length > 0 && (
                    <div className="mt-8 space-y-4 animate-fade-in border-t border-white/5 pt-6">
                      <h4 className="font-display font-semibold text-[10px] tracking-wider uppercase text-slate-400 mb-2">GENERATOR COMPILATION RECOMMENDATIONS:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiRecommendations.map((rec, ri) => (
                          <div key={ri} className="p-4 bg-[#121216]/50 border border-white/5 rounded-xl relative hover:border-indigo-500/20 transition-all flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase">{rec.type}</span>
                                <span className="text-[8px] font-mono text-slate-450 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{rec.difficulty}</span>
                              </div>
                              <h5 className="font-display font-bold text-sm text-white">{rec.title}</h5>
                              <p className="text-slate-405 text-xs text-slate-400 mt-1 lines-clamp-3">{rec.description}</p>
                            </div>
                            <div className="pt-2 border-t border-white/5 font-mono text-[8px] text-indigo-300 flex items-center gap-1 uppercase font-bold">
                              🛡️ Trophy: {rec.achievement}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ) : activeTab === "add" ? (
                /* ADD GAME FORM */
                <section className="bg-[#0F0F12] border border-white/10 p-6 rounded-2xl relative shadow-xl space-y-6 animate-fade-in">
                  <div className="max-w-xl">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1">💾 DISK CONFIGURATION WRITER</span>
                    <h3 className="font-display font-black text-2xl text-white uppercase mt-1">UPLOAD UNBLOCKED ARCADE PORTAL</h3>
                    <p className="text-slate-405 text-xs text-slate-400 mt-1">Integrate any clean external unblocked game URL or iframe stream into your personal sidebar browser. Persists locally on-device.</p>
                  </div>

                  <form onSubmit={handleAddGame} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">GAME NODE TITLE (MAX 24 CHARS)</label>
                        <input
                          type="text"
                          required
                          maxLength={24}
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="e.g. Slither Arena"
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 mb-1 font-bold">GRID SECTOR</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-[#0F0F12] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Arcade">Arcade</option>
                          <option value="Puzzle">Puzzle</option>
                          <option value="Action">Action</option>
                          <option value="Retro">Retro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">WEB IFRAME EMBED PORT URL</label>
                        <input
                          type="url"
                          required
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          placeholder="https://example.com/play-embed"
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">COVER IMAGE URL (OPTIONAL)</label>
                        <input
                          type="text"
                          value={customThumbnail}
                          onChange={(e) => setCustomThumbnail(e.target.value)}
                          placeholder="Direct PNG/JPG cover image link"
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">ONE LINE DESCRIPTION BRIEF</label>
                        <textarea
                          rows={2}
                          value={customDesc}
                          onChange={(e) => setCustomDesc(e.target.value)}
                          placeholder="Slither around and digest pixels with friends..."
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="block text-[8px] uppercase font-mono text-slate-400 font-bold">HARDWARE / INPUT HOTKEYS</label>
                        <textarea
                          rows={2}
                          value={customControls}
                          onChange={(e) => setCustomControls(e.target.value)}
                          placeholder="Arrows to move, Space to boost power level."
                          className="w-full text-xs px-3 py-2 border border-white/10 rounded-xl bg-transparent text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-display font-bold text-[10px] uppercase tracking-wider rounded-xl border border-white/15 cursor-pointer shadow-lg active:scale-95 transition-all text-center"
                    >
                      COMPOUND NODE TO DISK DATABASE
                    </button>
                  </form>
                </section>
              ) : (
                /* MAIN GAME CARD BENTO INTERACTIVE GRID */
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <div 
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      className="bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group hover:bg-[#121216] relative flex flex-col justify-between"
                      style={{ height: "305px" }}
                    >
                      {/* Favorite/Unfavorite quick star toggle */}
                      <button
                        onClick={(e) => toggleFavorite(game.id, e)}
                        className="absolute top-2.5 left-2.5 p-1.5 bg-black/60 hover:bg-black/80 rounded-xl z-20 text-slate-300 hover:text-amber-400 transition-all border border-white/10 active:scale-90 shadow-md cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${game.isFavorite ? "text-amber-400 fill-amber-400" : ""}`} />
                      </button>

                      {/* Cover element */}
                      {renderThumbnail(game)}

                      {/* Metadata Details strip */}
                      <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-[#0A0A0F]/90">
                        <div>
                          <h3 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-wide group-hover:text-indigo-400 transition-colors leading-tight">{game.title}</h3>
                          <p className="text-slate-400 text-[11px] font-sans mt-1 leading-relaxed line-clamp-2">{game.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 font-mono text-[9px] text-slate-500">
                          <span className="flex items-center gap-1 uppercase font-semibold"><Compass className="w-3 h-3 text-indigo-400" /> {game.url === "local-canvas" ? "NATIVE MATRIX" : "EXTERNAL SECTOR"}</span>
                          <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-all flex items-center gap-0.5">LAUNCH <ChevronRight className="w-3.5 h-3.5" /></span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredGames.length === 0 && (
                    <div className="col-span-full text-center p-12 bg-[#0F0F12] rounded-2xl border border-white/10 flex flex-col gap-2 items-center justify-center">
                      <Gamepad2 className="w-10 h-10 text-slate-600 animate-pulse" />
                      <h4 className="font-display text-white text-base font-bold">No Games Registered in Sector</h4>
                      <p className="text-slate-400 font-mono text-xs max-w-sm leading-relaxed">Adjust your active filter tabs, or select 'Upload Game' inside the dashboard portal to mount new iframe urls.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Extra game lore details at bottom of grid */}
              <section className="bg-gradient-to-r from-[#0F0F12]/80 to-[#0A0A0F]/80 border border-white/5 rounded-2xl p-6 shadow-xl relative grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-indigo-400 text-xs uppercase">👾 NATIVE RENDER HARDWARE</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Built-in high performance state loops run purely client-side inside standard HTML canvases. Direct offline access is optimized to bypass active firewall locks.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-indigo-400 text-xs uppercase font-mono">🔑 EMBEDDABLE URL MATRIX</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Mount dynamic browser games via direct iframe tunnel endpoints. Save, export, or reload complete sector configurations seamlessly via JSON backups.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-indigo-400 text-xs uppercase">🔮 SYSTEM NEURAL COMPANION</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Equipped with standard conversational telemetry cores. Communicate with CHIP inside your sidebar panel to organize high frequency strategies instantly.</p>
                </div>
              </section>

            </div>

            {/* RIGHT SIDE STATIC COMPANION BAR (ACTIVE CHIP PANEL ON HOME AS WELL!) */}
            {sidebarChatOpen && (
              <div className="lg:col-span-1 h-full min-h-[460px]">
                <div className="sticky top-20">
                  <GameGenie />
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>

      {/* Cyber Credits footer overlay */}
      <footer className="w-full bg-[#0A0A0E] py-8 border-t border-white/5 text-center relative z-10 text-[10px] text-slate-500 font-mono">
        <p className="uppercase tracking-wider font-bold">ARCADE NEBULA // DESIGNED AND CURATED BY USER MATRIX SYSTEMS 🕹️</p>
        <p className="opacity-60 mt-1 max-w-2xl mx-auto px-4 leading-normal">ALL BROWSER VECTORS GENERATED LIVE ON CLIENT GRAPHIC CHIPSET ACCELERATION. ALL WEB LINK STREAMS RUN ISOLATED UNDER BROWSER SECURED COMPONENT SANDBOX ENVIRONMENT CONTROLLER.</p>
      </footer>
    </div>
  );
}
