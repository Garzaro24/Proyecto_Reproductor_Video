import React from 'react';
import { Library, Clock, FolderKanban } from 'lucide-react';

interface HeaderProps {
  activeTab: 'library' | 'recent' | 'projects';
  setActiveTab: (tab: 'library' | 'recent' | 'projects') => void;
  onSearch: (query: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="bg-white border-b border-outline-variant w-full h-16 flex-shrink-0 sticky top-0 z-50 shadow-xs">
      <div className="flex justify-between items-center px-4 md:px-8 max-w-7xl mx-auto h-full">
        {/* Logo de la Marca */}
        <div 
          onClick={() => setActiveTab('recent')} 
          className="font-sans text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 16H5V8h9v8z"/>
            </svg>
          </span>
          <span className="tracking-tight text-slate-800">Video<span className="text-primary font-extrabold">USM</span></span>
        </div>

        {/* Enlaces de Navegación de Escritorio */}
        <nav className="hidden md:flex gap-8 items-center h-full">
          <button
            onClick={() => setActiveTab('library')}
            id="nav-tab-library"
            className={`font-sans font-semibold text-sm flex items-center gap-2 transition-all duration-200 h-full border-b-2 px-1 ${
              activeTab === 'library'
                ? 'border-primary text-primary pt-1'
                : 'border-transparent text-on-surface-variant hover:text-primary pt-1'
            }`}
          >
            <Library className="w-4 h-4" />
            Biblioteca
          </button>
          
          <button
            onClick={() => setActiveTab('recent')}
            id="nav-tab-recent"
            className={`font-sans font-semibold text-sm flex items-center gap-2 transition-all duration-200 h-full border-b-2 px-1 ${
              activeTab === 'recent'
                ? 'border-primary text-primary pt-1'
                : 'border-transparent text-on-surface-variant hover:text-primary pt-1'
            }`}
          >
            <Clock className="w-4 h-4" />
            Espacio de Trabajo
          </button>
          
          <button
            onClick={() => setActiveTab('projects')}
            id="nav-tab-projects"
            className={`font-sans font-semibold text-sm flex items-center gap-2 transition-all duration-200 h-full border-b-2 px-1 ${
              activeTab === 'projects'
                ? 'border-primary text-primary pt-1'
                : 'border-transparent text-on-surface-variant hover:text-primary pt-1'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Proyectos
          </button>
        </nav>
      </div>
    </header>
  );
}
