import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, PenTool, CheckCircle, Flame, Bookmark, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { VideoComment } from '../types';

interface CommentSectionProps {
  comments: VideoComment[];
  currentPlaybackTime: number;
  onAddComment: (text: string, category: 'correction' | 'approval' | 'idea' | 'general', timestamp: number) => void;
  onCommentClick: (timestamp: number) => void;
  activeHoverComment: VideoComment | null;
  maxDuration?: number;
}

// Convertir segundos brutos a formato de entrada según la escala del video
const formatSecondsToInput = (totalSeconds: number, maxDuration?: number): string => {
  const isLarge = maxDuration && maxDuration >= 3600;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (isLarge || hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Convertir texto de nuevo a segundos
const parseTimeToSeconds = (input: string): number | null => {
  const cleaned = input.trim();
  if (!cleaned) return null;

  // Solo dígitos: tratar como segundos brutos
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }

  const parts = cleaned.split(':');
  // MM:SS
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) {
      return (mins * 60) + secs;
    }
  } 
  // HH:MM:SS
  else if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    const secs = parseInt(parts[2], 10);
    if (!isNaN(hrs) && !isNaN(mins) && !isNaN(secs)) {
      return (hrs * 3600) + (mins * 60) + secs;
    }
  }

  return null;
};

