import { useState, useMemo } from 'react';
import { INITIAL_VIDEOS, INITIAL_PROJECTS } from './data';
import { VideoAsset, VideoComment, Project } from './types';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import VideoPlayer from './components/VideoPlayer';
import CommentSection from './components/CommentSection';
import LibraryTab from './components/LibraryTab';
import ProjectsTab from './components/ProjectsTab';
import { FileVideo, HelpCircle, Shield, FileText } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState<VideoAsset[]>(INITIAL_VIDEOS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeVideoId, setActiveVideoId] = useState<string>('vid-1');
  const [activeTab, setActiveTab] = useState<'library' | 'recent' | 'projects'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Controladores de acción para saltar a segundos del video
  const [jumpToTimeTrigger, setJumpToTimeTrigger] = useState<number | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [activeHoverComment, setActiveHoverComment] = useState<VideoComment | null>(null);

  // Obtener el objeto de video activo
  const activeVideo = useMemo(() => {
    return videos.find((v) => v.id === activeVideoId) || videos[0] || null;
  }, [videos, activeVideoId]);

  // Insertar un nuevo comentario colaborativo en la línea de tiempo del video activo
  const handleAddComment = (
    text: string, 
    category: VideoComment['category'], 
    timestamp: number
  ) => {
    if (!activeVideo) return;

    const newComment: VideoComment = {
      id: 'comm-' + Date.now(),
      timestamp,
      author: 'César Garzaro (Yo)',
      text,
      category,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjk7gx29xo3HhyfzzOZrQZMs1zJRgyRgrAvC6xqQ40f9Mm6pCaQCKd9U2ofdx6paWAJs-hVgN8RsfwJjWF-zREyb4Nq0ipJFEl_UC8lKUG3fjWIoS2edeNcEXdYUaMFthgJUgEAFstdwx1fCnIef_gupQcXEv4R9UXrD8mh3kJsdD-PuYtsk-1MUCI_NUPrfXWPMmI2shUhJRPA_CJ5PYRR7p6WCNYTvKk06ErqHTMeyCgm7snsOpqCYsFTj5gc15d-bCpgbnWrSo'
    };

    setVideos(prevVideos => 
      prevVideos.map(video => {
        if (video.id === activeVideo.id) {
          return {
            ...video,
            comments: [...(video.comments || []), newComment]
          };
        }
        return video;
      })
    );
  };

  // Guardar datos al cargar un archivo en UploadZone
  const handleVideoLoaded = (newVideo: VideoAsset) => {
    // Guardar en la lista de videos y establecer como activo
    setVideos(prevVideos => [newVideo, ...prevVideos]);
    setActiveVideoId(newVideo.id);
    
    // Llevar automáticamente al usuario al espacio del reproductor para revisar el video subido
    setActiveTab('recent');

    // Desplazamiento suave de la vista del usuario hacia el área de reproducción para una respuesta visual instantánea
    setTimeout(() => {
      const section = document.getElementById('playback-workspace-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Sincronizar el salto a un segundo al hacer clic en un comentario
  const handleCommentClick = (timestamp: number) => {
    setJumpToTimeTrigger(timestamp);
    // Desplazamiento suave de la vista hacia la sección del reproductor de video
    const section = document.getElementById('playback-workspace-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClearJumpTime = () => {
    setJumpToTimeTrigger(null);
  };

  // Sincronizar estado cuando se pasa el cursor sobre un marcador de comentario
  const handleCommentHover = (comment: VideoComment | null) => {
    setActiveHoverComment(comment);
  };

  // Manejar eliminación de videos activos
  const handleDeleteVideo = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
    // Si se eliminó el video actualmente activo, volver al siguiente disponible
    if (activeVideoId === videoId) {
      const remaining = videos.filter(v => v.id !== videoId);
      if (remaining.length > 0) {
        setActiveVideoId(remaining[0].id);
      }
    }
  };

  // Manejar la edición de metadatos del video
  const handleUpdateVideo = (updatedVideo: VideoAsset) => {
    setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
  };

  // Manejar la adición de una carpeta de nuevo Proyecto
  const handleAddProject = (name: string, description: string, category: string, initialVideo?: VideoAsset) => {
    const projectId = 'proj-' + Date.now();
    const newProject: Project = {
      id: projectId,
      name,
      description,
      category,
      createdAt: new Date().toISOString().split('T')[0],
      videoCount: initialVideo ? 1 : 0
    };
    setProjects(prev => [...prev, newProject]);

    if (initialVideo) {
      const assignedVideo = {
        ...initialVideo,
        projectId: projectId
      };
      setVideos(prev => [assignedVideo, ...prev]);
      setActiveVideoId(assignedVideo.id);
      setActiveTab('recent');

      // Desplazamiento suave automático hacia el reproductor para retroalimentación instantánea
      setTimeout(() => {
        const section = document.getElementById('playback-workspace-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Asociar un video subido o cargado a un proyecto existente
  const handleAddVideoToProject = (projectId: string, video: VideoAsset) => {
    const assignedVideo = {
      ...video,
      projectId: projectId
    };
    setVideos(prev => [assignedVideo, ...prev]);
    setActiveVideoId(assignedVideo.id);
    setActiveTab('recent');

    // Desplazamiento suave automático hacia el área de reproducción
    setTimeout(() => {
      const section = document.getElementById('playback-workspace-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Filtrar biblioteca desde los enlaces del panel de Proyectos
  const handleSelectProjectFilter = (projectId: string) => {
    // Si tenemos videos cargados que coincidan, enfocar el primer video de ese proyecto
    const match = videos.find(v => v.projectId === projectId);
    if (match) {
      setActiveVideoId(match.id);
    }
    setActiveTab('library');
  };

  return (
    <div className="bg-[#f7f9ff] text-[#181c20] min-h-screen flex flex-col font-sans">
      
      {/* 1. Componente del Encabezado */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSearch={setSearchQuery} 
      />

      {/* 2. Envoltura del Contenido Principal */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        
        {/* VISTA 1: Pestaña de Espacio Reciente */}
        {activeTab === 'recent' && (
          <div className="w-full flex flex-col gap-8 animate-fade-in">
            {/* Zona integrada de arrastre y carga de archivos */}
            <UploadZone 
              onVideoLoaded={handleVideoLoaded} 
              activeProjectId={activeVideo ? activeVideo.projectId : 'proj-alpha'} 
            />
            
            <hr className="border-t border-outline-variant w-full max-w-3xl mx-auto opacity-50" />
            
            {/* Área de Espacio de Reproducción y Opiniones */}
            {activeVideo ? (
              <section id="playback-workspace-section" className="w-full max-w-3xl mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <FileVideo className="w-5 h-5 text-primary" />
                    Vista Previa del Video Reciente
                  </h2>
                  <span className="bg-[#e0e3e8] text-[#43474c] font-bold text-xs py-1 px-3 rounded border border-slate-350 select-none">
                    Formato {activeVideo.format}
                  </span>
                </div>

                {/* Reproductor de Video Montado */}
                <VideoPlayer
                  video={activeVideo}
                  onTimeUpdate={setCurrentPlaybackTime}
                  jumpToTimeTrigger={jumpToTimeTrigger}
                  onClearJumpTime={handleClearJumpTime}
                  onCommentHover={handleCommentHover}
                  onDeleteVideo={handleDeleteVideo}
                />

                {/* Sección de Comentarios y Formulario */}
                <CommentSection
                  comments={activeVideo.comments || []}
                  currentPlaybackTime={currentPlaybackTime}
                  onAddComment={handleAddComment}
                  onCommentClick={handleCommentClick}
                  activeHoverComment={activeHoverComment}
                  maxDuration={activeVideo.duration}
                />
              </section>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-semibold text-slate-500">No hay archivos en el espacio de trabajo del reproductor.</p>
                <p className="text-xs text-slate-400 mt-1">¡Suba un video o seleccione uno desde la Biblioteca para comenzar!</p>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: Vista de Galería de Biblioteca */}
        {activeTab === 'library' && (
          <LibraryTab
            videos={videos}
            projects={projects}
            activeVideoId={activeVideoId}
            onSelectVideo={(id) => {
              setActiveVideoId(id);
              setActiveTab('recent'); // Ir al Espacio de Trabajo al hacer clic
            }}
            onDeleteVideo={handleDeleteVideo}
            onUpdateVideo={handleUpdateVideo}
            searchQuery={searchQuery}
          />
        )}

        {/* VISTA 3: Vista de Proyectos Organizados en Carpetas */}
        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            videos={videos}
            onAddProject={handleAddProject}
            onSelectProjectFilter={handleSelectProjectFilter}
            onAddVideoToProject={handleAddVideoToProject}
          />
        )}

      </main>

      {/* 3. Pie de página Global */}
      <footer className="bg-white w-full py-8 border-t border-slate-200/65 mt-auto flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-4 text-slate-400 font-sans">
          
          <div className="flex items-center gap-2 select-none">
            <span className="bg-primary text-white p-1 rounded">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 16H5V8h9v8z"/>
              </svg>
            </span>
            <span className="font-bold text-slate-800 text-sm tracking-tight">Video<span className="text-primary">USM</span></span>
          </div>

          <div className="flex gap-6 font-semibold text-xs text-slate-400">
            <a className="text-[#43474c] hover:underline hover:text-primary transition-all duration-200 flex items-center gap-1" href="#privacy">
              <Shield className="w-3.5 h-3.5" /> Política de Privacidad
            </a>
            <a className="text-[#43474c] hover:underline hover:text-primary transition-all duration-200 flex items-center gap-1" href="#terms">
              <FileText className="w-3.5 h-3.5" /> Términos del Servicio
            </a>
            <a className="text-[#43474c] hover:underline hover:text-primary transition-all duration-200 flex items-center gap-1" href="#help">
              <HelpCircle className="w-3.5 h-3.5" /> Centro de Ayuda
            </a>
          </div>

          <div className="text-xs text-slate-400">
            &copy; 2026 VideoUSM. Creado para creadores.
          </div>
        </div>
      </footer>
    </div>
  );
}
