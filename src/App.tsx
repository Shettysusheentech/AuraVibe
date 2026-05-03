/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Menu, 
  ScanFace, 
  Zap, 
  Heart, 
  Sparkles, 
  Search, 
  Home as HomeIcon, 
  Camera, 
  Image as ImageIcon, 
  RefreshCcw, 
  Share2,
  XCircle,
  Download
} from "lucide-react";
import { toPng } from "html-to-image";
import { GlassCard } from "@/src/components/GlassCard";
import { AuraOrb } from "@/src/components/AuraOrb";
import { generateAura, type AuraReading, generateLoadingMessages } from "@/src/services/gemini";
import { cn } from "@/src/lib/utils";

type Screen = "HOME" | "SCAN_OPTIONS" | "SCANNING" | "RESULT" | "GALLERY" | "SOUL";

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateFingerprint = (seed: number) => {
  const points = [];
  for (let i = 0; i < 20; i++) {
    // Deterministic random-like values
    const x = (seed * (i + 3)) % 100;
    const y = (seed * (i + 7)) % 100;
    points.push({ x, y });
  }
  return points;
};

const getFingerprintSeed = (auraData: AuraReading | null, image: string | null) => {
  if (!auraData) return "default-seed";
  return `${auraData.aura_color}-${auraData.archetype}-${image?.length || 0}`;
};

const auraHexMap: Record<string, string> = {
  Crimson: "#ef4444",
  Indigo: "#6366f1",
  Celadon: "#10b981",
  Magenta: "#ec4899",
  Saffron: "#f59e0b",
  Azure: "#0ea5e9",
  Viridian: "#22c55e",
  Amethyst: "#8b5cf6",
  Opal: "#a5f3fc",
  Cerulean: "#3b82f6",
  Solstice: "#fb923c",
  Fuchsia: "#d946ef",
};

// Sub-components moved outside to prevent re-creation on every render
const MemoAuraOrb = React.memo(AuraOrb);

