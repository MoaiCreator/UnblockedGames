import React, { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Volume2, VolumeX, ShieldCheck, Zap } from "lucide-react";

interface Asteroid {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  vertices: number;
  offsets: number[];
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: "shield" | "multishot";
  size: number;
  vy: number;
  pulseFlag: number;
}

export default function VoidExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [gameState, setGameState] = useState<"idle" | "running" | "paused" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem("arcade_void_highscore") || "0");
  });
  const [muted, setMuted] = useState(false);
  const [activeWeapon, setActiveWeapon] = useState("Standard Laser");
  const [shieldActive, setShieldActive] = useState(false);

  // Keyboard controls status
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Physics Loop Sync variables
  const shipRef = useRef({ x: 300, y: 350, r: 15, vx: 0, vy: 0, maxSpeed: 6.5, friction: 0.96 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const lastShotRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; speed: number; size: number }[]>([]);

  // Weapon details
  const weaponStateRef = useRef({ multishotTimer: 0, shieldActive: false });

  // Web Audio Synth
  const playPulse = (freq: number, type: OscillatorType = "sine", duration: number = 0.1, rampTo: number = 0.001) => {
    if (muted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      if (rampTo !== freq) {
        osc.frequency.exponentialRampToValueAtTime(rampTo, audioCtx.currentTime + duration);
      }

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio system waiting for user gesture
    }
  };

  // Setup parallax star particles
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        speed: 0.2 + Math.random() * 0.8,
        size: 0.5 + Math.random() * 1.5,
      });
    }
    starsRef.current = stars;
  }, []);

  // Keyboard monitors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      if (e.key === " " && (gameState === "idle" || gameState === "gameover")) {
        e.preventDefault();
        startGame();
      } else if (e.key === "Escape" && gameState === "running") {
        setGameState("paused");
      } else if (e.key === "Escape" && gameState === "paused") {
        setGameState("running");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Sync highscore
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("arcade_void_highscore", String(score));
    }
  }, [score, highScore]);

  // Trigger game start
  const startGame = () => {
    shipRef.current = { x: 300, y: 350, r: 15, vx: 0, vy: 0, maxSpeed: 6.5, friction: 0.96 };
    asteroidsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    weaponStateRef.current = { multishotTimer: 0, shieldActive: false };
    
    setScore(0);
    setShieldActive(false);
    setActiveWeapon("Standard Laser");
    setGameState("running");

    // Intro music chirp
    playPulse(150, "sine", 0.15, 600);
    setTimeout(() => playPulse(300, "triangle", 0.15, 900), 100);
  };

  // Spark explosions
  const emitExplosion = (x: number, y: number, color: string, count: number = 18) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: 1 + Math.random() * 3,
      });
    }
  };

  // Spawns asteroid
  const spawnAsteroid = (cw: number) => {
    const size = 20 + Math.random() * 35;
    const vertices = 7 + Math.floor(Math.random() * 6);
    const offsets = [];
    for (let i = 0; i < vertices; i++) {
      offsets.push(0.85 + Math.random() * 0.3); // irregular geometric shape offsets
    }

    const startX = Math.random() * cw;
    const startY = -40;

    // Movement targeted downward slightly drifting
    const vy = 1.2 + Math.random() * 2.2 + (score / 200) * 0.3;
    const vx = -0.8 + Math.random() * 1.6;

    const asteroidColors = ["#8a2be2", "#bf55ec", "#ff007f", "#3a539b"];
    const color = asteroidColors[Math.floor(Math.random() * asteroidColors.length)];

    asteroidsRef.current.push({
      x: startX,
      y: startY,
      size,
      vx,
      vy,
      vertices,
      offsets,
      color,
    });
  };

  // Spawns positive powerups
  const spawnPowerUp = (cw: number) => {
    const randomType = Math.random() < 0.5 ? "shield" : "multishot";
    powerUpsRef.current.push({
      x: 50 + Math.random() * (cw - 100),
      y: -20,
      type: randomType,
      size: 12,
      vy: 1.5,
      pulseFlag: 0,
    });
  };

  // Frame engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;
    let powerUpTimer = 0;

    const render = () => {
      const cw = canvas.width;
      const ch = canvas.height;

      // Draw galactic deep navy backdrop with trailing decay
      ctx.fillStyle = "rgba(9, 9, 14, 0.28)";
      ctx.fillRect(0, 0, cw, ch);

      // Starfield parallax background moving downwards
      starsRef.current.forEach(star => {
        if (gameState === "running") {
          star.y += star.speed;
          if (star.y > ch) {
            star.y = 0;
            star.x = Math.random() * cw;
          }
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.speed * 0.6})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // 1. GAME PHYSICS (ONLY EVALUATE WHEN RUNNING)
      if (gameState === "running") {
        spawnTimer++;
        powerUpTimer++;

        // Asteroid frequency increases with points
        const asteroidInterval = Math.max(25, 60 - Math.floor(score / 40) * 3);
        if (spawnTimer >= asteroidInterval) {
          spawnAsteroid(cw);
          spawnTimer = 0;
        }

        // Powerup drops every 15-20 seconds
        if (powerUpTimer >= 700) {
          spawnPowerUp(cw);
          powerUpTimer = 0;
        }

        // Adjust spaceship parameters based on keyboard keys
        const ship = shipRef.current;
        const keys = keysRef.current;

        let ax = 0;
        let ay = 0;
        const accel = 0.45;

        if (keys["w"] || keys["arrowup"]) ay -= accel;
        if (keys["s"] || keys["arrowdown"]) ay += accel;
        if (keys["a"] || keys["arrowleft"]) ax -= accel;
        if (keys["d"] || keys["arrowright"]) ax += accel;

        // Apply physical vectors
        ship.vx = Math.max(-ship.maxSpeed, Math.min(ship.maxSpeed, ship.vx + ax));
        ship.vy = Math.max(-ship.maxSpeed, Math.min(ship.maxSpeed, ship.vy + ay));
        ship.vx *= ship.friction;
        ship.vy *= ship.friction;

        ship.x += ship.vx;
        ship.y += ship.vy;

        // Contain ship inside grid bounds
        if (ship.x < ship.r) { ship.x = ship.r; ship.vx = 0; }
        if (ship.x > cw - ship.r) { ship.x = cw - ship.r; ship.vx = 0; }
        if (ship.y < ship.r) { ship.y = ship.r; ship.vy = 0; }
        if (ship.y > ch - ship.r) { ship.y = ch - ship.r; ship.vy = 0; }

        // Manage Multi-shot duration timer countdown
        const weaponState = weaponStateRef.current;
        if (weaponState.multishotTimer > 0) {
          weaponState.multishotTimer--;
          if (weaponState.multishotTimer === 0) {
            setActiveWeapon("Standard Laser");
            playPulse(300, "sawtooth", 0.1, 150);
          }
        }

        // Automatic Shooter: Fires at interval when Space is held down
        if (keys[" "] && Date.now() - lastShotRef.current > 180) {
          const isMulti = weaponState.multishotTimer > 0;
          if (isMulti) {
            // Three divergent projectile streams
            bulletsRef.current.push(
              { x: ship.x, y: ship.y - 10, vx: 0, vy: -9, color: "#ff007f" },
              { x: ship.x - 8, y: ship.y - 5, vx: -2, vy: -8, color: "#ff007f" },
              { x: ship.x + 8, y: ship.y - 5, vx: 2, vy: -8, color: "#ff007f" }
            );
            playPulse(440, "sine", 0.08, 1200);
          } else {
            // Singular plasma bullet
            bulletsRef.current.push({ x: ship.x, y: ship.y - 12, vx: 0, vy: -10, color: "#00f0ff" });
            playPulse(520, "sine", 0.08, 1000);
          }
          lastShotRef.current = Date.now();

          // Recoil sparks
          for (let j = 0; j < 3; j++) {
            particlesRef.current.push({
              x: ship.x,
              y: ship.y - 12,
              vx: -0.5 + Math.random(),
              vy: 2 + Math.random() * 2,
              color: isMulti ? "#ff007f" : "#00f0ff",
              alpha: 0.8,
              size: 2,
            });
          }
        }

        // Update active lasers
        const bullets = bulletsRef.current;
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -15 || b.x < -15 || b.x > cw + 15) {
            bullets.splice(i, 1);
          }
        }

        // Update floaty power-ups
        const powerups = powerUpsRef.current;
        for (let i = powerups.length - 1; i >= 0; i--) {
          const pu = powerups[i];
          pu.y += pu.vy;
          pu.pulseFlag += 0.08;

          // Catch powerup collision
          const dx = pu.x - ship.x;
          const dy = pu.y - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pu.size + ship.r) {
            if (pu.type === "shield") {
              weaponState.shieldActive = true;
              setShieldActive(true);
              playPulse(250, "triangle", 0.25, 800);
            } else if (pu.type === "multishot") {
              weaponState.multishotTimer = 400; // ~10 seconds
              setActiveWeapon("Mega Multi-Shot (x3)");
              playPulse(350, "sine", 0.2, 1100);
            }
            emitExplosion(pu.x, pu.y, pu.type === "shield" ? "#00f0ff" : "#ff007f", 12);
            powerups.splice(i, 1);
            continue;
          }

          if (pu.y > ch + 20) {
            powerups.splice(i, 1);
          }
        }

        // Update downcoming asteroid physics and bullet sweeps
        const asteroids = asteroidsRef.current;
        for (let i = asteroids.length - 1; i >= 0; i--) {
          const ast = asteroids[i];
          ast.x += ast.vx;
          ast.y += ast.vy;

          // If asteroid hits the spaceship
          const dx = ast.x - ship.x;
          const dy = ast.y - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < ast.size * 0.8 + ship.r) {
            // Trigger shields or blow up
            if (weaponState.shieldActive) {
              weaponState.shieldActive = false;
              setShieldActive(false);
              playPulse(180, "sawtooth", 0.3, 80);
              emitExplosion(ast.x, ast.y, "#ffffff", 25);
              asteroids.splice(i, 1);
              continue;
            } else {
              setGameState("gameover");
              playPulse(120, "sawtooth", 0.5, 40);
              emitExplosion(ship.x, ship.y, "#00f0ff", 35);
              emitExplosion(ast.x, ast.y, ast.color, 25);
              return;
            }
          }

          // Bullet hits asteroids
          let asteroidDestroyed = false;
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const adx = ast.x - b.x;
            const ady = ast.y - b.y;
            const adist = Math.sqrt(adx * adx + ady * ady);

            if (adist < ast.size + 4) {
              bullets.splice(j, 1);
              asteroidDestroyed = true;
              break;
            }
          }

          if (asteroidDestroyed) {
            emitExplosion(ast.x, ast.y, ast.color, 16);
            playPulse(220 - ast.size * 2, "sawtooth", 0.15, 60);

            // Large asteroids split into 2 smaller ones
            if (ast.size > 28) {
              const halfSize = ast.size / 2;
              const vaOffset = Math.random() * 2;
              for (let k = 0; k < 2; k++) {
                asteroids.push({
                  x: ast.x,
                  y: ast.y,
                  size: halfSize,
                  vx: (k === 0 ? -1.5 : 1.5) + Math.random(),
                  vy: ast.vy + 0.3,
                  vertices: 6 + Math.floor(Math.random() * 4),
                  offsets: Array.from({ length: 9 }, () => 0.82 + Math.random() * 0.3),
                  color: ast.color,
                });
              }
            }

            setScore(prev => prev + (ast.size > 28 ? 10 : 20));
            asteroids.splice(i, 1);
            continue;
          }

          // Offscreen disposal
          if (ast.y > ch + 40) {
            asteroids.splice(i, 1);
          }
        }
      }

      // Draw powerups
      powerUpsRef.current.forEach(pu => {
        const rad = pu.size + Math.sin(pu.pulseFlag) * 2;
        const color = pu.type === "shield" ? "#38bdf8" : "#f43f5e";

        // Hex shape / Core glow outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const angle = (k / 6) * Math.PI * 2;
          const x = pu.x + Math.cos(angle) * rad;
          const y = pu.y + Math.sin(angle) * rad;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;
        ctx.fillText(pu.type === "shield" ? "🛡️" : "⚡", pu.x, pu.y);
      });

      // 2. RENDERING GAME AGENTS (Symmetrical vector graphics style)
      // Draw Laser bullets
      bulletsRef.current.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        // Bullet represented as light capsule beam
        ctx.rect(b.x - 2, b.y - 12, 4, 12);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw irregular Asteroids
      asteroidsRef.current.forEach(ast => {
        ctx.strokeStyle = ast.color;
        ctx.lineWidth = 1.8;
        ctx.fillStyle = "rgba(18, 18, 30, 0.85)";
        ctx.shadowBlur = 4;
        ctx.shadowColor = ast.color;

        ctx.beginPath();
        for (let idx = 0; idx < ast.vertices; idx++) {
          const angle = (idx / ast.vertices) * Math.PI * 2;
          const r = ast.size * ast.offsets[idx];
          const px = ast.x + Math.cos(angle) * r;
          const py = ast.y + Math.sin(angle) * r;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Spaceship (Sharp, sleek retro fighter layout)
      if (gameState !== "gameover") {
        const ship = shipRef.current;
        const color = shieldActive ? "#00f0ff" : "#ff007f";

        // Flame Thruster effect if traveling upwards
        if (keysRef.current["w"] || keysRef.current["arrowup"]) {
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.moveTo(ship.x - 6, ship.y + 12);
          ctx.lineTo(ship.x + 6, ship.y + 12);
          ctx.lineTo(ship.x, ship.y + 22 + Math.random() * 8);
          ctx.closePath();
          ctx.fill();
        }

        // Draw Ship Body
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.fillStyle = "#0c0d16";
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y - ship.r); // tip
        ctx.lineTo(ship.x + ship.r * 1.1, ship.y + ship.r * 1.0); // right wing
        ctx.lineTo(ship.x, ship.y + ship.r * 0.4); // core back indentation
        ctx.lineTo(ship.x - ship.r * 1.1, ship.y + ship.r * 1.0); // left wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw HUD details on the ship (energy cell)
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y + 1, 2, 0, Math.PI * 2);
        ctx.fill();

        // If shield power-up is active, draw a protective grid shield wrapping
        if (shieldActive) {
          ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#00f0ff";
          ctx.beginPath();
          ctx.arc(ship.x, ship.y, ship.r * 1.8 + Math.sin(Date.now() / 80) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // Draw and Update fading Explosion Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (gameState === "running") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.024;
          p.size *= 0.97;
        }

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

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState, shieldActive, score]);

  // Observer scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const handleResize = () => {
      const w = containerRef.current!.clientWidth;
      const h = Math.min(window.innerHeight * 0.55, w * (10 / 16));

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
    handleResize();

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-[#0a0a14] border border-[#ff007f]/30 rounded-2xl overflow-hidden shadow-2xl relative glow-pink">
      {/* Game Header Metrics HUD */}
      <div className="flex justify-between items-center bg-[#12121e]/80 border-b border-[#ff007f]/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-[#00f0ff] flex items-center gap-1.5 uppercase tracking-wider">
            🚀 VOID EXPLORER
          </span>
          <div className="hidden md:flex text-xs font-mono text-pink-400 bg-pink-950/40 border border-pink-800/40 rounded px-2.5 py-0.5 glow-pink flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-pink-500 animate-pulse" /> WEAPON: {activeWeapon}
          </div>
          {shieldActive && (
            <div className="hidden sm:flex text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded px-2.5 py-0.5 flex items-center gap-1 glow-cyan">
              <ShieldCheck className="w-3.5 h-3.5" /> SHIELD OVERLAY ENERGETIC
            </div>
          )}
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
          <button 
            onClick={() => setMuted(!muted)}
            className="p-1.5 text-gray-400 hover:text-pink-500 transition-all bg-[#171727] rounded border border-gray-800"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Segment */}
      <div 
        ref={containerRef} 
        className="w-full relative bg-[#09090e] overflow-hidden"
        style={{ touchAction: "none" }}
      >
        <canvas ref={canvasRef} className="block mx-auto" />

        {/* State Screen Overlays */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col justify-center items-center p-6 text-center z-20">
            <div className="float-element flex flex-col items-center">
              <span className="text-7xl mb-4">🛸</span>
              <h2 className="font-display text-4xl font-extrabold text-[#ff007f] tracking-tight glow-text uppercase">
                COSMIC HYPERCELL // STANDBY
              </h2>
              <p className="text-gray-400 font-mono mt-2 text-xs max-w-sm uppercase tracking-wider">
                Steer the geometry starfighter. Laser asteroids. Grab green shields 🛡️ and red rapid-fire ⚡ powercells!
              </p>
              <button
                onClick={startGame}
                className="mt-6 flex items-center gap-2 px-8 py-3 bg-[#ff007f] hover:bg-[#ff449f] active:scale-95 text-white font-display font-medium rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg shadow-pink-900/40"
              >
                <Play className="w-5 h-5 fill-white" /> START VOYAGE
              </button>
            </div>
            <div className="absolute bottom-6 font-mono text-[11px] text-gray-500 animate-pulse">
              [PRESS SPACEBAR OR CLICK INITIATION SWITCH]
            </div>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center p-6 text-center z-20">
            <h2 className="font-display text-4xl font-extrabold text-cyan-400 uppercase">
              FLIGHT PAUSED // ESC TO CAPTURE
            </h2>
            <button
              onClick={() => setGameState("running")}
              className="mt-4 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs rounded-xl"
            >
              RESUME WARP DRIVE
            </button>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/92 flex flex-col justify-center items-center p-6 text-center z-20 animate-fade-in">
            <span className="text-6xl mb-3">💥</span>
            <h2 className="font-display text-5xl font-black text-pink-500 tracking-wider">
              HULL DESTROYED // CRITICAL FAILURE
            </h2>
            <p className="text-gray-400 font-mono mt-1 text-xs">
              Maneuvered score of <span className="text-[#00f0ff] font-extrabold">{score}</span> points. Best interstellar distance: <span className="text-pink-500 font-bold">{highScore}</span>.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-display font-medium rounded-xl border border-white/20 transition-all cursor-pointer shadow-lg shadow-pink-900/30"
              >
                <RotateCcw className="w-4 h-4" /> REBOOT SHIP
              </button>
              <button 
                onClick={() => setGameState("idle")}
                className="px-6 py-3 bg-[#1c1c2e] hover:bg-[#25253b] text-gray-300 font-mono text-xs rounded-xl border border-gray-800 transition-all"
              >
                RETURN TO GRID
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Instruction Bar */}
      <div className="bg-[#12121e]/40 px-6 py-3 border-t border-[#ff007f]/15 flex flex-wrap justify-between items-center text-xs text-gray-400 font-mono">
        <span className="flex items-center gap-1">
          🎮 Flight Controls: <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">WASD / ARROW KEYS</kbd> to fly, <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">SPACEBAR</kbd> to blast plasma.
        </span>
        <span className="hidden sm:inline">
          🌟 Split System: Big asteroids break into smaller fast dust upon damage!
        </span>
      </div>
    </div>
  );
}
