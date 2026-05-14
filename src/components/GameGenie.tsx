import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Gamepad2, Skull, RefreshCw, Key, HelpCircle, Terminal } from "lucide-react";
import { Message } from "../types";

export default function GameGenie() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("genie_chat_history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "👋 *Greetings, Player One!* I am **Nebula**, your digital sidekick in the ArcadeNebula void! 🌌🕹️\n\nI can recommend unblocked games based on your mood, walk you through cheat codes, or act as a **Text Adventure Master**! \n\nWhat are we playing today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync conversation to local storage
  useEffect(() => {
    localStorage.setItem("genie_chat_history", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mascot dynamic facial expressions based on chatbot status
  const getMascotExpression = () => {
    if (loading) return "⊙_⊙"; // thinking
    if (isTypingAnimation) return "^ω^"; // active typing
    if (messages.length > 5) return "◕‿◕"; // happy companion
    return "👁️‿👁️"; // curious mascot
  };

  // Chat message submission
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (!textToSend) {
      setInputMessage("");
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setIsTypingAnimation(true);

    try {
      // Fetch server-side Gemini api proxy endpoint securely
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // Limit history context to last 6 turns to keep token size fast and clean
          history: messages.slice(-6)
        })
      });

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "I apologize, but my cosmic transceiver encountered an interference loop. Let's reboot and try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Game Genie connection error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ *Cosmic Static:* Connection to the main sever was interrupted. If your development server is cold-starting or doesn't have an active key, try making sure the secret setting is configured!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
      setIsTypingAnimation(false);
    }
  };

  // Helper template triggers
  const executeHelper = (type: string) => {
    let promptText = "";
    if (type === "recommend") {
      promptText = "Could you suggest some cyber-arcade games based on a high-energy mood? I want something fast and competitive!";
    } else if (type === "cheat") {
      promptText = "Do you have any retro cheat codes or walkthrough tips for Snake or Space shooter games?";
    } else if (type === "rpg") {
      promptText = "I want to play an interactive cyber-themed Text RPG adventure game! Put me in the shoes of a rogue neon hacker inside a mega arcade grid and initiate Turn 1.";
    } else if (type === "lore") {
      promptText = "What's the galactic history and lore of the ArcadeNebula void?";
    }
    handleSendMessage(promptText);
  };

  const clearChat = () => {
    if (window.confirm("Do you want to reset the neural buffer with Nebula? All chat logs will be wiped.")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "✅ *Neural buffer reset complete.* Log synchronized! Nebula ready for new commands. 🌌🕹️",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="w-full h-full bg-[#12121e]/90 border border-[#8a2be2]/20 rounded-2xl flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl relative">
      {/* Top Banner with Mascot Animation */}
      <div className="bg-[#181827] border-b border-[#8a2be2]/15 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated Mascot Head */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8a2be2] to-[#ff007f] p-[1.5px] shadow-lg relative cursor-pointer group">
            <div className="w-full h-full bg-[#0a0a0f] rounded-lg flex flex-col justify-center items-center overflow-hidden transition-all relative">
              {/* Scanlines on Mascot */}
              <div className="absolute inset-x-0 top-0 h-1 bg-[#00f0ff]/10 animate-ping" />
              
              <span className="font-mono text-xs font-bold text-[#00f0ff] animate-pulse">
                {getMascotExpression()}
              </span>
            </div>
            {/* Online notification dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border border-[#0a0a0f] rounded-full animate-pulse" />
          </div>

          <div>
            <h3 className="font-display font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff007f] tracking-wide flex items-center gap-1">
              NEBULA // GAME GENIE <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[10px] font-mono text-gray-400 tracking-wider">SECURE NEURAL CHIP DIRECT</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          className="text-gray-500 hover:text-pink-500 p-1.5 rounded-lg hover:bg-pink-950/20 transition-all text-xs font-mono border border-transparent hover:border-pink-900/30 flex items-center gap-1"
          title="Clear Buffer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REBOOT
        </button>
      </div>

      {/* Message Feed Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px] max-h-[480px]">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start animate-fade-in"}`}
          >
            {/* Meta tags */}
            <span className="text-[10px] font-mono text-gray-500 mb-1 tracking-wider uppercase">
              {msg.role === "user" ? "Player_One" : "Genie_Nebula"} <span className="opacity-60">{msg.timestamp}</span>
            </span>

            {/* Bubble contents */}
            <div 
              className={`p-3.5 rounded-xl text-sm leading-relaxed border font-sans whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-[#8a2be2]/10 border-[#8a2be2]/30 text-purple-100 rounded-tr-none glow-violet"
                  : "bg-[#181827] border-[#8a2be2]/15 text-gray-200 rounded-tl-none pr-4 scroll-smooth"
              }`}
            >
              {/* Support rendering basic custom bold, markdown lists, code tags cleanly */}
              {msg.content.split("\n").map((line, li) => {
                // Parse bullet points
                if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
                  return <div key={li} className="pl-3 py-0.5 text-gray-300 flex items-start gap-1">⏱️ {line.replace(/^[\s*-]+/, "").replace(/\*\*|_\*/g, "")}</div>;
                }
                // Parse headers
                if (line.startsWith("###")) {
                  return <h4 key={li} className="font-display font-medium text-xs text-white uppercase tracking-wider py-1.5 border-b border-gray-800 flex items-center gap-1">⚡ {line.replace("###", "")}</h4>;
                }
                if (line.startsWith("##") || line.startsWith("#")) {
                  return <h3 key={li} className="font-display font-bold text-sm text-[#00f0ff] tracking-wide pt-2 pb-1">{line.replace(/##|#/g, "")}</h3>;
                }
                return <p key={li} className="min-h-[1rem]">{line}</p>;
              })}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col mr-auto items-start max-w-[80%] animate-pulse">
            <span className="text-[10px] font-mono text-gray-500 mb-1 tracking-wider">NEBULA // STREAMING</span>
            <div className="bg-[#181827] border border-[#8a2be2]/15 p-3 rounded-xl rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-[#8a2be2] rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-[#ff007f] rounded-full animate-bounce delay-200" />
              <span className="text-xs font-mono text-[#00f0ff]">Decompressing telemetry...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Prompts / Instant microchips */}
      <div className="px-4 py-2 bg-[#12121e] border-t border-[#8a2be2]/10 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none items-center">
        <button
          onClick={() => executeHelper("recommend")}
          className="px-2.5 py-1.5 bg-[#1a1329] border border-[#8a2be2]/30 text-[#00f0ff] font-mono text-[10px] rounded hover:border-[#00f0ff] hover:bg-[#1f1636] transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Gamepad2 className="w-3 h-3" /> MATCH VIBE
        </button>
        <button
          onClick={() => executeHelper("rpg")}
          className="px-2.5 py-1.5 bg-[#29131e] border border-[#ff007f]/30 text-[#ff007f] font-mono text-[10px] rounded hover:border-[#ff007f] hover:bg-[#361626] transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Terminal className="w-3 h-3" /> TEXT RPG
        </button>
        <button
          onClick={() => executeHelper("cheat")}
          className="px-2.5 py-1.5 bg-[#132429] border border-cyan-800/40 text-cyan-400 font-mono text-[10px] rounded hover:border-cyan-400 hover:bg-[#163038] transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Skull className="w-3 h-3" /> CHEATS Walk
        </button>
      </div>

      {/* Footer Textbar Input */}
      <div className="p-3 bg-[#181827] border-t border-[#8a2be2]/15">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type code command or question..."
            disabled={loading}
            className="flex-1 bg-[#101017] text-white border border-[#8a2be2]/30 rounded-xl px-4 py-2.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-[#00f0ff]"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2.5 bg-[#8a2be2] hover:bg-[#a144ff] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95 cursor-pointer glow-violet flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