const HomeView = React.memo(({ 
  setCurrentScreen, 
  lastResult 
}: { 
  setCurrentScreen: (s: Screen) => void, 
  lastResult: AuraReading | null 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    style={{
      willChange: "transform, opacity",
      transform: "translateZ(0)"
    }}
    className="flex flex-col items-center pt-8 pb-32 px-6"
  >
    <div className="relative w-full max-w-md aspect-square flex items-center justify-center mb-12">
      <MemoAuraOrb className="w-80 h-80" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          onClick={() => setCurrentScreen("SCAN_OPTIONS")}
          className="w-72 h-72 rounded-full border border-white/5 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform duration-500"
        >
          <ScanFace className="w-12 h-12 text-aura-primary mb-4" />
          <h1 className="font-serif text-3xl font-light mb-2 italic">Ready to align?</h1>
          <p className="text-on-surface-variant text-sm font-light opacity-60">Initialize your daily spectral scan.</p>
        </div>
      </div>
    </div>

    <div className="w-full max-w-xs flex flex-col gap-4 items-center mb-12">
      <button 
        onClick={() => setCurrentScreen("SCAN_OPTIONS")}
        className="w-full py-4 rounded-aura-pill bg-white text-black font-sans text-xs font-bold uppercase tracking-widest hover:bg-aura-secondary transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        Scan Your Aura
      </button>
      <p className="text-[10px] text-on-surface-variant text-center opacity-40 tracking-widest uppercase font-semibold">Quantum Analysis v2.4</p>
    </div>

    {lastResult ? (
      <div className="w-full grid grid-cols-2 gap-6 max-w-lg">
        <GlassCard className="col-span-2 p-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-sans text-[10px] text-aura-primary tracking-[0.2em] uppercase font-bold mb-2">Last Vibe</p>
              <h3 className="serif text-4xl font-light leading-tight italic">{lastResult.archetype}</h3>
            </div>
            <div className="px-3 py-1 rounded-aura-pill bg-aura-primary/10 border border-aura-primary/20 text-aura-primary text-[10px] font-bold uppercase tracking-widest">{lastResult.vibe_score}% Score</div>
          </div>
          <p className="text-gray-400 text-base leading-relaxed mb-6 font-light">{lastResult.description}</p>
          <div className="pt-4 border-t border-white/10">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Frequency Map</span>
            <div className="flex gap-3 mt-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${60 + Math.random() * 30}%` }}
                    className="h-full bg-aura-primary" 
                  />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-32">
          <Heart className="text-aura-tertiary" size={20} />
          <div>
            <p className="font-display text-[10px] text-on-surface-variant tracking-widest uppercase">Color</p>
            <p className="font-display font-bold text-lg">{lastResult.aura_color}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-32">
          <Sparkles className="text-aura-secondary" size={20} />
          <div>
            <p className="font-display text-[10px] text-on-surface-variant tracking-widest uppercase">Cycles</p>
            <p className="font-display font-bold text-lg">Active</p>
          </div>
        </GlassCard>
      </div>
    ) : (
      <div className="w-full text-center opacity-30 px-12">
        <p className="text-xs font-light tracking-widest uppercase italic">No history detected. Start a new scan to reveal your energy map.</p>
      </div>
    )}
  </motion.div>
));

const ScanOptionsView = React.memo(({ 
  handleStartScanning, 
  fileInputRef,
  setCurrentScreen
}: { 
  handleStartScanning: () => void, 
  fileInputRef: React.RefObject<HTMLInputElement>,
  setCurrentScreen: (s: Screen) => void
}) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex flex-col pt-8 pb-32 px-6 max-w-md mx-auto"
  >
    <section className="mb-12 text-center">
      <h1 className="serif text-6xl font-light leading-tight mb-4">Visualize Your <br/><span className="italic">Energy</span></h1>
      <p className="text-gray-400 font-light max-w-xs mx-auto">Upload or capture a photo to reveal the spectral frequencies of your unique aura.</p>
    </section>

    <div className="grid grid-cols-1 gap-6 mb-12">
      <button 
        onClick={() => handleStartScanning()}
        className="surface-glass relative overflow-hidden rounded-[32px] p-8 text-left group active:scale-[0.98] transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-aura-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-aura-primary tracking-[0.2em] uppercase">Quick Insight</span>
            <h2 className="serif text-3xl font-light italic mt-1">Deep Scan (No Photo)</h2>
            <p className="text-xs text-on-surface-variant/50 font-light mt-1">Analyze presence based on temporal resonance</p>
          </div>
          <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-aura-primary group-hover:text-black transition-colors duration-500">
            <Zap size={24} />
          </div>
        </div>
      </button>

      <button 
        onClick={() => fileInputRef.current?.click()}
        className="surface-glass relative overflow-hidden rounded-[32px] p-8 text-left group active:scale-[0.98] transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-aura-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-aura-secondary tracking-[0.2em] uppercase">Visual Analysis</span>
            <h2 className="serif text-3xl font-light italic mt-1">Spectral Photo Scan</h2>
            <p className="text-xs text-on-surface-variant/50 font-light mt-1">Reveal aura colors from digital captures</p>
          </div>
          <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-aura-secondary group-hover:text-black transition-colors duration-500">
            <ImageIcon size={24} />
          </div>
        </div>
      </button>
    </div>

    <div className="flex items-center justify-between mb-4">
      <span className="font-display text-[10px] font-bold text-on-surface-variant/50 tracking-widest uppercase">Recent Insights</span>
      <button 
        onClick={() => setCurrentScreen("GALLERY")}
        className="text-xs text-aura-primary font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
      >
        See All
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <GlassCard key={i} className="p-4 rounded-3xl">
          <div className="h-32 rounded-2xl bg-zinc-800/50 mb-3 overflow-hidden">
             <img 
              src={`https://picsum.photos/seed/${i + 50}/300/300`} 
              alt="Recent Scan" 
              className="w-full h-full object-cover opacity-30 grayscale"
              referrerPolicy="no-referrer"
             />
          </div>
          <p className="font-display text-[10px] text-aura-primary font-bold uppercase mb-1">Trace {i}</p>
          <p className="text-xs font-light text-gray-500">Harmonic Match</p>
        </GlassCard>
      ))}
    </div>
  </motion.div>
));

