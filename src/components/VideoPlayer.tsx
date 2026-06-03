import React, { useState, useEffect, useRef, SyntheticEvent } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, MessageCircle, Info, ChevronDown, ChevronUp, Lock, Unlock, Trash2 } from 'lucide-react';
import { VideoAsset, VideoComment } from '../types';

interface VideoPlayerProps {
  video: VideoAsset;
  onTimeUpdate?: (seconds: number) => void;
  jumpToTimeTrigger?: number | null;
  onClearJumpTime?: () => void;
  onCommentHover?: (comment: VideoComment | null) => void;
  onDeleteVideo?: (videoId: string) => void;
}

export default function VideoPlayer({ 
  video, 
  onTimeUpdate, 
  jumpToTimeTrigger, 
  onClearJumpTime,
  onCommentHover,
  onDeleteVideo
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 30);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [hoverComment, setHoverComment] = useState<VideoComment | null>(null);
  const [hoverCommentLeft, setHoverCommentLeft] = useState(0);

  // Keyboard shortcut HUD feedback message state
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; id: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Focus lock mode state indicators
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  const hintTimerRef = useRef<any>(null);

  // Custom non-blocking interactive states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showFeedback = (text: string) => {
    setFeedbackMsg({ text, id: Date.now() });
  };

  const disableFocusLock = () => {
    setIsLocked(false);
    setShowUnlockHint(false);
    showFeedback('🔓 Interfaz Desbloqueada');
    if (document.fullscreenElement) {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.log('Exit fullscreen error:', err));
    }
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
  };

  const enableFocusLock = () => {
    if (!videoRef.current) return;
    setIsLocked(true);
    setShowUnlockHint(true);
    showFeedback('🔒 Modo Focus Bloqueado');
    
    // Request fullscreen on container
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.log('Fullscreen error:', err));
    }

    // Play automatically if paused
    if (!isPlaying) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Playback error:', err));
    }

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowUnlockHint(false);
    }, 4500);
  };

  // Unified control system for Foco mode lock & Hotkeys (Ctrl + Shift + F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Check for unlock / lock toggle combination: Ctrl + Shift + F
      const isCombo = e.ctrlKey && e.shiftKey && (e.key === 'f' || e.key === 'F' || e.code === 'KeyF');
      if (isCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (isLocked) {
          disableFocusLock();
        } else {
          // If the user's cursor is focused on an input element, don't trigger the auto-lock
          const activeElement = document.activeElement;
          if (
            activeElement &&
            (activeElement.tagName === 'INPUT' ||
             activeElement.tagName === 'TEXTAREA' ||
             activeElement.tagName === 'SELECT' ||
             activeElement.hasAttribute('contenteditable'))
          ) {
            return;
          }
          enableFocusLock();
        }
        return;
      }

      // If NOT currently locked, let all other standard keys propagate freely
      if (!isLocked) return;

      // 2. We are in locked Focus Mode: trap keys, special sequences and standard inputs
      const key = e.key;
      const lowerKey = key.toLowerCase();

      // Skip triggering flash-hint for modifier-only keys to keep lock interface smooth when building a combo
      const isRawModifier = key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta';

      const isSpecialOrSystemKey = 
        key === 'Escape' || 
        key === 'Esc' || 
        (lowerKey.startsWith('f') && /f\d+/.test(lowerKey)) || // F1 - F12
        key === 'Meta' || 
        key === 'OS' ||
        key === 'Alt' ||
        key === 'ContextMenu' ||
        key === 'Tab' ||
        e.altKey || 
        e.metaKey;

      // Force request fullscreen inside user gesture context if they manually press Escape to try and exit
      if (key === 'Escape' || key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        if (containerRef.current && !document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(err => console.log('Interactive fullscreen recovery:', err));
        }
        triggerHint();
        return;
      }

      if (isSpecialOrSystemKey) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block all other keys entirely
      e.preventDefault();
      e.stopPropagation();

      if (!isRawModifier) {
        triggerHint();
      }
    };

    const handleGlobalKeyUpKeyPress = (e: KeyboardEvent) => {
      if (!isLocked) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalMouseEvent = (e: MouseEvent) => {
      if (!isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      triggerHint();
    };

    const handleGlobalWheel = (e: WheelEvent) => {
      if (!isLocked) return;
      e.preventDefault();
      e.stopPropagation();
      triggerHint();
    };

    const triggerHint = () => {
      setShowUnlockHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        setShowUnlockHint(false);
      }, 3000);
    };

    // Register capture-phase listeners on window to override and drop events before they propagate to lower elements
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('keyup', handleGlobalKeyUpKeyPress, true);
    window.addEventListener('keypress', handleGlobalKeyUpKeyPress, true);
    window.addEventListener('click', handleGlobalMouseEvent, true);
    window.addEventListener('mousedown', handleGlobalMouseEvent, true);
    window.addEventListener('mouseup', handleGlobalMouseEvent, true);
    window.addEventListener('contextmenu', handleGlobalMouseEvent, true);
    window.addEventListener('dblclick', handleGlobalMouseEvent, true);
    window.addEventListener('wheel', handleGlobalWheel, { capture: true, passive: false });

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      window.removeEventListener('keyup', handleGlobalKeyUpKeyPress, true);
      window.removeEventListener('keypress', handleGlobalKeyUpKeyPress, true);
      window.removeEventListener('click', handleGlobalMouseEvent, true);
      window.removeEventListener('mousedown', handleGlobalMouseEvent, true);
      window.removeEventListener('mouseup', handleGlobalMouseEvent, true);
      window.removeEventListener('contextmenu', handleGlobalMouseEvent, true);
      window.removeEventListener('dblclick', handleGlobalMouseEvent, true);
      window.removeEventListener('wheel', handleGlobalWheel, true);
    };
  }, [isLocked, isPlaying]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  // Automatically clear feedback flash message after 800ms
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => {
        setFeedbackMsg(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Monitor source changes. If the video ID changes, reset playing and current states
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
    setIsExpanded(false);
    setIsLocked(false);
    setShowUnlockHint(false);
    setShowDeleteConfirm(false);
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.id, video.url]);

  // Handle outside jump actions (such as clicking a comment)
  useEffect(() => {
    if (jumpToTimeTrigger !== null && jumpToTimeTrigger !== undefined && videoRef.current) {
      videoRef.current.currentTime = jumpToTimeTrigger;
      setCurrentTime(jumpToTimeTrigger);
      setIsPlaying(true);
      videoRef.current.play().catch(() => {});
      if (onClearJumpTime) onClearJumpTime();
    }
  }, [jumpToTimeTrigger]);

  // Registers YouTube-style Keyboard Shortcut Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside comments or search input forms
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT' ||
         activeElement.hasAttribute('contenteditable'))
      ) {
        return;
      }

      const player = videoRef.current;
      if (!player) return;

      const key = e.key.toLowerCase();

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          if (isPlaying) {
            player.pause();
            setIsPlaying(false);
            showFeedback('Pausa ⏸');
          } else {
            player.play()
              .then(() => {
                setIsPlaying(true);
                showFeedback('Reproducir ▶');
              })
              .catch(() => {});
          }
          break;

        case 'k':
        case 'K':
          e.preventDefault();
          if (isPlaying) {
            player.pause();
            setIsPlaying(false);
            showFeedback('Pausa ⏸');
          } else {
            player.play()
              .then(() => {
                setIsPlaying(true);
                showFeedback('Reproducir ▶');
              })
              .catch(() => {});
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          {
            const targetTime = Math.max(0, player.currentTime - 5);
            player.currentTime = targetTime;
            setCurrentTime(targetTime);
            showFeedback('Retroceder 5s ⏪');
          }
          break;

        case 'j':
        case 'J':
          e.preventDefault();
          {
            const targetTime = Math.max(0, player.currentTime - 10);
            player.currentTime = targetTime;
            setCurrentTime(targetTime);
            showFeedback('Retroceder 10s ⏪');
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          {
            const targetTime = Math.min(duration, player.currentTime + 5);
            player.currentTime = targetTime;
            setCurrentTime(targetTime);
            showFeedback('Adelantar 5s ⏩');
          }
          break;

        case 'l':
        case 'L':
          e.preventDefault();
          {
            const targetTime = Math.min(duration, player.currentTime + 10);
            player.currentTime = targetTime;
            setCurrentTime(targetTime);
            showFeedback('Adelantar 10s ⏩');
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          {
            const nextVol = Math.min(1, volume + 0.1);
            setVolume(nextVol);
            player.volume = nextVol;
            player.muted = false;
            setIsMuted(false);
            showFeedback(`Volumen: ${Math.round(nextVol * 100)}% 🔊`);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          {
            const nextVol = Math.max(0, volume - 0.1);
            setVolume(nextVol);
            player.volume = nextVol;
            if (nextVol === 0) {
              player.muted = true;
              setIsMuted(true);
              showFeedback('Silenciado 🔇');
            } else {
              player.muted = false;
              setIsMuted(false);
              showFeedback(`Volumen: ${Math.round(nextVol * 100)}% 🔉`);
            }
          }
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            player.muted = nextMuted;
            showFeedback(nextMuted ? 'Silenciado 🔇' : `Volumen: ${Math.round(volume * 100)}% 🔊`);
          }
          break;

        case '0':
          e.preventDefault();
          {
            player.currentTime = 0;
            setCurrentTime(0);
            showFeedback('Reiniciar video 🔄');
          }
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, duration, volume, isMuted, isFullscreen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log('Playback error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    if (onTimeUpdate) {
      onTimeUpdate(current);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || video.duration || 30);
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const value = parseFloat(e.target.value);
    setVolume(value);
    videoRef.current.volume = value;
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (rate: number) => {
    if (!videoRef.current) return;
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Keep fullscreen state synced if user exits with Esc key and prevent escaping if locked
  useEffect(() => {
    const handleFullscreenSync = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (isLocked && !isCurrentlyFullscreen && containerRef.current) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.log('Fullscreen lock enforcement failed:', err));
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenSync);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenSync);
  }, [isLocked]);

  // Format seconds to digital clock output MM:SS
  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '00:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Container holding the physical player, overlays, and custom UI controls */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => {
          setIsHoveringControls(false);
          setHoverComment(null);
          if (onCommentHover) onCommentHover(null);
        }}
        className="w-full aspect-video bg-neutral-950 rounded-xl relative overflow-hidden group shadow-lg border border-neutral-800 select-none"
      >
        {/* HTML5 video element */}
        <video
          ref={videoRef}
          src={video.url}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            if (isLocked) {
              disableFocusLock();
            }
          }}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
        />

        {/* Fullscreen blocker / focus overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-[99999] bg-black/30 backdrop-blur-[2px] select-none cursor-none flex flex-col justify-between p-6">
            {/* Elegant warning head alert */}
            {showUnlockHint && (
              <div className="mx-auto bg-slate-900/95 border border-slate-700/80 text-white rounded-xl py-3.5 px-6 text-center shadow-2xl animate-scale-in flex flex-col items-center gap-1.5 max-w-sm sm:max-w-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span className="font-extrabold uppercase text-[10px] tracking-wider text-rose-300">Modo Foco Bloqueado</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  El ratón y teclado están inhabilitados para evitar distracciones.
                </p>
                <div className="mt-2 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700/60 flex items-center gap-1.5 font-sans">
                  Presiona <kbd className="bg-primary px-1.5 py-0.5 rounded text-white text-[11px] font-sans border border-primary/20">Ctrl</kbd> + <kbd className="bg-primary px-1.5 py-0.5 rounded text-white text-[11px] font-sans border border-primary/20">Shift</kbd> + <kbd className="bg-primary px-1.5 py-0.5 rounded text-white text-[11px] font-sans border border-primary/20">F</kbd> para desbloquear
                </div>
              </div>
            )}
            
            {/* Empty space, keep video completely visible */}
            <div></div>

            {/* Bottom floating helper badge */}
            {showUnlockHint && (
              <div className="mx-auto text-[10px] text-slate-300 font-bold bg-slate-900/95 py-1.5 px-4 rounded-full border border-slate-800/80 backdrop-blur-xs animate-scale-in">
                El bloqueo se desactivará automáticamente al finalizar el video.
              </div>
            )}
          </div>
        )}

        {/* Center play icon overlay shown when paused */}
        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg border border-white/20"
          >
            <Play className="w-8 h-8 fill-white ml-1" />
          </button>
        )}

        {/* Keyboard shortcut HUD Feedback Flash */}
        {feedbackMsg && (
          <div 
            key={feedbackMsg.id}
            className="absolute inset-0 m-auto w-max h-max bg-black/80 backdrop-blur-md text-white font-sans text-sm font-extrabold px-6 py-3 rounded-2xl border border-neutral-700/60 shadow-2xl z-50 pointer-events-none animate-scale-in flex items-center gap-2"
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Loading Indicator Spinner overlay */}
        {video.url.startsWith('blob:') && duration === 30 && currentTime === 0 && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 rounded flex items-center gap-1.5 py-1 py-1 text-slate-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> 
            Conexión Local Establecida
          </div>
        )}

        {/* Floating Timeline Comment hover popover inside player */}
        {hoverComment && (
          <div 
            style={{ left: `calc(${hoverCommentLeft}% - 140px)` }}
            className="absolute bottom-16 bg-slate-900/95 border border-slate-700/80 text-white rounded-lg p-3 w-72 text-xs shadow-2xl z-40 animate-scale-in"
          >
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
              <img src={hoverComment.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
              <span className="font-bold text-slate-100 truncate">{hoverComment.author}</span>
              <span className="bg-primary/50 text-[10px] scale-90 px-1 py-0.2 px-1 rounded ml-auto text-slate-300">
                {formatTime(hoverComment.timestamp)}
              </span>
            </div>
            <p className="text-slate-200 block text-left line-clamp-2 italic">"{hoverComment.text}"</p>
          </div>
        )}

        {/* Persistent bottom black gradient background shadow for the timeline controls */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-3 px-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-auto">
          
          {/* Custom Timeline Area containing actual comments markers mapped as clickable dot badges */}
          <div className="relative w-full flex items-center h-4 group/timeline select-none">
            {/* The Scrub Range Input */}
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentTime}
              onChange={handleScrubChange}
              className="w-full accent-primary h-1 hover:h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer duration-100 z-10 opacity-90 hover:opacity-100"
              style={{
                background: `linear-gradient(to right, #5e7185 0%, #5e7185 ${(currentTime / (duration || 30)) * 100}%, #404040 ${(currentTime / (duration || 30)) * 100}%, #404040 100%)`
              }}
            />

            {/* Mapped Timeline Dot Marks for Collaborative comments */}
            {(video.comments || []).map((comment) => {
              const markerLeft = (comment.timestamp / (duration || 30)) * 100;
              const isApproved = comment.category === 'approval';
              const isCorrection = comment.category === 'correction';
              const isIdea = comment.category === 'idea';

              return (
                <div
                  key={comment.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) videoRef.current.currentTime = comment.timestamp;
                  }}
                  onMouseEnter={() => {
                    setHoverComment(comment);
                    setHoverCommentLeft(markerLeft);
                    if (onCommentHover) onCommentHover(comment);
                  }}
                  onMouseLeave={() => {
                    setHoverComment(null);
                    if (onCommentHover) onCommentHover(null);
                  }}
                  style={{ left: `${markerLeft}%` }}
                  className={`absolute w-2.5 h-2.5 rounded-full border border-black shadow-xs cursor-pointer z-20 group -translate-x-1/2 hover:scale-130 transition-all ${
                    isApproved ? 'bg-emerald-400' : isCorrection ? 'bg-rose-400' : isIdea ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                  title={`${comment.author} [${formatTime(comment.timestamp)}]: ${comment.text}`}
                />
              );
            })}
          </div>

          {/* Player controls toolbar interface */}
          <div className="flex justify-between items-center text-white text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-3">
              {/* Reproducir / Pausar */}
              <button 
                onClick={togglePlay}
                title={isPlaying ? "Pausar Video" : "Reproducir Video"}
                className="hover:text-primary-container p-1 rounded-sm focus:outline-none transition-colors active:scale-90"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Control deslizante de volumen */}
              <div className="flex items-center gap-1 group/volume">
                <button 
                  onClick={toggleMute}
                  title="Silenciar / Activar Sonido"
                  className="hover:text-primary-container p-1 rounded-sm focus:outline-none transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-16 h-1 bg-neutral-600 rounded-lg appearance-none accent-white cursor-pointer transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Digital live video timing monitor */}
              <span className="font-mono text-xs text-neutral-300 ml-1">
                {formatTime(currentTime)} <span className="text-neutral-500">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Quick playback modification controls */}
            <div className="flex items-center gap-3.5">
              {/* Reset to beginning */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="text-neutral-300 hover:text-white p-1 transition-colors"
                title="Reiniciar Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Indicador de control de velocidad de reproducción */}
              <div className="flex items-center gap-1 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mr-1">Velocidad:</span>
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`text-[10px] font-bold px-1 rounded transition-all ${
                      playbackRate === rate
                        ? 'bg-primary text-white scale-105'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Focus mode lock button */}
              <button 
                onClick={enableFocusLock}
                title="Activar Modo Foco Bloqueado (Teclado y Ratón)"
                className="text-neutral-300 hover:text-rose-405 p-1 transition-colors hover:scale-105"
              >
                <Lock className="w-4 h-4 text-rose-400 fill-rose-400/10" />
              </button>

              {/* Botón de alternancia de pantalla completa */}
              <button 
                onClick={toggleFullscreen}
                title="Pantalla Completa"
                className="hover:text-primary-container p-1 rounded-sm focus:outline-none transition-colors hover:scale-105"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Tags, Specs and metadata displayed under the main Video component */}
      <div className="flex flex-col gap-5 bg-white border border-slate-200/60 p-5 rounded-xl shadow-xs transition-all duration-300">
        {/* Row 1: Video Name and Description */}
        <div className="w-full flex flex-col text-left">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-sans font-extrabold text-slate-800 text-base md:text-lg tracking-tight leading-snug" title={video.name}>
              {video.name}
            </h3>
            <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded border border-slate-200/50 select-none shrink-0">
              {video.format}
            </span>
          </div>
          
          <p className="text-[12px] text-slate-600 italic leading-relaxed whitespace-pre-wrap">
            {video.description || 'Sin descripción asignada a este video.'}
          </p>
        </div>

        {/* Row 2: Video Metadata and Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200/50 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Resolución: {video.resolution || '1080p'}
            </span>
            <span className="bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200/50 flex items-center gap-1.5 shadow-2xs">
              Fotogramas: {video.fps || '24fps'}
            </span>
            <span className="bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200/50 flex items-center gap-1.5 shadow-2xs">
              Tamaño: {video.size || 'Desconocido'}
            </span>
          </div>

          <button
            onClick={enableFocusLock}
            className={`font-semibold text-xs py-1.5 px-4 rounded-lg border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer max-w-fit select-none shadow-2xs ${
              isLocked 
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
            }`}
            title="Activa el bloqueo completo de teclado y ratón durante la reproducción."
          >
            <Lock className="w-3.5 h-3.5" /> 
            {isLocked ? 'Modo Foco Bloqueado' : 'Bloquear Interfaz (Ctrl+Shift+F)'}
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-250 p-1.5 rounded-lg transition-all">
              <span className="text-xs font-extrabold text-rose-700 px-0.5">¿Eliminar este video?</span>
              <button
                onClick={() => {
                  if (onDeleteVideo) {
                    onDeleteVideo(video.id);
                  }
                  setShowDeleteConfirm(false);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-1 px-3 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs py-1 px-3 rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs py-1.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer max-w-fit select-none shadow-2xs sm:ml-2"
              title="Eliminar este video"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar Video
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
