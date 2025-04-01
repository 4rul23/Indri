/* eslint-disable */
"use client";

// Import React explicitly, especially for hooks and types
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence, useAnimation, AnimationControls } from "framer-motion";
// Assuming types are not available or needed for confetti library
// If types were available: import confetti from 'canvas-confetti';
declare var confetti: any; // Declare confetti as any if types aren't installed/available

// Debounce utility with improved typing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      timeout = null; // Clear timeout ID *before* executing func
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// --- Constants ---
const VINTAGE_COLORS = {
  primary: "#A45A52",
  secondary: "#91785D",
  accent1: "#D8C9B9",
  accent2: "#E8D8C4",
  dark: "#4A3C2A",
  gold: "#BF9B6F",
  background: "#F2EBE0",
  paperPatternFill: '#d1bfa3'
};

const PAPER_PATTERN_SVG = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='${VINTAGE_COLORS.paperPatternFill}' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E`;

// --- Hooks ---
interface UseAudioPlayerReturn {
  play: () => void;
  // pause: () => void; // Kept internal to the hook if not exported
}

function useAudioPlayer(src: string): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null; // Explicitly nullify
      }
    };
  }, [src]);

  const play = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
       // Attempt to resume AudioContext if needed (for some browsers)
       try {
           audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
       } catch (error) {
            console.warn("Audio play failed potentially due to AudioContext suspension:", error)
       }
    }
  }, []);

  // Internal pause function (optional to keep)
  // const pause = useCallback(() => {
  //   if (audioRef.current) {
  //     audioRef.current.pause();
  //   }
  // }, []);

  return { play };
}

interface UseConfettiCannonReturn {
    fire: () => void;
    burst: () => void;
    cannonRef: React.RefObject<HTMLDivElement>; // Ref type for div
}

function useConfettiCannon(colors: string[]): UseConfettiCannonReturn {
  const animationFrameRef = useRef<number | null>(null); // Store animation frame ID
  const cannonRef = useRef<HTMLDivElement>(null); // Correct type for div ref

  const fire = useCallback(() => {
    if (animationFrameRef.current) return; // Prevent multiple concurrent animations

    const frame = () => {
        const node = cannonRef.current;
        let originY = 0.5; // Default to center if node not available
        if (node) {
            const rect = node.getBoundingClientRect();
            originY = Math.max(0, Math.min(1, (rect.top + rect.height / 2) / window.innerHeight)); // Center Y relative to viewport
        }

        confetti({
            particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: originY }, colors: colors, disableForReducedMotion: true
        });
        confetti({
            particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: originY }, colors: colors, disableForReducedMotion: true
        });
    };

    const end = Date.now() + 2000;
    const runAnimation = () => {
        frame();
        if (Date.now() < end) {
            animationFrameRef.current = requestAnimationFrame(runAnimation);
        } else {
             animationFrameRef.current = null;
        }
    }

    animationFrameRef.current = requestAnimationFrame(runAnimation);
  }, [colors]);

  const burst = useCallback(() => {
     const node = cannonRef.current;
     let originY = 0.5;
     if (node) {
         const rect = node.getBoundingClientRect();
         originY = Math.max(0, Math.min(1, (rect.top + rect.height / 2) / window.innerHeight));
     }

     confetti({
          particleCount: 50, angle: 90, spread: 70, origin: { y: originY }, colors: colors, scalar: 1.2, disableForReducedMotion: true
     });
  }, [colors])

   useEffect(() => {
      // Basic resize listener setup (no-op for now, but pattern is here)
      const handleResize = debounce(() => { /* Potential logic for resize if needed */ }, 100);
      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('resize', handleResize);
         if (animationFrameRef.current) { // Clear animation frame on unmount
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
         }
      }
   }, []);


  return { fire, burst, cannonRef };
}

// --- Components ---
const Sparkles = memo(() => (
  <>
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-amber-100 pointer-events-none z-20" // Ensure sparkles are above most content
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 0.8, 0],
          scale: [0, 1, 0],
          x: [0, (Math.random() - 0.5) * 80],
          y: [0, (Math.random() - 0.5) * 80]
        }}
        transition={{
          duration: 1.5 + Math.random(),
          repeat: Infinity,
          repeatDelay: 1 + Math.random(),
          delay: Math.random() * 1.5,
          ease: "linear"
        }}
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          height: `${Math.random() * 4 + 2}px`,
          width: `${Math.random() * 4 + 2}px`,
          boxShadow: `0 0 8px 2px ${VINTAGE_COLORS.gold}aa`
        }}
      />
    ))}
  </>
));
Sparkles.displayName = 'Sparkles';


// --- Main Component ---
export default function Home() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [showBalloons, setShowBalloons] = useState<boolean>(false);
  const [showGifts, setShowGifts] = useState<boolean>(false);
  const [showCake, setShowCake] = useState<boolean>(false);
  const [hasBlownCandles, setHasBlownCandles] = useState<boolean>(false);

  const candleControls: AnimationControls = useAnimation();
  const { play: playMusic } = useAudioPlayer("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const { fire: fireConfetti, burst: burstConfetti, cannonRef } = useConfettiCannon(
     Object.values(VINTAGE_COLORS).filter(color => color !== VINTAGE_COLORS.background && color !== VINTAGE_COLORS.paperPatternFill && color !== VINTAGE_COLORS.dark) // Dynamically get confetti colors
  );

  const blowSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      const audio = new Audio('/blow-candles.mp3');
      audio.volume = 0.4;
      audio.preload = "auto";
      blowSoundRef.current = audio;

      return () => {
        if (blowSoundRef.current) {
             blowSoundRef.current.pause();
             blowSoundRef.current.removeAttribute('src');
             blowSoundRef.current = null; // Clear ref on unmount
        }
      };
  }, []);

  const handleOpenCard = useCallback(() => {
    if (isOpen) return;
    setIsOpen(true);

    // Using timeout directly is fine here
    setTimeout(() => {
        fireConfetti();
        playMusic();
    }, 400);

    setTimeout(() => setShowMessage(true), 800);
    setTimeout(() => setShowBalloons(true), 1200);
    setTimeout(() => setShowGifts(true), 1500);
    setTimeout(() => setShowCake(true), 1800);

  }, [isOpen, fireConfetti, playMusic]);

  const handleBlowCandles = useCallback(() => {
    if (!hasBlownCandles && showCake && blowSoundRef.current) {
      setHasBlownCandles(true);
      candleControls.start({
        opacity: 0,
        scaleY: 0,
        transition: { duration: 0.3, ease: "easeIn" }
      }).then(() => {
            blowSoundRef.current?.play().catch(e => console.warn("Blow sound failed:", e));
      });

      burstConfetti();
    }
  }, [hasBlownCandles, showCake, candleControls, burstConfetti]);

  // Memoize constant data structures
  const gifts = useMemo(() => [
    { scale: 0.8, rotate: -15, color: VINTAGE_COLORS.primary, delay: 0.1 },
    { scale: 0.9, rotate: 5, color: VINTAGE_COLORS.secondary, delay: 0.2 },
    { scale: 0.75, rotate: 10, color: VINTAGE_COLORS.accent1, delay: 0.3 }
  ], []); // Empty array: VINTAGE_COLORS object won't change

  const cardVariants = useMemo(() => ({
    closed: { rotateY: 0 },
    open: { rotateY: -180 }
  }), []);

  const letterVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ // Add type for index 'i'
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, ease: "easeOut" }
    })
  }), []);


  return (
    <div
      ref={cannonRef}
      className="min-h-screen flex items-center justify-center overflow-hidden relative p-4 font-serif"
      style={{
        background: VINTAGE_COLORS.background,
        backgroundImage: `url("${PAPER_PATTERN_SVG}")`,
      }}
    >
      {/* Background Blurs */}
      <div className="absolute inset-0 opacity-10 z-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i} className="absolute rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, repeatType: "mirror", duration: 6 + Math.random() * 4 }}
            style={{
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              width: `${Math.random() * 120 + 60}px`, height: `${Math.random() * 120 + 60}px`,
              background: `radial-gradient(circle, ${VINTAGE_COLORS.primary}1a 0%, transparent 70%)`,
              transformOrigin: 'center center'
            }}
          />
        ))}
      </div>

      {/* Balloons */}
      <AnimatePresence>
        {showBalloons && (
          <>
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={`balloon-${i}`} className="absolute bottom-0 pointer-events-none"
                initial={{ y: "110vh", x: `${10 + i * 12}%` }}
                animate={{
                  y: `-${25 + Math.random() * 40}vh`,
                  x: [`${10 + i * 12}%`, `${8 + i * 12 + (Math.random() * 8 - 4)}%`],
                }}
                transition={{
                  y: { duration: 18 + Math.random() * 12, delay: Math.random() * 0.5, ease: "easeOut" },
                  x: { repeat: Infinity, repeatType: "mirror", duration: 6 + Math.random() * 4 }
                }}
                style={{ zIndex: 5 }}
              >
                <div className="h-16 w-12 rounded-full border border-amber-800/10 shadow-inner"
                     style={{
                         background: `radial-gradient(circle at 35% 35%, ${[VINTAGE_COLORS.primary, VINTAGE_COLORS.secondary, VINTAGE_COLORS.accent1, VINTAGE_COLORS.accent2, VINTAGE_COLORS.gold][i % 5]} 20%, ${VINTAGE_COLORS.dark}80 130%)`,
                     }}
                 />
                <motion.div
                  className="absolute top-full left-1/2 w-[1px] h-48 -ml-[0.5px]"
                  style={{ background: "rgba(107, 83, 56, 0.3)" }}
                  initial={{ rotate: 0, scaleY: 1 }}
                  animate={{ rotate: [0, -3, 3, 0], scaleY: [1, 1.02, 0.98, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: i * 0.1 }}
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Card Container */}
      <div className="relative z-10" style={{ perspective: "2000px" }}>
        <motion.div
          className="w-[90vw] max-w-md h-[500px] cursor-pointer relative"
          variants={cardVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          onClick={handleOpenCard}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 backface-hidden">
              <div className="w-full h-full rounded-md overflow-hidden shadow-xl border-2 border-amber-800/20 bg-amber-50" style={{ backgroundImage: `url("${PAPER_PATTERN_SVG}")` }}>
                 <div className="absolute inset-0 border-[10px] border-amber-800/5 rounded-sm" />
                 <div className="absolute inset-[12px] border border-amber-800/10 rounded-sm" />
                 <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                    {/* Cake Medallion - Ensure content doesn't cause type errors */}
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }} className="relative w-48 h-48 mb-5">
                       <div className="absolute inset-0 rounded-full border-4 border-amber-700/10" style={{ background: VINTAGE_COLORS.accent2 }} />
                       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute inset-3 rounded-full border border-dashed border-amber-800/15 flex items-center justify-center">
                          <motion.div className="relative w-20 h-20 flex items-center justify-center" animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                             <div className="w-16 h-14 bg-amber-200 rounded border border-amber-800/20 relative pt-2 px-2">
                               <div className="h-3 bg-amber-100 border-b border-amber-800/10 rounded-t-sm"></div>
                               <div className="h-3 bg-amber-300 mt-1 border-b border-amber-800/10 rounded-b-sm"></div>
                               <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-1 h-4 bg-red-400"></div>
                               <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[18px] w-2 h-2 bg-amber-300 rounded-full"></div>
                             </div>
                          </motion.div>
                       </motion.div>
                    </motion.div>

                    <motion.div className="text-center z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                       <motion.div className="w-36 h-3 mx-auto mb-3" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4 }}>
                           <svg viewBox="0 0 100 10" className="w-full" fill="none" stroke={VINTAGE_COLORS.gold} strokeWidth="1"> <path d="M0,5 Q25,0 50,5 T100,5"/><path d="M0,5 Q25,10 50,5 T100,5"/> </svg>
                       </motion.div>
                       {/* Ensure map index is typed for letterVariants */}
                       <div className="flex justify-center mb-2 overflow-hidden">
                           {Array.from("Happy Birthday!").map((letter, i: number) => (
                             <motion.span key={i} custom={i} variants={letterVariants} initial="hidden" animate="visible" className="font-serif font-bold text-3xl text-amber-900/90 inline-block">
                                 {letter === " " ? "\u00A0" : letter}
                             </motion.span>
                           ))}
                       </div>
                       <motion.div className="w-28 h-3 mx-auto mb-4" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1 }}>
                            <svg viewBox="0 0 100 10" className="w-full" fill="none" stroke={VINTAGE_COLORS.gold} strokeWidth="1" strokeDasharray="2,3"><path d="M0,5 H100"/></svg>
                       </motion.div>
                       <motion.p className="font-serif italic text-sm mb-2" initial={{ opacity: 0, color: VINTAGE_COLORS.dark }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}> Click to Open </motion.p>
                       <motion.div animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-amber-800/80 text-xl"> ↓ </motion.div>
                    </motion.div>
                    {/* Ensure Stamp content is valid JSX */}
                    <motion.div className="absolute top-4 right-4 w-12 h-16 bg-amber-100 border border-amber-800/20 flex flex-col items-center justify-center pt-1 pb-1 font-serif text-xs text-amber-800/60 shadow-sm" initial={{ rotate: 3 }} animate={{ rotate: [3, -2, 3] }} transition={{ repeat: Infinity, duration: 5, repeatType: "reverse" }}>
                       <div>for</div> <div className="w-full h-[1px] bg-amber-800/20 my-1"></div> <div>you</div> <div className="mt-1 text-base">✉</div>
                    </motion.div>
                 </div>
              </div>
          </div>

          {/* Back Face (Inside) */}
          <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)" }}>
               <div className="w-full h-full rounded-md overflow-hidden shadow-xl border-2 border-amber-800/20 bg-amber-100" style={{ backgroundImage: `url("${PAPER_PATTERN_SVG}")` }}>
                  <div className="absolute inset-0 border-[10px] border-amber-800/5 rounded-sm" />
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 pt-10 overflow-hidden">
                    {showMessage && <Sparkles />}

                    <motion.h2 className="font-serif font-bold text-3xl text-amber-900 mb-5 relative" initial={{ opacity: 0, y: -15 }} animate={showMessage ? { opacity: 1, y: 0 } : {}} transition={{ type: "spring", stiffness: 80, delay: 0.1 }}>
                      Happy Birthday!
                       <motion.div className="absolute -bottom-1 left-0 w-full h-0.5" initial={{ scaleX: 0 }} animate={showMessage ? { scaleX: 1 } : {}} transition={{ delay: 0.3 }} style={{ background: `linear-gradient(90deg, transparent, ${VINTAGE_COLORS.gold}88, transparent)`}} />
                    </motion.h2>

                    <motion.p className="text-amber-800 text-center font-serif text-sm leading-relaxed mb-4 max-w-xs" initial={{ opacity: 0 }} animate={showMessage ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}>
                       Semoga hari harimu di tahun ini dan seterusnya dipenuhi dengan kebahagiaan dan kebaikan!! . Happy birthday Indrii :)
                    </motion.p>

                    {/* Cake */}
                    {showCake && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 100 }} className="relative my-3 cursor-pointer group" onClick={handleBlowCandles} title={hasBlownCandles ? "Candles blown!" : "Click cake to blow candles!"}>
                           <div className="w-36 h-20 rounded bg-amber-200 border-2 border-amber-800/15 shadow-md relative pt-2 px-2">
                             <div className="h-4 bg-amber-100 border-b border-amber-800/10 rounded-t-sm"></div>
                             <div className="h-4 bg-amber-300 mt-1 border-b border-amber-800/10"></div>
                             <div className="h-4 bg-amber-200 mt-1 border-b border-amber-800/10 rounded-b-sm"></div>
                             {/* Candles - Ensure map index 'i' has type */}
                             <div className="absolute -top-6 w-full flex justify-center space-x-2.5">
                               {[...Array(3)].map((_, i: number) => (
                                   <div key={i} className="relative flex flex-col items-center">
                                      <motion.div
                                          animate={candleControls}
                                          initial={{ opacity: 1, scaleY: 1 }}
                                          className="w-3 h-4 bg-gradient-to-b from-yellow-200 via-orange-400 to-transparent rounded-t-full blur-[2px] origin-bottom"
                                          style={{ boxShadow: "0 -2px 8px 1px rgba(245, 158, 11, 0.6)" }}
                                       />
                                      <motion.div
                                          className="w-1 h-6 bg-gradient-to-r from-red-200 to-red-400 rounded-sm shadow-sm"
                                       />
                                   </div>
                               ))}
                             </div>
                           </div>
                           {!hasBlownCandles && (
                              <motion.p animate={{ opacity: [0, 0.7, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-amber-800/70 font-serif text-[10px] mt-1 text-center italic absolute -bottom-3 w-full pointer-events-none"> Blow Candles! </motion.p>
                           )}
                        </motion.div>
                    )}

                    {/* Gifts */}
                    {showGifts && (
                       <div className="flex justify-center space-x-3 mt-2 mb-4">
                           {/* Ensure gift index 'i' is typed */}
                           {gifts.map((gift, i: number) => (
                               <motion.div
                                   key={i} className="relative"
                                   initial={{ scale: 0, y: 20 }}
                                   animate={{ scale: gift.scale, y: [0, -4, 0] }}
                                   transition={{ scale: { delay: gift.delay, type: "spring", stiffness: 120 }, y: { repeat: Infinity, duration: 1.5 + i * 0.3, ease: "easeInOut", delay: gift.delay } }}
                                   whileHover={{ scale: gift.scale * 1.08, zIndex: 10 }}
                                >
                                   <div className="w-10 h-10 rounded-sm shadow-sm border border-amber-800/20" style={{ backgroundColor: gift.color }} />
                                   <div className="absolute top-1/2 left-0 w-full h-1.5 -mt-[3px] bg-amber-800/15 border-y border-amber-800/10" />
                                   <div className="absolute top-0 left-1/2 w-1.5 h-full -ml-[3px] bg-amber-800/15 border-x border-amber-800/10" />
                                </motion.div>
                           ))}
                       </div>
                    )}

                    <div className="mt-auto text-center">
                        <motion.p className="font-dancing text-2xl text-amber-800/95" initial={{ opacity: 0 }} animate={showMessage ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
                          Sincerely Arul,
                        </motion.p>
                        {/* <motion.p className="font-dancing text-xl text-amber-800/80" initial={{ opacity: 0 }} animate={showMessage ? { opacity: 1 } : {}} transition={{ delay: 0.7 }}>
                          A Friend // Commented out placeholder if not needed
                        </motion.p> */}
                    </div>

                    {/* Wax Seal */}
                    <motion.div className="absolute bottom-5 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md" initial={{ scale: 0, rotate: -10 }} animate={showMessage ? { scale: 1, rotate: 5 } : {}} transition={{ delay: 0.8, type: "spring", stiffness: 90 }} >
                         <span className="text-amber-100 text-lg font-serif transform -rotate-12">A</span>
                    </motion.div>
                  </div>
               </div>
          </div>
        </motion.div>
      </div>

       {/* Fireworks */}
       {isOpen && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(8)].map((_, i: number) => ( // Add type for index 'i'
            <motion.div
              key={`firework-${i}`} className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 1.1] }}
              transition={{
                  repeat: Infinity, duration: 3 + Math.random() * 3, delay: 0.5 + Math.random() * 4,
                  ease: "easeOut", repeatDelay: 2 + Math.random() * 3
              }}
              style={{
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
               }}
            >
              <div className="w-24 h-24 rounded-full"
                   style={{
                     background: `radial-gradient(circle, ${ [VINTAGE_COLORS.primary, VINTAGE_COLORS.secondary, VINTAGE_COLORS.gold, VINTAGE_COLORS.accent2][i % 4]}66 0%, transparent 65%)`,
                     filter: `blur(5px)`
                    }}
               />
            </motion.div>
          ))}
        </div>
       )}

      <style jsx global>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden; /* Safari */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-dancing { font-family: 'Dancing Script', cursive; }
        .font-serif { font-family: 'Playfair Display', serif; }
        body { margin: 0; line-height: 1.6; }
      `}</style>
    </div>
  );
}