const ScanningView = React.memo(({ 
  uploadedImage, 
  isDataReady
}: { 
  uploadedImage: string | null, 
  isDataReady: boolean
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("Aligning frequencies...");
  const imageRef = useRef(uploadedImage);

  // FIX 1 & 8: Optimized progress loop
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (isDataReady) return 100;
        if (prev >= 92) return prev;
        const increment = prev < 40 ? 3 : 1.2;
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isDataReady]);

  // FIX 2: Separate message effect
  useEffect(() => {
    if (isDataReady) return;

    const msgs = ["Analyzing energy...", "Aligning frequencies...", "Quantum sync...", "Spectral mapping...", "Resonance found..."];
    const msgInterval = setInterval(() => {
      setLoadingMsg(prev => {
        const next = msgs[Math.floor(Math.random() * msgs.length)];
        return prev === next ? prev : next;
      });
    }, 2000);

    return () => clearInterval(msgInterval);
  }, [isDataReady]);

  const stableImage = useMemo(() => imageRef.current, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        willChange: "transform, opacity",
        transform: "translateZ(0)"
      }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div className="relative w-80 h-80 flex items-center justify-center mb-12">
        <MemoAuraOrb className="w-full h-full" />
        <div className="absolute inset-0 border border-white/10 rounded-full scale-110" />
        <div className="absolute inset-0 border-2 border-aura-primary/20 rounded-full scale-125" />
        
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-white/20 backdrop-blur-md shadow-2xl bg-zinc-900">
          {stableImage ? (
            <img 
              src={stableImage} 
              key="scanning-image"
              alt="Scanning" 
              className="w-full h-full object-cover grayscale opacity-60"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <Sparkles className="opacity-40 text-aura-primary" size={48} />
            </div>
          )}
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-aura-secondary-container to-transparent shadow-[0_0_15px_rgba(0,238,252,0.8)] z-20" 
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mb-12">
        <p className="font-display text-aura-primary tracking-[0.3em] uppercase text-sm font-bold min-h-[1.5em]">{loadingMsg}</p>
        <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div 
            style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
            className="h-full bg-gradient-to-r from-aura-primary-container to-aura-secondary-container shadow-[0_0_10px_rgba(189,0,255,0.5)]" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm opacity-60">
        <GlassCard className="p-4 py-6 text-left">
          <span className="font-display text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Vibe Freq</span>
          <p className="font-display text-aura-secondary font-bold text-sm">CALCULATING</p>
        </GlassCard>
        <GlassCard className="p-4 py-6 text-left">
          <span className="font-display text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Chromatic</span>
          <p className="font-display text-aura-primary font-bold text-sm">PROCESSING</p>
        </GlassCard>
      </div>
    </motion.div>
  );
});

const AnimatedScore = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

