import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { VideoAsset } from '../types';

interface UploadZoneProps {
  onVideoLoaded: (newVideo: VideoAsset) => void;
  activeProjectId?: string;
}

export default function UploadZone({ onVideoLoaded, activeProjectId }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Formato de archivo no válido. Por favor, suba un archivo de video compatible (MP4, WebM, QuickTime, etc.).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Crear un elemento de video local temporal para obtener de forma dinámica su duración
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      // Determinar características del video
      const name = file.name;
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const duration = Math.round(tempVideo.duration) || 120; // Por defecto 2 min fallback
      const resolution = tempVideo.videoWidth ? `${tempVideo.videoWidth >= 3840 ? '4K' : tempVideo.videoHeight >= 1080 ? '1080p' : '720p'}` : '1080p';
      const fps = '30fps';

      const newAsset: VideoAsset = {
        id: 'uploaded-' + Date.now(),
        name: name,
        url: objectUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=600&auto=format&fit=crop',
        format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
        resolution,
        fps,
        size: sizeInMB,
        duration: duration,
        uploadedAt: new Date().toISOString().split('T')[0],
        projectId: activeProjectId || 'proj-alpha',
        description: `Clip de usuario subido localmente: "${name}". Ingestado de forma segura en entorno local.`,
        comments: []
      };

      setLoading(false);
      setIsDragActive(false);
      onVideoLoaded(newAsset);
    };

    tempVideo.onerror = () => {
      // Fallback en caso de que falle la lectura de metadatos o formato por el motor del navegador
      const name = file.name;
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      
      const newAsset: VideoAsset = {
        id: 'uploaded-' + Date.now(),
        name: name,
        url: objectUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1542204172-e7052809a862?q=80&w=600&auto=format&fit=crop',
        format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
        resolution: '1080p',
        fps: '24fps',
        size: sizeInMB,
        duration: 30, // por defecto 30 segundos
        uploadedAt: new Date().toISOString().split('T')[0],
        projectId: activeProjectId || 'proj-alpha',
        description: `Clip de usuario subido: "${name}". Fuente del almacenamiento local del navegador.`,
        comments: []
      };

      setLoading(false);
      setIsDragActive(false);
      onVideoLoaded(newAsset);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="w-full flex flex-col items-center gap-4">
      <div className="text-center max-w-2xl mb-2">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
          Subir Nuevo Video
        </h1>
        <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto">
          Arrastra y suelta tus archivos de video para comenzar la reproducción. Todos los formatos de alta resolución son compatibles mediante la vista previa del navegador local.
        </p>
      </div>

      <div
        id="dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`w-full max-w-3xl border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 px-6 transition-all duration-300 cursor-pointer text-center relative select-none ${
          isDragActive
            ? 'border-primary bg-slate-50 scale-[1.01] shadow-md ring-2 ring-primary/20'
            : 'border-slate-300 bg-white hover:border-primary/70 hover:bg-slate-50 shadow-xs'
        }`}
      >
        <input
          type="file"
          id="fileInput"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />

        {loading ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-700">Analizando metadatos del video...</p>
            <p className="text-xs text-slate-400 mt-1">Generando canal local seguro de reproducción</p>
          </div>
        ) : (
          <>
            <span className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full mb-3 transition-colors">
              <UploadCloud className="w-10 h-10 text-primary" />
            </span>
            <p className="text-lg font-bold text-slate-800 mb-1">
              Arrastra & Suelta
            </p>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              o haz clic para buscar en tu dispositivo
            </p>
            <button
              type="button"
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all duration-200 active:scale-95"
            >
              Seleccionar Archivo
            </button>
          </>
        )}

        {isDragActive && (
          <div className="absolute inset-0 bg-primary/5 rounded-xl border-2 border-primary flex items-center justify-center pointer-events-none animate-pulse">
            <p className="font-bold text-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> ¡Suelta para importar el video al instante!
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="max-w-3xl w-full flex items-center gap-3 bg-red-55/70 border border-red-100 text-red-600 rounded-lg p-3.5 text-xs font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
}