export default function CommentSection({ 
  comments, 
  currentPlaybackTime, 
  onAddComment, 
  onCommentClick,
  activeHoverComment,
  maxDuration
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [category, setCategory] = useState<'correction' | 'approval' | 'idea' | 'general'>('general');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customTimeStamp, setCustomTimeStamp] = useState(Math.round(currentPlaybackTime));
  const [timeInputStr, setTimeInputStr] = useState(formatSecondsToInput(Math.round(currentPlaybackTime), maxDuration));

  const headingText = "Colaboraciones en Línea de Tiempo";

  // Mantener el tiempo de reproducción sincronizado cuando el usuario está en modo de emparejamiento directo
  useEffect(() => {
    if (useCurrentTime) {
      const activeSecs = Math.round(currentPlaybackTime);
      setCustomTimeStamp(activeSecs);
      setTimeInputStr(formatSecondsToInput(activeSecs, maxDuration));
    }
  }, [currentPlaybackTime, useCurrentTime, maxDuration]);

  const handleTimeInputChange = (val: string) => {
    setTimeInputStr(val);
    const parsed = parseTimeToSeconds(val);
    if (parsed !== null) {
      if (maxDuration !== undefined && parsed > maxDuration) {
        // Limitamos el estado guardado a la duración máxima
        setCustomTimeStamp(maxDuration);
      } else {
        setCustomTimeStamp(Math.max(0, parsed));
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    let stamp = useCurrentTime ? Math.round(currentPlaybackTime) : customTimeStamp;
    
    // Asegurar límites
    if (maxDuration !== undefined) {
      stamp = Math.min(maxDuration, Math.max(0, stamp));
    } else {
      stamp = Math.max(0, stamp);
    }
    
    onAddComment(commentText, category, stamp);
    
    // Restablecer el formulario pero mantener el selector de modo de tiempo
    setCommentText('');
    setCategory('general');
    if (!useCurrentTime) {
      // Actualizar el bloqueo personalizado al tiempo de reproducción actual tras enviar para evitar estados obsoletos
      const cur = Math.round(currentPlaybackTime);
      setCustomTimeStamp(cur);
      setTimeInputStr(formatSecondsToInput(cur, maxDuration));
    }
  };

  // Convertir segundos a un formato legible de MM:SS o HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0 || (maxDuration && maxDuration >= 3600)) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryTheme = (cat: VideoComment['category']) => {
    switch (cat) {
      case 'approval':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          label: 'Aprobado',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          indicator: 'bg-emerald-500'
        };
      case 'correction':
        return {
          icon: <PenTool className="w-3.5 h-3.5" />,
          label: 'Corrección',
          bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
          indicator: 'bg-rose-500'
        };
      case 'idea':
        return {
          icon: <Flame className="w-3.5 h-3.5" />,
          label: 'Idea',
          bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
          indicator: 'bg-amber-500'
        };
      default:
        return {
          icon: <Bookmark className="w-3.5 h-3.5" />,
          label: 'Nota General',
          bg: 'bg-slate-50 text-slate-700 border-slate-200/60',
          indicator: 'bg-slate-400'
        };
    }
  };

  const parsedSeconds = parseTimeToSeconds(timeInputStr);
  const isTimeInvalid = parsedSeconds === null;
  const isTimeExceeded = maxDuration !== undefined && parsedSeconds !== null && parsedSeconds > maxDuration;
  const isFormDisabled = !commentText.trim() || (!useCurrentTime && (isTimeInvalid || isTimeExceeded));

  return (
    <div className="w-full bg-white border border-slate-200/60 rounded-xl shadow-xs overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200/60">
      
      {/* 1. Panel de Comentarios (Lado izquierdo) */}
      <div className="flex-1 p-5 flex flex-col min-h-[350px] max-h-[500px]">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-sans font-bold text-slate-800 text-sm">
              {headingText}
            </h2>
            <span className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Clic en un comentario para saltar a ese segundo</span>
        </div>

        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-300 mb-2.5" />
            <p className="text-sm font-semibold text-slate-700">Aún no hay comentarios</p>
            <p className="text-xs text-slate-400 mt-1">¡Sé el primero en agregar un comentario en un segundo específico!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {comments
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((comment) => {
                const config = getCategoryTheme(comment.category);
                const isHovered = activeHoverComment?.id === comment.id;

                return (
                  <div
                    key={comment.id}
                    onClick={() => onCommentClick(comment.timestamp)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all duration-200 flex gap-3 ${
                      isHovered 
                        ? 'border-primary bg-slate-50 shadow-xs ring-2 ring-primary/5 -translate-y-[1px]' 
                        : 'border-slate-100/70 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img 
                      src={comment.avatar} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" 
                      alt={comment.author} 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <span className="font-bold text-xs text-slate-800 truncate">{comment.author}</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 scale-[0.9] origin-right ${config.bg}`}>
                            {config.icon}
                            {config.label}
                          </span>
                          <span className="font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                            {formatTime(comment.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-[11px] font-medium leading-relaxed break-words">
                        {comment.text}
                      </p>
                      
                      <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-slate-100/50 text-[10px] text-slate-400">
                        <span>{comment.createdAt}</span>
                        <span className="text-primary font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Saltar a <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 2. Formulario de Retroalimentación (Lado derecho) */}
      <div className="w-full md:w-[320px] p-5 flex flex-col justify-between bg-slate-50/70">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-sm mb-1">
            Publicar Comentario de Equipo
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 font-medium leading-normal">
            Su comentario quedará fijado en un segundo exacto de la línea de tiempo del video para su seguimiento por parte del equipo.
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Opciones de marca de tiempo */}
            <div className="flex flex-col gap-2 bg-white border border-slate-200/50 p-3 rounded-lg shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Configuración de Tiempo</span>
                <span className="font-bold font-mono text-xs bg-primary text-white py-0.5 px-2 rounded">
                  {formatTime(useCurrentTime ? Math.round(currentPlaybackTime) : customTimeStamp)}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600 select-none">
                  <input
                    type="radio"
                    checked={useCurrentTime}
                    onChange={() => setUseCurrentTime(true)}
                    className="accent-primary"
                  />
                  Tiempo de Reproducción ({formatTime(Math.round(currentPlaybackTime))})
                </label>
                
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600 select-none">
                  <input
                    type="radio"
                    checked={!useCurrentTime}
                    onChange={() => {
                      setUseCurrentTime(false);
                      setCustomTimeStamp(Math.round(currentPlaybackTime));
                    }}
                    className="accent-primary"
                  />
                  Bloqueo Fijo
                </label>
              </div>

              {!useCurrentTime && (
                <div className="mt-2 text-left">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Establecer Tiempo (m:s / h:m:s / segundos):</span>
                  <input
                    type="text"
                    value={timeInputStr}
                    onChange={(e) => handleTimeInputChange(e.target.value)}
                    placeholder={maxDuration ? `Ej. 1:30 o 90 (máx ${formatSecondsToInput(maxDuration, maxDuration)})` : "Ej. 1:30 o 90"}
                    className={`w-full bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded border focus:outline-none focus:ring-1 font-mono transition-colors ${
                      isTimeInvalid || isTimeExceeded 
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 text-rose-700 bg-rose-50/20' 
                        : 'border-slate-200 focus:border-primary focus:ring-primary'
                    }`}
                  />
                  {isTimeInvalid && (
                    <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" /> Use formato m:s, h:m:s o segundos (ej: 1:30).
                    </span>
                  )}
                  {isTimeExceeded && (
                    <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" /> Excede la duración máxima del video ({formatSecondsToInput(maxDuration || 0, maxDuration)}).
                    </span>
                  )}
                  {!isTimeInvalid && !isTimeExceeded && parsedSeconds !== null && (
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500 shrink-0" /> Posición: {formatSecondsToInput(parsedSeconds, maxDuration)} ({parsedSeconds} s)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Elección de tipo de comentario */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 text-left">Tipo de Comentario</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'approval', label: 'Aprobado', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700', activeBg: 'bg-emerald-500 text-white' },
                  { value: 'correction', label: 'Fijar Corrección', color: 'border-rose-200 hover:bg-rose-50 text-rose-700', activeBg: 'bg-rose-500 text-white' },
                  { value: 'idea', label: 'Sugerencia', color: 'border-amber-200 hover:bg-amber-50 text-amber-700', activeBg: 'bg-amber-500 text-white' },
                  { value: 'general', label: 'Nota General', color: 'border-slate-200 hover:bg-slate-100 text-slate-700', activeBg: 'bg-slate-700 text-white' }
                ].map((item) => {
                  const isActive = category === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategory(item.value as VideoComment['category'])}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                        isActive 
                        ? item.activeBg + ' scale-102 border-transparent' 
                        : item.color + ' bg-white text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Texto del comentario */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 text-left">Descripción del Comentario</span>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ej: La transición se ve un poco rápida aquí, o ¡buena paleta de colores!"
                rows={3}
                required
                className="w-full bg-white text-slate-800 text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isFormDisabled}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:text-slate-400 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Añadir Comentario
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
