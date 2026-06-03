import React, { useState } from 'react';
import { FolderPlus, Calendar, Film, ArrowRight, Tag, Plus, Check, Loader2 } from 'lucide-react';
import { Project, VideoAsset } from '../types';

interface ProjectsTabProps {
  projects: Project[];
  videos: VideoAsset[];
  onAddProject: (name: string, description: string, category: string, initialVideo?: VideoAsset) => void;
  onSelectProjectFilter: (projectId: string) => void;
  onAddVideoToProject: (projectId: string, video: VideoAsset) => void;
}

export default function ProjectsTab({ 
  projects, 
  videos, 
  onAddProject, 
  onSelectProjectFilter,
  onAddVideoToProject
}: ProjectsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCat, setProjectCat] = useState('Marketing');
  
  // Estados para cargar archivos en proyectos NUEVOS
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsingVideo, setParsingVideo] = useState(false);

  // Estados para cargar archivos en proyectos EXISTENTES
  const [parsingProjectId, setParsingProjectId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    if (selectedFile) {
      setParsingVideo(true);
      const file = selectedFile;
      const objectUrl = URL.createObjectURL(file);
      
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = objectUrl;

      const finishAndSave = (duration: number, resolution: string) => {
        const newAsset: VideoAsset = {
          id: 'uploaded-' + Date.now(),
          name: file.name,
          url: objectUrl,
          thumbnailUrl: 'https://images.unsplash.com/photo-1542204172-e7052809a862?q=80&w=600&auto=format&fit=crop',
          format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
          resolution: resolution,
          fps: '30fps',
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          duration: duration,
          uploadedAt: new Date().toISOString().split('T')[0],
          projectId: '', // Se asigna en el callback superior
          description: `Video inicial cargado al crear proyecto: "${file.name}".`,
          comments: []
        };
        
        onAddProject(projectName, projectDesc, projectCat, newAsset);
        setParsingVideo(false);
        resetForm();
      };

      tempVideo.onloadedmetadata = () => {
        const duration = Math.round(tempVideo.duration) || 30;
        const resolution = tempVideo.videoWidth ? `${tempVideo.videoWidth >= 3840 ? '4K' : tempVideo.videoHeight >= 1080 ? '1080p' : '720p'}` : '1080p';
        finishAndSave(duration, resolution);
      };

      tempVideo.onerror = () => {
        finishAndSave(30, '1080p');
      };
    } else {
      onAddProject(projectName, projectDesc, projectCat);
      resetForm();
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectDesc('');
    setProjectCat('Marketing');
    setSelectedFile(null);
    setShowForm(false);
  };

  const handleAddVideoToExistingProject = (projId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setParsingProjectId(projId);
      const objectUrl = URL.createObjectURL(file);
      
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = objectUrl;

      const finishAndSave = (duration: number, resolution: string) => {
        const newAsset: VideoAsset = {
          id: 'uploaded-' + Date.now(),
          name: file.name,
          url: objectUrl,
          thumbnailUrl: 'https://images.unsplash.com/photo-1542204172-e7052809a862?q=80&w=600&auto=format&fit=crop',
          format: file.type.split('/')[1]?.toUpperCase() || 'MP4',
          resolution: resolution,
          fps: '30fps',
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          duration: duration,
          uploadedAt: new Date().toISOString().split('T')[0],
          projectId: projId,
          description: `Clip cargado localmente al espacio de trabajo.`,
          comments: []
        };
        onAddVideoToProject(projId, newAsset);
        setParsingProjectId(null);
      };

      tempVideo.onloadedmetadata = () => {
        const duration = Math.round(tempVideo.duration) || 30;
        const resolution = tempVideo.videoWidth ? `${tempVideo.videoWidth >= 3840 ? '4K' : tempVideo.videoHeight >= 1080 ? '1080p' : '720p'}` : '1080p';
        finishAndSave(duration, resolution);
      };

      tempVideo.onerror = () => {
        finishAndSave(30, '1080p');
      };
    }
  };

  const getVideosInProjectCount = (projId: string) => {
    return videos.filter(v => v.projectId === projId || (projId === 'proj-alpha' && v.id.startsWith('uploaded'))).length;
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-left">
      
      {/* Sección del encabezado superior */}
      <div className="flex justify-between items-center bg-white border border-slate-200/50 p-4 rounded-xl shadow-2xs">
        <div>
          <h2 className="font-sans font-bold text-slate-800 text-sm">
            Campañas de Revisión y Proyectos
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Agrupe sus videos por cliente comercial, campaña de marketing o canal de transmisión.
          </p>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" /> Crear Proyecto
          </button>
        )}
      </div>

      {/* Grid de Proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Formulario en tarjeta para la creación de un nuevo proyecto */}
        {showForm && (
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="bg-primary/10 text-primary p-1.5 rounded">
                  <FolderPlus className="w-4 h-4" />
                </span>
                <span className="text-xs font-extrabold text-slate-800">Creador de Nueva Campaña</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Nombre del Proyecto</span>
                <input
                  type="text"
                  required
                  placeholder="Ej. Reel Comercial de Verano 2026"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Categoría Objetivo</span>
                <select
                  value={projectCat}
                  onChange={(e) => setProjectCat(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="Marketing">Campaña de Marketing</option>
                  <option value="Identity">Alineación de Marca y Diseño</option>
                  <option value="Acquisition">B-Roll de Adquisición</option>
                  <option value="Training">Educación Interna</option>
                  <option value="Client Review">Revisiones de Clientes</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Descripción Breve / Objetivo</span>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Resuma los parámetros para la revisión del proyecto..."
                  rows={2}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Cargar Archivo de Video (Opcional)</span>
                <label className="w-full bg-slate-50 text-slate-600 text-xs border border-slate-200 rounded-lg py-2 px-3 block cursor-pointer hover:border-primary transition-all text-center border-dashed font-bold">
                  {selectedFile ? `✓ ${selectedFile.name}` : 'Seleccionar video...'}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100/60">
              <button
                type="button"
                disabled={parsingVideo}
                onClick={resetForm}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={parsingVideo}
                className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {parsingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Guardar Proyecto
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Renderizado de Proyectos Existentes */}
        {projects.length === 0 && !showForm ? (
          <div className="col-span-full w-full text-center py-16 bg-white border border-slate-200/50 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xs">
            <span className="p-4 bg-slate-50 border border-slate-100 rounded-full mb-3 text-slate-400">
              <FolderPlus className="w-10 h-10 text-primary" />
            </span>
            <h3 className="text-base font-bold text-slate-800">No se encontraron proyectos activos</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No tiene carpetas de revisión configuradas. ¡Cree su primer proyecto para comenzar a organizar sus videos!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5 select-none"
            >
              <Plus className="w-4 h-4" /> Crear Primer Proyecto
            </button>
          </div>
        ) : (
          projects.map((proj) => {
            const vCount = getVideosInProjectCount(proj.id);
            const isParsingThis = parsingProjectId === proj.id;
            
            return (
              <div
                key={proj.id}
                className="bg-white border border-slate-200/75 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-300 animate-fade-in"
              >
                <div>
                  {/* Categoría superior */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="bg-primary/5 text-primary border border-primary/15 font-bold text-[10px] uppercase py-0.5 px-2.5 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {proj.category}
                    </span>
                    
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" /> {proj.createdAt}
                    </span>
                  </div>

                  {/* Nombre */}
                  <h3 className="font-sans font-bold text-slate-800 text-base mb-1.5 leading-snug">
                    {proj.name}
                  </h3>

                  {/* Descripción */}
                  <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed">
                    {proj.description || 'Sin descripción proporcionada para este proyecto.'}
                  </p>
                </div>

                {/* Subir archivo directamente a este proyecto */}
                <div className="pt-2 pb-3 mb-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold text-[11px]">Cargar video:</span>
                  {isParsingThis ? (
                    <span className="text-primary font-bold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando archivo...
                    </span>
                  ) : (
                    <label className="text-primary hover:text-primary-hover font-extrabold flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/50 py-1 px-2.5 rounded-md transition-all active:scale-95 select-none text-[11px]">
                      <Plus className="w-3 h-3" /> Agregar Video
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleAddVideoToExistingProject(proj.id, e)}
                      />
                    </label>
                  )}
                </div>

                {/* Contador inferior y gatillo de filtro */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-150 text-xs font-bold mt-auto">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Film className="w-4 h-4 text-slate-400" />
                    {vCount} {vCount === 1 ? 'video' : 'videos'}
                  </span>

                  <button
                    onClick={() => onSelectProjectFilter(proj.id)}
                    className="text-primary hover:text-primary-hover hover:underline flex items-center gap-1 transition-all cursor-pointer group"
                  >
                    Ver Archivos <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
