import { useState } from 'react';
import { Play, Search, Filter, Trash2, Edit, Tag, MessageCircle } from 'lucide-react';
import { VideoAsset, Project } from '../types';

interface LibraryTabProps {
  videos: VideoAsset[];
  projects: Project[];
  activeVideoId: string;
  onSelectVideo: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onUpdateVideo: (updatedVideo: VideoAsset) => void;
  searchQuery: string;
}

export default function LibraryTab({ 
  videos, 
  projects, 
  activeVideoId, 
  onSelectVideo, 
  onDeleteVideo,
  onUpdateVideo,
  searchQuery
}: LibraryTabProps) {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedResolutionFilter, setSelectedResolutionFilter] = useState<string>('all');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Estados de edición local
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRes, setEditRes] = useState('1080p');
  const [editFps, setEditFps] = useState('24fps');

  // Filtrado y cálculo de búsqueda
  const filteredVideos = videos.filter((video) => {
    // Coincidencia de búsqueda
    const matchesSearch = 
      video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Coincidencia de filtro por proyecto
    const matchesProject = 
      selectedProjectFilter === 'all' || 
      video.projectId === selectedProjectFilter;

    // Coincidencia de filtro por resolución
    const matchesResolution = 
      selectedResolutionFilter === 'all' || 
      video.resolution === selectedResolutionFilter;

    return matchesSearch && matchesProject && matchesResolution;
  });

  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : 'Sin asignar';
  };

  const handleStartEdit = (video: VideoAsset) => {
    setEditingVideoId(video.id);
    setEditName(video.name);
    setEditDesc(video.description);
    setEditRes(video.resolution);
    setEditFps(video.fps);
  };

  const handleSaveEdit = (video: VideoAsset) => {
    onUpdateVideo({
      ...video,
      name: editName,
      description: editDesc,
      resolution: editRes,
      fps: editFps
    });
    setEditingVideoId(null);
  };

  // Convertir duración en segundos a MM:SS
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.round(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-left">
      {/* Centro de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200/50 p-4 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Opción de filtrado de Proyecto */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Proyecto:</span>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent py-0 px-1 border-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Todos los proyectos</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          {/* Opción de filtrado por Resolución */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Calidad:</span>
            <select
              value={selectedResolutionFilter}
              onChange={(e) => setSelectedResolutionFilter(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent py-0 px-1 border-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Todas las resoluciones</option>
              <option value="4K">4K UHD</option>
              <option value="1080p">1080p FHD</option>
              <option value="720p">720p HD</option>
            </select>
          </div>
        </div>

        {/* Contador de estadísticas */}
        <div className="text-xs font-bold text-slate-400 self-end md:self-auto">
          Mostrando <span className="text-slate-700">{filteredVideos.length}</span> de <span className="text-slate-700">{videos.length}</span> recursos
        </div>
      </div>

      {/* Grid de elementos de video */}
      {filteredVideos.length === 0 ? (
        <div className="w-full text-center py-20 bg-white border border-slate-200/50 rounded-2xl flex flex-col items-center justify-center shadow-xs">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No se encontraron videos</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
            Intente ajustar su búsqueda o cambie los criterios de selección de proyectos para encontrar los videos deseados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const isEditing = editingVideoId === video.id;
            const isActive = activeVideoId === video.id;

            return (
              <div
                key={video.id}
                className={`group bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                  isActive 
                    ? 'border-primary shadow-md ring-4 ring-primary/5 scale-[1.01]' 
                    : 'border-slate-200/70 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                
                {/* Panel de edición / formularios de detalles cuando se solicita */}
                {isEditing ? (
                  <div className="p-4 flex flex-col gap-3 h-full justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1">
                        <span className="text-xs font-bold text-slate-700">Editar Metadatos</span>
                        <span className="text-[10px] text-slate-400">formato {video.format}</span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Nombre del archivo:</span>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:border-primary font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Descripción de revisión:</span>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-50 text-slate-800 text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Calidad:</span>
                          <select
                            value={editRes}
                            onChange={(e) => setEditRes(e.target.value)}
                            className="w-full bg-slate-50 text-slate-700 text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="4K">4K UHD</option>
                            <option value="1080p">1080p FHD</option>
                            <option value="720p">720p HD</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Fotogramas:</span>
                          <select
                            value={editFps}
                            onChange={(e) => setEditFps(e.target.value)}
                            className="w-full bg-slate-50 text-slate-700 text-xs px-2.5 py-1 rounded border border-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="60fps">60 fps</option>
                            <option value="30fps">30 fps</option>
                            <option value="24fps">24 fps</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setEditingVideoId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(video)}
                        className="flex-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Diseño estándar de recurso de video */}
                    <div>
                      {/* Portada / Miniatura */}
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                        <img 
                          src={video.thumbnailUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 duration-500 ease-out"
                        />
                        {/* Tiempo de duración superpuesto */}
                        <span className="absolute bottom-2.5 right-2.5 font-mono text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white py-0.5 px-2 rounded">
                          {formatDuration(video.duration)}
                        </span>
                        
                        {/* Etiqueta de activo */}
                        {isActive && (
                          <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase bg-primary text-white py-0.5 px-2 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Activo
                          </span>
                        )}

                        {/* Botón de reproducción en hover */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                          <button
                            onClick={() => onSelectVideo(video.id)}
                            className="bg-white hover:bg-primary hover:text-white text-slate-800 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300 ease-out"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Reproducir en Espacio
                          </button>
                        </div>
                      </div>

                      {/* Metadatos de información */}
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="font-sans font-bold text-slate-800 text-sm line-clamp-1 flex-1" title={video.name}>
                            {video.name}
                          </h4>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase border border-slate-200 bg-slate-50 px-1.5 rounded">
                            {video.format}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed mb-3">
                          {video.description || 'Sin descripción proporcionada.'}
                        </p>

                        <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-100/50">
                          <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded">
                            {getProjectName(video.projectId)}
                          </span>
                          <span>Subido el: {video.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operaciones de pie de tarjeta */}
                    <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <div className="flex items-center gap-3">
                        {/* Estadísticas de comentarios */}
                        <span className="flex items-center gap-1 text-slate-400 bg-white border border-slate-200/50 px-2 py-0.5 rounded-md text-[10px]" title="Comentarios en línea de tiempo">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {video.comments?.length || 0}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{video.resolution}</span>
                        <span className="font-mono text-[10px] text-slate-400">{video.fps}</span>
                      </div>

                      {confirmDeleteId === video.id ? (
                        <div className="flex items-center gap-1.5 animate-fade-in bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <span className="text-[10px] font-extrabold text-rose-700">¿Eliminar?</span>
                          <button
                            onClick={() => {
                              onDeleteVideo(video.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded transition-all cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(video)}
                            className="hover:bg-slate-200 hover:text-slate-800 p-1.5 rounded transition-colors cursor-pointer"
                            title="Editar información"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(video.id)}
                            className="hover:bg-red-50 hover:text-red-600 p-1.5 rounded transition-colors cursor-pointer"
                            title="Eliminar video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
