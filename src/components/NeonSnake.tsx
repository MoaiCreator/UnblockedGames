import React, { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert } from "lucide-react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export default function NeonSnake() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game States
  const [gameState, setGameState] = useState<"idle" | "running" | "paused" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("arcade_snake_highscore") || "0");
  });
  const [muted, setMuted] = useState(false);

  // References to keep loop state synchronous & fast
  const snakeRef = useRef<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 15, y: 10 });
  const isSpecialFoodRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const loopTimeoutRef = useRef<any>(null);

  // Board definitions (represented as grid units)
  const gridWidth = 32;
  const gridHeight = 20;

  // Synths for Retro Audio (Synthesized on-the-fly using Web Audio API)
  const playBeep = (frequency: number, duration: number, type: OscillatorType = "sine") => {
    if (muted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if sound system is blocked by browser interaction policy
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const dir = directionRef.current;

      if ((key === "arrowup" || key === "w") && dir.y === 0) {
        nextDirectionRef.current = { x: 0, y: -1 };
      } else if ((key === "arrowdown" || key === "s") && dir.y === 0) {
        nextDirectionRef.current = { x: 0, y: 1 };
      } else if ((key === "arrowleft" || key === "a") && dir.x === 0) {
        nextDirectionRef.current = { x: -1, y: 0 };
      } else if ((key === "arrowright" || key === "d") && dir.x === 0) {
        nextDirectionRef.current = { x: 1, y: 0 };
      } else if (e.key === " " && (gameState === "idle" || gameState === "gameover")) {
        e.preventDefault();
        startGame();
      } else if (e.key === "Escape" && gameState === "running") {
        setGameState("paused");
      } else if (e.key === "Escape" && gameState === "paused") {
        setGameState("running");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Handle high score updates
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("arcade_snake_highscore", String(score));
    }
  }, [score, highScore]);

  // Spawn food randomly
  const spawnFood = () => {
    let newX, newY;
    let collision = true;

    while (collision) {
      newX = Math.floor(Math.random() * gridWidth);
      newY = Math.floor(Math.random() * gridHeight);
      collision = snakeRef.current.some(segment => segment.x === newX && segment.y === newY);
    }

    foodRef.current = { x: newX || 15, y: newY || 10 };
    isSpecialFoodRef.current = Math.random() < 0.2; // 20% chance of high point mega orb
  };

  // Start/Restart Game Logic
  const startGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    particlesRef.current = [];
    setScore(0);
    spawnFood();
    setGameState("running");
    playBeep(440, 0.1, "triangle");
    setTimeout(() => playBeep(660, 0.15, "triangle"), 100);
  };

  // Add glowing particle bursts
  const emitParticles = (x: number, y: number, color: string, count: number = 15) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width / gridWidth;
    const ch = canvas.height / gridHeight;

    const px = (x + 0.5) * cw;
    const py = (y + 0.5) * ch;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 2 + Math.random() * 3,
      });
    }
  };

  // Frame Rendering Loop (Canvas graphics)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear with micro-trail opacity for slight motion blur!
      ctx.fillStyle = "rgba(9, 9, 14, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid coordinates subtly for gaming HUD feel
      ctx.strokeStyle = "rgba(138, 43, 226, 0.04)";
      ctx.lineWidth = 1;
      const cw = canvas.width / gridWidth;
      const ch = canvas.height / gridHeight;

      for (let i = 0; i <= gridWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cw, 0);
        ctx.lineTo(i * cw, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j <= gridHeight; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * ch);
        ctx.lineTo(canvas.width, j * ch);
        ctx.stroke();
      }

      // 1. Render Food (Orb with radial gradient pulse and outward glow)
      const food = foodRef.current;
      const isMega = isSpecialFoodRef.current;
      const fRadius = (isMega ? 0.45 : 0.35) * Math.min(cw, ch);
      const fx = (food.x + 0.5) * cw;
      const fy = (food.y + 0.5) * ch;

      const foodColor = isMega ? "#ff007f" : "#00f0ff";
      ctx.shadowBlur = isMega ? 15 : 10;
      ctx.shadowColor = foodColor;

      const gradient = ctx.createRadialGradient(fx, fy, 2, fx, fy, fRadius);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.4, foodColor);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(fx, fy, fRadius + Math.sin(Date.now() / 100) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Reset shadows for details
      ctx.shadowBlur = 0;

      // 2. Render Snake Segments with a cybernetic laser glow
      const snake = snakeRef.current;
      snake.forEach((segment, idx) => {
        const sx = segment.x * cw;
        const sy = segment.y * ch;

        // Gradient from index (Heads glow cyan, tail fades to violet)
        const progress = idx / snake.length;
        const segColor = idx === 0 
          ? "#00f0ff" 
          : `rgba(${Math.floor(138 + progress * 117)}, ${Math.floor(43 - progress * 43)}, ${Math.floor(226 + progress * 29)}, ${1 - progress * 0.5})`;

        ctx.fillStyle = segColor;
        ctx.shadowBlur = idx === 0 ? 12 : 4;
        ctx.shadowColor = segColor;

        // Rounded segments
        const padding = 1.5;
        const size = Math.min(cw, ch);
        ctx.beginPath();
        ctx.arc(sx + cw / 2, sy + ch / 2, size / 2 - padding, 0, Math.PI * 2);
        ctx.fill();

        // Eye lights for the snake head
        if (idx === 0) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          // Position eye based on direction
          const eyeOffset = size / 5;
          const ex = sx + cw / 2 + directionRef.current.x * eyeOffset;
          const ey = sy + ch / 2 + directionRef.current.y * eyeOffset;
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // 3. Render and Update Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.size *= 0.96;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. Draw Score HUD on top of canvas
      if (gameState === "paused") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00f0ff";
        ctx.font = "bold 20px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED // INTERRUPT ESC", canvas.width / 2, canvas.height / 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Physics Movement Update Loop (Server-like timing)
  useEffect(() => {
    if (gameState !== "running") return;

    const interval = Math.max(70, 140 - Math.floor(score / 5) * 6); // Speeds up as score escalates

    const move = () => {
      // Sync direction
      directionRef.current = nextDirectionRef.current;
      const head = snakeRef.current[0];
      const dir = directionRef.current;

      const newHead = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Collision checks with boundaries
      if (newHead.x < 0 || newHead.x >= gridWidth || newHead.y < 0 || newHead.y >= gridHeight) {
        gameOverTrigger();
        return;
      }

      // Self-collision checks
      const selfCollide = snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y);
      if (selfCollide) {
        gameOverTrigger();
        return;
      }

      // Move snake segments
      const updatedSnake = [newHead, ...snakeRef.current];

      // Check food consumption
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        const gainedPoints = isSpecialFoodRef.current ? 15 : 5;
        setScore(prev => prev + gainedPoints);
        emitParticles(foodRef.current.x, foodRef.current.y, isSpecialFoodRef.current ? "#ff007f" : "#00f0ff", 20);
        playBeep(600 + gainedPoints * 20, 0.12, "triangle");
        spawnFood();
      } else {
        updatedSnake.pop(); // Remove tail segment to slide forward
      }

      snakeRef.current = updatedSnake;
      loopTimeoutRef.current = setTimeout(move, interval);
    };

    loopTimeoutRef.current = setTimeout(move, interval);
    return () => clearTimeout(loopTimeoutRef.current);
  }, [gameState, score]);

  const gameOverTrigger = () => {
    setGameState("gameover");
    playBeep(260, 0.25, "sawtooth");
    playBeep(180, 0.4, "sawtooth");
  };

  // ResizeObserver for absolute responsive stage scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const w = container.clientWidth;
      // Maintain neat 16:10 or 16:9 widescreen ratio
      const h = Math.min(window.innerHeight * 0.55, w * (10 / 16));

      // Increase scale for crisp high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    observer.observe(containerRef.current);
    handleResize(); // Initial setup

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-[#0a0a14] border border-[#8a2be2]/30 rounded-2xl overflow-hidden shadow-2xl relative glow-violet">
      {/* Game HUD Bar */}
      <div className="flex justify-between items-center bg-[#12121e]/80 border-b border-[#8a2be2]/20 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
            👾 NEON SNAKE ULTRA
          </span>
          <div className="hidden sm:flex text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded px-2 py-0.5 animate-pulse">
            SPEED LEVEL: {Math.min(10, 1 + Math.floor(score / 20))}
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[13px]">
          <div>
            <span className="text-gray-400 mr-2">HI-SCORE</span>
            <span className="font-bold text-pink-500 text-lg">{highScore}</span>
          </div>
          <div>
            <span className="text-gray-400 mr-2">RAW SCORE</span>
            <span className="font-bold text-[#00f0ff] text-lg">{score}</span>
          </div>
          {/* Mute buttons */}
          <button 
            onClick={() => setMuted(!muted)}
            className="p-1.5 text-gray-400 hover:text-[#00f0ff] transition-all bg-[#171727] rounded border border-gray-800"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div 
        ref={containerRef} 
        className="w-full relative bg-[#09090e] overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} className="block mx-auto" />

        {/* Overlay screens based on game state */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col justify-center items-center p-6 text-center z-20">
            <div className="float-element flex flex-col items-center">
              <span className="text-7xl mb-4">🐍</span>
              <h2 className="font-display text-4xl font-extrabold text-[#00f0ff] tracking-tight glow-text uppercase">
                LOAD COIN // READY PLAYER ONE
              </h2>
              <p className="text-gray-400 font-mono mt-2 text-xs max-w-md uppercase tracking-wider">
                Steer the snake head. Gather glowing orbs. Don't hit the neon borders or yourself!
              </p>
              <button
                onClick={startGame}
                className="mt-6 flex items-center gap-2 px-8 py-3 bg-[#8a2be2] hover:bg-[#a144ff] active:scale-95 text-white font-display font-medium rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg shadow-purple-900/40"
              >
                <Play className="w-5 h-5 fill-white" /> START GAME
              </button>
            </div>
            <div className="absolute bottom-6 font-mono text-[11px] text-gray-500 animate-pulse">
              [PRESS SPACEBAR OR CLICK BUTTON TO INITIATE]
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-[#09090e]/95 flex flex-col justify-center items-center p-6 text-center z-20">
            <ShieldAlert className="w-16 h-16 text-pink-500 animate-bounce mb-3" />
            <h2 className="font-display text-5xl font-black text-pink-500 tracking-wider">
              WASTED // GAME OVER
            </h2>
            <p className="text-gray-400 font-mono mt-2 text-xs uppercase">
              You scored <span className="text-cyan-400 font-bold">{score}</span> points! High score is <span className="text-pink-500 font-bold">{highScore}</span>.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-display font-medium rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg shadow-pink-900/30"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN
              </button>
              <button 
                onClick={() => setGameState("idle")}
                className="px-6 py-3 bg-[#1c1c2e] hover:bg-[#25253b] text-gray-300 font-mono text-xs rounded-xl border border-gray-800 transition-all"
              >
                BACK TO GALLERY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Instruction Bar */}
      <div className="bg-[#12121e]/40 px-6 py-3 border-t border-[#8a2be2]/15 flex flex-wrap justify-between items-center text-xs text-gray-400 font-mono">
        <span className="flex items-center gap-1">
          🎮 Controls: <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">WASD</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">ARROW KEYS</kbd> to change direction.
        </span>
        <span className="hidden sm:inline">
          ⭐ Special Orb: Pink mega-orbs grant <span className="text-pink-500 font-bold">+15pts</span>!
        </span>
      </div>
    </div>
  );
}