const ResultView = React.memo(({
  auraData,
  showResult,
  setShowResult,
  auraHex,
  uploadedImage,
  handleShare,
  isSharing,
  setUploadedImage,
  setCurrentScreen
}: {
  auraData: AuraReading | null,
  showResult: boolean,
  setShowResult: (val: boolean) => void,
  auraHex: string,
  uploadedImage: string | null,
  handleShare: () => Promise<void>,
  isSharing: boolean,
  setUploadedImage: (img: string | null) => void,
  setCurrentScreen: (s: Screen) => void
}) => {
  if (!auraData) return null;

  useEffect(() => {
    const timer = setTimeout(() => setShowResult(true), 100);
    return () => clearTimeout(timer);
  }, [setShowResult]);

  const signatureId = useMemo(() => {
    return `AC-${auraData.vibe_score}-${auraData.aura_color.slice(0, 2).toUpperCase()}`;
  }, [auraData]);

  const fingerprint = useMemo(() => {
    const seed = getFingerprintSeed(auraData, uploadedImage);
    return generateFingerprint(hashString(seed));
  }, [auraData, uploadedImage]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        willChange: "transform, opacity",
        transform: "translateZ(0)"
      }}
      className="flex flex-col items-center pt-8 pb-32 px-6 max-w-md mx-auto"
    >
      <section className="relative flex flex-col items-center mb-12">
        <div className="relative w-72 h-72 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: showResult ? 1.2 : 0.8, opacity: showResult ? 0.2 : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <MemoAuraOrb className="absolute inset-0 blur-[120px]" />
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
            className="absolute top-0 right-0 w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 z-20 shadow-2xl bg-zinc-900 flex items-center justify-center"
            style={{ boxShadow: `0 0 40px ${auraHex}44` }}
          >
            {uploadedImage ? (
              <img 
                 src={uploadedImage} 
                 alt="Scanner capture" 
                 className="w-full h-full object-cover grayscale"
                 referrerPolicy="no-referrer"
              />
            ) : (
              <Sparkles size={24} className="opacity-20" />
            )}
          </motion.div>

          {/* Fingerprint Visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.8, duration: 2 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <svg width="200" height="200" viewBox="0 0 100 100" className="w-full h-full">
              {fingerprint.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="0.5"
                  fill={auraHex}
                />
              ))}
              {fingerprint.slice(0, 10).map((p, i) => i < 9 && (
                <line
                  key={`l-${i}`}
                  x1={p.x}
                  y1={p.y}
                  x2={fingerprint[i+1].x}
                  y2={fingerprint[i+1].y}
                  stroke={auraHex}
                  strokeWidth="0.1"
                  strokeOpacity="0.5"
                />
              ))}
            </svg>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              boxShadow: [
                `inset 0 0 30px ${auraHex}22, 0 0 60px ${auraHex}33`,
                `inset 0 0 40px ${auraHex}33, 0 0 80px ${auraHex}55`,
                `inset 0 0 30px ${auraHex}22, 0 0 60px ${auraHex}33`
              ]
            }}
            transition={{ 
              delay: 0.2,
              boxShadow: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="w-56 h-56 rounded-full border border-white/10 flex items-center justify-center relative backdrop-blur-md"
          >
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="absolute inset-[-8px] border-2 border-dashed border-aura-primary/30 rounded-full"
             />
             <div className="text-center relative z-10">
               <span className="font-sans text-7xl font-light tracking-tighter text-white">
                 {showResult ? <AnimatedScore value={auraData.vibe_score} /> : 0}
               </span>
               <div className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-bold">Resonance</div>
               <div className="mt-1 font-mono text-[8px] opacity-30 tracking-[0.2em] font-bold">{signatureId}</div>
             </div>
          </motion.div>
        </div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center px-4"
        >
          <div className="flex flex-col items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-aura-primary">Archetype</span>
            {localStorage.getItem("last_scan_date") === new Date().toDateString() && (
              <span className="px-2 py-0.5 rounded-full bg-aura-primary/10 border border-aura-primary/20 text-[8px] font-bold uppercase tracking-widest text-aura-primary">
                Today's Energy
              </span>
            )}
          </div>
          <h1 className="serif text-5xl font-light italic leading-tight text-white mb-4">{auraData.archetype}</h1>
          {auraData.hidden_insight && (
            <p className="text-xs italic opacity-50 text-gray-400 mb-2 px-6">
              {auraData.hidden_insight}
            </p>
          )}
          <p className="text-gray-400 font-light leading-relaxed max-w-sm italic">"{auraData.description}"</p>
        </motion.div>
      </section>

      <div className="grid grid-cols-2 gap-6 w-full mb-8">
        <GlassCard className="p-8 flex flex-col gap-2 hover:bg-white/5 hover:scale-[1.02] transition-all duration-300 cursor-default group">
          <div className="w-1.5 h-1.5 bg-aura-primary rounded-full mb-2 group-hover:shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-shadow" />
          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase opacity-40">Primary Color</span>
          <p className="serif text-2xl font-light italic text-white">{auraData.aura_color}</p>
        </GlassCard>
        <GlassCard className="p-8 flex flex-col gap-2 hover:bg-white/5 hover:scale-[1.02] transition-all duration-300 cursor-default group">
           <div className="w-1.5 h-1.5 bg-aura-secondary rounded-full mb-2 group-hover:shadow-[0_0_8px_rgba(0,238,252,0.8)] transition-shadow" />
          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase opacity-40">Clarity</span>
          <p className="serif text-2xl font-light italic text-white">Spectral Bound</p>
        </GlassCard>
      </div>

      <div className="w-full flex flex-col gap-6 mb-12">
        <GlassCard className="w-full p-10 hover:shadow-xl hover:shadow-aura-primary/5 transition-all duration-500">
          <h3 className="text-[10px] uppercase tracking-widest mb-8 opacity-40 font-bold">Core Strengths</h3>
          <div className="space-y-5">
            {auraData.strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <Sparkles className="w-4 h-4 text-aura-primary opacity-50" />
                <p className="text-sm font-medium tracking-wide text-gray-200">{s}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="w-full p-10 hover:shadow-xl hover:shadow-aura-tertiary/5 transition-all duration-500">
          <h3 className="text-[10px] uppercase tracking-widest mb-8 opacity-40 font-bold">Growth Edges</h3>
          <div className="space-y-5">
            {auraData.weaknesses.map((w, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 bg-aura-tertiary rounded-full opacity-50 block"></div>
                <p className="text-sm font-medium tracking-wide text-gray-400 italic">{w}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <GlassCard className="w-full p-10 border-aura-primary/20">
          <h3 className="text-[10px] uppercase tracking-widest mb-4 opacity-40 font-bold">Evolutionary Advice</h3>
          <p className="serif text-2xl font-light italic leading-relaxed text-aura-primary/90">
             "{auraData.daily_advice}"
          </p>
        </GlassCard>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="w-full h-16 rounded-aura-pill bg-white text-black font-sans font-bold text-xs uppercase tracking-widest hover:bg-aura-secondary hover:text-white hover:shadow-[0_0_20px_rgba(0,238,252,0.3)] transition-all active:scale-95 duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSharing ? <RefreshCcw className="animate-spin" size={18} /> : <Share2 size={18} />}
          {isSharing ? "Generating..." : "Share Result"}
        </button>
        <button 
          onClick={() => {
            setUploadedImage(null);
            setCurrentScreen("SCAN_OPTIONS");
          }}
          className="w-full h-16 rounded-aura-pill border border-white/20 text-white font-sans font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} />
          Re-Scan
        </button>
      </div>
    </motion.div>
  );
});

const GalleryView = React.memo(({ 
  setCurrentScreen,
  setAuraData,
  setUploadedImage,
  currentScreen
}: { 
  setCurrentScreen: (s: Screen) => void,
  setAuraData: (d: AuraReading | null) => void,
  setUploadedImage: (img: string | null) => void,
  currentScreen: Screen
}) => {
  const history = useMemo(() => JSON.parse(localStorage.getItem("aura_history") || "[]"), [currentScreen]);

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-12 text-center opacity-40">
        <Sparkles size={48} className="mb-4 text-aura-primary" />
        <p className="font-serif text-2xl italic mb-2">The gallery is empty</p>
        <p className="text-sm font-light uppercase tracking-widest leading-loose">Initialize your first scan<br/>to begin history.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 pb-32 max-w-4xl mx-auto"
    >
      <header className="mb-12">
        <h1 className="serif text-5xl font-light italic mb-2 text-white">Aura Gallery</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] font-bold">Spectral History</p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        {history.map((item: any, i: number) => (
          <GlassCard 
            key={i}
            onClick={() => {
              setAuraData(item);
              setUploadedImage(item.image);
              setCurrentScreen("RESULT");
            }}
            className="cursor-pointer group hover:bg-white/5 active:scale-95 transition-all duration-300"
          >
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-zinc-900/50 relative border border-white/5">
              {item.image ? (
                <img 
                  src={item.image} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20"><Zap size={24} /></div>
              )}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/60">
                {item.vibe_score}
              </div>
            </div>
            <div className="px-1">
              <p className="text-[10px] uppercase font-bold text-aura-primary tracking-widest mb-1">{item.aura_color}</p>
              <p className="text-xs italic serif text-gray-500 line-clamp-1">{item.archetype}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
});

const SoulView = React.memo(() => {
  const history = useMemo(() => JSON.parse(localStorage.getItem("aura_history") || "[]"), []);

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-12 text-center opacity-40">
        <Heart size={48} className="mb-4 text-aura-tertiary" />
        <p className="font-serif text-2xl italic mb-2">Soul data locked</p>
        <p className="text-sm font-light uppercase tracking-widest leading-loose">Align your frequencies<br/>to reveal aggregates.</p>
      </div>
    );
  }

  const avgScore = Math.round(
    history.reduce((acc: number, h: any) => acc + h.vibe_score, 0) / history.length
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 pb-32 max-w-2xl mx-auto"
    >
      <header className="mb-12 text-center">
        <h1 className="serif text-5xl font-light italic mb-2 text-white">Soul Analysis</h1>
        <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] font-bold">Quantum Memory</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <GlassCard className="p-10 flex flex-col items-center relative overflow-hidden bg-gradient-to-br from-aura-primary/5 to-transparent border-aura-primary/20">
           <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
             <Heart size={180} />
           </div>
           <span className="text-[10px] uppercase tracking-[0.3em] text-aura-primary font-bold mb-6">Aggregate Resonance</span>
           <div className="text-8xl font-sans font-light tracking-tighter text-white mb-2">{avgScore}</div>
           <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Median Flux Score</p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-6">
          <GlassCard className="p-8 group hover:border-aura-secondary/30 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-aura-secondary font-bold mb-4 block">Evolutions</span>
            <p className="serif text-3xl italic text-white leading-tight">{history.length} <span className="text-sm tracking-normal font-sans opacity-40 not-italic">cycles</span></p>
          </GlassCard>
          <GlassCard className="p-8 group hover:border-aura-tertiary/30 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-aura-tertiary font-bold mb-4 block">Peak Vibe</span>
            <p className="serif text-3xl italic text-white leading-tight">{Math.max(...history.map((h: any) => h.vibe_score))} <span className="text-sm tracking-normal font-sans opacity-40 not-italic">max</span></p>
          </GlassCard>
        </div>

        <GlassCard className="p-10 border-white/5">
          <h3 className="text-[10px] uppercase tracking-widest mb-8 font-bold opacity-30">Predictive Guidance</h3>
          <div className="space-y-8">
            <div className="flex gap-6">
               <div className="w-0.5 h-10 bg-aura-primary rounded-full shrink-0" />
               <p className="text-sm text-gray-400 font-light leading-relaxed italic">"Your energy signature suggests a period of <span className="text-white">reflective expansion</span>. You allow light to pass through without distortion."</p>
            </div>
            <div className="flex gap-6">
               <div className="w-0.5 h-10 bg-aura-secondary rounded-full shrink-0" />
               <p className="text-sm text-gray-400 font-light leading-relaxed italic">"A subtle shift towards <span className="text-white">chromatic stability</span> noted in last {history.length} cycles. Resonance is stabilizing."</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("HOME");
  const [auraData, setAuraData] = useState<AuraReading | null>(null);
  const [lastResult, setLastResult] = useState<AuraReading | null>(() => {
    const saved = localStorage.getItem("last_aura");
    return saved ? JSON.parse(saved) : null;
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"scan" | "share" | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const auraHex = auraHexMap[auraData?.aura_color || "Indigo"] || "#6366f1";

  useEffect(() => {
    if (auraData) {
      localStorage.setItem("last_aura", JSON.stringify(auraData));
      setLastResult(auraData);
    }
  }, [auraData]);

  const handleShare = useCallback(async () => {
    if (!shareCardRef.current || isSharing) return;
    
    setIsSharing(true);
    setError(null);
    setErrorType("share");
    try {
      const dataUrl = await toPng(shareCardRef.current, { 
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: false
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "my-aura.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Aura Reading",
          text: `Got a Vibe Score of ${auraData?.vibe_score}! ${auraData?.share_caption || "Discover your aura vibe."}`,
        });
      } else {
        const link = document.createElement("a");
        link.download = "my-aura.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Share failed", err);
      setError("Failed to generate share image.");
    } finally {
      setIsSharing(false);
    }
  }, [auraData, isSharing]);

  const handleStartScanning = useCallback(async (b64?: string, imageOverride?: string) => {
    console.log("PROMPT:", "Aura generation request");
    setCurrentScreen("SCANNING");
    setShowResult(false);
    setError(null);
    setErrorType("scan");
    
    try {
      const today = new Date().toDateString();
      const lastScanDate = localStorage.getItem("last_scan_date");
      const lastAura = lastResult ? { color: lastResult.aura_color, archetype: lastResult.archetype } : undefined;
      
      let data = await generateAura(b64, lastAura);
      
      // Personalization variation
      data.vibe_score = Math.min(100, data.vibe_score + Math.floor(Math.random() * 5));
      
      // Daily variation logic
      if (lastScanDate === today && lastResult) {
        // Same day: subtle variation of last score
        const scoreDiff = Math.floor(Math.random() * 11) - 5; // -5 to +5
        data.vibe_score = Math.min(100, Math.max(60, lastResult.vibe_score + scoreDiff));
      } else {
        localStorage.setItem("last_scan_date", today);
      }

      console.log("RESPONSE:", data);
      
      // SAVE TO HISTORY
      const currentImage = imageOverride || uploadedImage;
      const history = JSON.parse(localStorage.getItem("aura_history") || "[]");
      const historyItem = {
        ...data,
        image: currentImage,
        date: new Date().toISOString(),
        id: `AC-${data.vibe_score}-${Date.now().toString().slice(-4)}`
      };
      const newHistory = [historyItem, ...history].slice(0, 12);
      localStorage.setItem("aura_history", JSON.stringify(newHistory));

      setAuraData(historyItem); // Use the history item which has the correct image
      
      setTimeout(() => {
        setCurrentScreen("RESULT");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError("Synchronicity failed. The digital ether is turbulent. Please attempt again.");
      setCurrentScreen("HOME");
    }
  }, [lastResult, uploadedImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      const b64 = result.split(",")[1];
      // Batch updates
      setUploadedImage(result);
      handleStartScanning(b64, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-aura-bg relative selection:bg-aura-primary/30 overflow-x-hidden">
      <div className="mesh-gradient" />
      
      {/* Top Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-zinc-950/30 backdrop-blur-2xl border-b border-white/10 flex justify-between items-center px-8 py-6">
        <button className="text-aura-primary hover:opacity-80 transition-opacity">
          <Menu size={24} />
        </button>
        <div 
          onClick={() => setCurrentScreen("HOME")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full border border-aura-primary-container flex items-center justify-center group-hover:bg-aura-primary transition-all">
            <div className="w-1.5 h-1.5 bg-aura-primary rounded-full group-hover:bg-black"></div>
          </div>
          <div className="font-sans font-bold tracking-[0.2em] uppercase text-xs">
            Aura Collective
          </div>
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase opacity-40 font-semibold hidden sm:block">
          Scan ID: {auraData ? `AC-${auraData.vibe_score}-${auraData.aura_color.substring(0,2).toUpperCase()}` : "D-88291-C"}
        </div>
      </header>

      {/* Error View */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-sm z-[100] px-6"
          >
            <GlassCard className="p-6 border-red-500/20 bg-red-500/5 backdrop-blur-2xl">
              <div className="flex items-start gap-4">
                <XCircle className="text-red-400 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-white mb-2">Interference detected</h3>
                  <p className="text-sm text-gray-400 font-light leading-relaxed mb-4">{error}</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setError(null);
                        if (errorType === "share") handleShare();
                        else if (errorType === "scan") handleStartScanning(uploadedImage?.split(",")[1]);
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-white transition-colors"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setError(null)}
                      className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-24 min-h-screen overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {currentScreen === "HOME" && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
            >
              <HomeView setCurrentScreen={setCurrentScreen} lastResult={lastResult} />
            </motion.div>
          )}
          {currentScreen === "SCAN_OPTIONS" && (
            <motion.div 
              key="options" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              transition={{ duration: 0.2 }}
            >
              <ScanOptionsView 
                handleStartScanning={handleStartScanning} 
                fileInputRef={fileInputRef} 
                setCurrentScreen={setCurrentScreen}
              />
            </motion.div>
          )}
          {currentScreen === "SCANNING" && (
            <motion.div 
              key="scanning" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
            >
              <ScanningView uploadedImage={uploadedImage} isDataReady={!!auraData} />
            </motion.div>
          )}
          {currentScreen === "GALLERY" && (
            <motion.div 
              key="gallery" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              transition={{ duration: 0.3 }}
            >
              <GalleryView 
                setCurrentScreen={setCurrentScreen} 
                setAuraData={setAuraData} 
                setUploadedImage={setUploadedImage}
                currentScreen={currentScreen} 
              />
            </motion.div>
          )}
          {currentScreen === "SOUL" && (
            <motion.div 
              key="soul" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }} 
              transition={{ duration: 0.3 }}
            >
              <SoulView />
            </motion.div>
          )}
          {currentScreen === "RESULT" && (
            <motion.div 
              key="result" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.2 }}
            >
              <ResultView 
                auraData={auraData}
                showResult={showResult}
                setShowResult={setShowResult}
                auraHex={auraHex}
                uploadedImage={uploadedImage}
                handleShare={handleShare}
                isSharing={isSharing}
                setUploadedImage={setUploadedImage}
                setCurrentScreen={setCurrentScreen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden Share Card */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none">
        <div 
          ref={shareCardRef}
          className="w-[1080px] h-[1920px] bg-black flex flex-col items-center justify-center p-24 text-center relative overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${auraHex}44 0%, #000 70%)`
          }}
        >
          {/* Signature light streak */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rotate-12 -translate-y-1/2 opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -rotate-12 translate-y-1/2 opacity-20" />
          
          <MemoAuraOrb pulse={false} className="absolute inset-0 opacity-40 scale-[2.5] blur-[150px]" />
          
          <div className="relative z-10 flex flex-col items-center gap-12 w-full">
             <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-8">
               <div className="w-6 h-6 bg-white rounded-full"></div>
             </div>
             
             {uploadedImage && (
               <div className="w-40 h-40 rounded-full overflow-hidden border border-white/20 mb-8 relative">
                  <img src={uploadedImage} alt="User" className="w-full h-full object-cover grayscale" />
               </div>
             )}

             <div className="relative mb-8">
               <span className="text-3xl tracking-[0.5em] text-white/40 uppercase font-black">Aura Collective</span>
               
               {/* Visual Fingerprint on Share Card */}
               <div className="absolute -top-40 -left-40 opacity-20 pointer-events-none scale-150">
                  {auraData && (
                    <svg width="400" height="400" viewBox="0 0 100 100">
                      {generateFingerprint(hashString(getFingerprintSeed(auraData, uploadedImage))).map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={auraHex} />
                      ))}
                    </svg>
                  )}
               </div>
             </div>
             
             <div className="mt-24 mb-12 flex flex-col items-center">
               <div className="text-[250px] font-sans font-light tracking-tighter text-white leading-none">
                 {auraData?.vibe_score}
               </div>
               <span className="text-4xl tracking-[1em] text-white/60 uppercase font-bold mt-4">Vibe Score</span>
               <div className="mt-4 font-mono text-xl opacity-40 text-white tracking-[0.4em]">AC-{auraData?.vibe_score}-{auraData?.aura_color.slice(0,2).toUpperCase()}</div>
             </div>

             <div className="flex flex-col gap-6 items-center">
               <span className="text-3xl tracking-[0.3em] font-bold text-white/30 uppercase italic">Archetype</span>
               <h1 className="text-9xl serif font-light italic text-white leading-tight">
                 {auraData?.archetype}
               </h1>
               <div className="mt-8 flex items-center gap-6">
                 <div className="w-4 h-4 rounded-full bg-white"></div>
                 <span className="text-5xl serif italic text-white whitespace-nowrap">{auraData?.aura_color} Energy</span>
                 <div className="w-4 h-4 rounded-full bg-white"></div>
               </div>
             </div>

             <div className="mt-32 max-w-4xl p-16 border border-white/5 bg-white/5 backdrop-blur-3xl rounded-[60px]">
               <p className="text-4xl serif font-light text-white/80 italic leading-relaxed">
                 "{auraData?.description}"
               </p>
             </div>

             <div className="mt-auto pt-24 border-t border-white/10 w-full flex justify-between items-end">
                <div className="text-left flex flex-col gap-4">
                  <span className="text-xl tracking-widest text-white/30 uppercase font-bold">Frequency ID</span>
                   <span className="text-3xl font-mono text-white/60">AC-{auraData?.vibe_score}-{(auraData?.aura_color||"").substring(0,2).toUpperCase()}</span>
                </div>
                <div className="text-right">
                   <div className="w-32 h-32 relative">
                      <div className="absolute inset-0 border-4 border-white/10 rounded-xl flex items-center justify-center text-5xl">✧</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-zinc-950/40 backdrop-blur-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex justify-around items-center px-4 pt-3 pb-8 rounded-t-[32px]">
        <button 
          onClick={() => setCurrentScreen("HOME")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            currentScreen === "HOME" ? "text-aura-primary drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" : "text-zinc-500 opacity-60 hover:opacity-100"
          )}
        >
          <HomeIcon size={22} className={currentScreen === "HOME" ? "fill-current" : ""} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase">Home</span>
        </button>
        <button 
           onClick={() => setCurrentScreen("SCAN_OPTIONS")}
           className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            ["SCANNING", "SCAN_OPTIONS"].includes(currentScreen) ? "text-aura-primary drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" : "text-zinc-500 opacity-60 hover:opacity-100"
          )}
        >
          <ScanFace size={22} className={["SCANNING", "SCAN_OPTIONS"].includes(currentScreen) ? "fill-current" : ""} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase">Scan</span>
        </button>
        <button 
          onClick={() => setCurrentScreen("GALLERY")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            currentScreen === "GALLERY" ? "text-aura-primary drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" : "text-zinc-500 opacity-60 hover:opacity-100"
          )}
        >
          <Sparkles size={22} className={currentScreen === "GALLERY" ? "fill-current" : ""} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase">Gallery</span>
        </button>
        <button 
          onClick={() => setCurrentScreen("SOUL")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            currentScreen === "SOUL" ? "text-aura-primary drop-shadow-[0_0_10px_rgba(129,140,248,0.6)]" : "text-zinc-500 opacity-60 hover:opacity-100"
          )}
        >
          <Search size={22} className={currentScreen === "SOUL" ? "fill-current" : ""} />
          <span className="font-display text-[10px] font-bold tracking-widest uppercase">Soul</span>
        </button>
      </nav>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />
    </div>
  );
}
