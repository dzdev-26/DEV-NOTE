import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Search, Menu, FileText, Settings, Info, X, Trash2, Folder, Download, Upload, RotateCcw, Edit2, LayoutList, AlignJustify, Grid3x3, Grid2x2, LayoutGrid, Rows, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { Note, AppSettings } from '../types';
import { SettingsModal } from './SettingsModal';

interface ListViewProps {
  notes: Note[];
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onMoveToTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onImport: (notes: Note[]) => void;
  runWithLoader: (callback: () => void, message?: string) => void;
}

interface NoteCardProps {
  note: Note;
  activeView: string;
  viewMode: string;
  onSelect: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onMoveToTrash: (id: string) => void;
}

const NoteCard = React.memo(({ note, activeView, viewMode, onSelect, onRestore, onPermanentDelete, onMoveToTrash }: NoteCardProps) => {
  const d = new Date(note.updatedAt);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  
  const getAutoTitle = (n: Note) => {
    if (n.title.trim()) return n.title.trim();
    if (!n.content.trim()) return 'Untitled Note';
    const firstLine = n.content.split('\n')[0].replace(/^#+\s*/, '').trim();
    return firstLine || 'Untitled Note';
  };

  const getSnippet = (n: Note) => {
    const text = n.content.replace(/^#+\s*/g, '').trim();
    if (!text) return '';
    return text;
  };

  const displayTitle = getAutoTitle(note);
  const snippet = getSnippet(note);
  const isGrid = viewMode === 'grid' || viewMode === 'large-grid';

  return (
    <div className={`w-full flex ${isGrid ? 'flex-col rounded-xl overflow-hidden' : 'items-stretch'} text-left bg-md-surface-variant ${isGrid ? 'border' : 'border-b min-h-[60px]'} border-black/5 hover:bg-[rgba(0,0,0,0.02)] transition-colors relative group/card`}>
      <button
        onClick={() => onSelect(note.id)}
        className={`flex-1 flex flex-col justify-start text-left min-w-0 ${isGrid ? 'p-3 pt-4' : 'py-2.5 px-4'} ${!isGrid && 'border-l-[6px] border-l-md-primary'}`}
      >
        <div className="flex flex-col min-w-0 w-full">
          <h3 className={`text-md-on-surface font-semibold truncate leading-tight ${viewMode === 'list' ? 'text-[14px]' : 'text-[15px] mb-1'}`}>
            {displayTitle}
          </h3>
          {(viewMode === 'details' || isGrid) && snippet && (
            <p className={`text-[13px] text-md-on-surface-variant opacity-80 leading-snug mb-2 ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-4'} break-words whitespace-pre-wrap`}>
              {snippet}
            </p>
          )}
        </div>
        <div className={`flex flex-wrap gap-2 items-center mt-auto ${isGrid ? 'pt-2' : 'mt-1'}`}>
          <span className="text-[11px] text-md-on-surface-variant font-bold opacity-60 uppercase tracking-tighter">
            {dateStr}
          </span>
          {note.category && (
            <span className="text-[10px] px-1.5 py-0.5 bg-md-primary/10 text-md-on-surface font-black rounded uppercase mix-blend-multiply">
              {note.category}
            </span>
          )}
          {note.isChecklist && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 rounded uppercase font-bold">List</span>}
        </div>
      </button>
      
      {activeView === 'trash' ? (
        <div className={`flex items-center ${isGrid ? 'absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 bg-md-surface-variant/90 backdrop-blur-sm rounded-full p-1 shadow-sm' : 'border-l border-black/5 px-2'}`}>
          <button 
            onClick={() => onRestore(note.id)}
            className="p-2.5 text-emerald-700 hover:bg-emerald-50 rounded-full"
            title="Restore"
          >
            <RotateCcw className={`w-${isGrid ? '4' : '5'} h-${isGrid ? '4' : '5'}`} />
          </button>
          <button 
            onClick={() => onPermanentDelete(note.id)}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-full"
            title="Delete Permanently"
          >
            <Trash2 className={`w-${isGrid ? '4' : '5'} h-${isGrid ? '4' : '5'}`} />
          </button>
        </div>
      ) : (
        <div className={`flex items-center ${isGrid ? 'absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 bg-md-surface-variant/90 backdrop-blur-sm rounded-full p-1 shadow-sm' : 'border-l border-black/5 px-2'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onMoveToTrash(note.id);
            }}
            className="p-2.5 text-md-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Move to Trash"
          >
            <Trash2 className={`w-${isGrid ? '4' : '5'} h-${isGrid ? '4' : '5'}`} />
          </button>
        </div>
      )}
    </div>
  );
});

export function ListView({ 
  notes, 
  settings, 
  onUpdateSettings, 
  onNew, 
  onSelect, 
  onMoveToTrash,
  onRestore, 
  onPermanentDelete,
  onImport,
  runWithLoader
}: ListViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'trash' | string>('all'); // 'all', 'trash', or category name
  const scrollProgressRef = useRef(0);
  const scrollHandleContainerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startProgress = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (isViewMenuOpen) {
        setIsViewMenuOpen(false);
        e.preventDefault();
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        e.preventDefault();
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        e.preventDefault();
        return;
      }
      if (isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery('');
        e.preventDefault();
        return;
      }
      if (activeView !== 'all') {
        setActiveView('all');
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('appCancelBack', handleBack);
    return () => window.removeEventListener('appCancelBack', handleBack);
  }, [isSidebarOpen, isSettingsOpen, isSearchActive, activeView]);

  const updateScrollUI = (progress: number) => {
    scrollProgressRef.current = progress;
    if (progressBarRef.current) progressBarRef.current.style.width = `${progress}%`;
    if (handleRef.current) {
      handleRef.current.style.top = `calc(${progress}% - ${(progress / 100) * 3}rem)`;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDragging.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight <= clientHeight) {
      updateScrollUI(0);
      return;
    }
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    updateScrollUI(progress);

    // Show handle while scrolling using direct DOM for performance
    if (scrollHandleContainerRef.current) {
      scrollHandleContainerRef.current.style.opacity = '1';
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (scrollHandleContainerRef.current) {
        scrollHandleContainerRef.current.style.opacity = '0';
      }
    }, 1500);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startProgress.current = scrollProgressRef.current;
    
    if (scrollHandleContainerRef.current) {
      scrollHandleContainerRef.current.style.opacity = '1';
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !listRef.current) return;
    
    const deltaY = e.clientY - startY.current;
    const scrollAreaHeight = listRef.current.clientHeight - 32;
    const deltaProgress = (deltaY / scrollAreaHeight) * 100;
    
    const newProgress = Math.max(0, Math.min(100, startProgress.current + deltaProgress));
    updateScrollUI(newProgress);
    
    const { scrollHeight, clientHeight } = listRef.current;
    listRef.current.scrollTop = (newProgress / 100) * (scrollHeight - clientHeight);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = '';
    scrollTimeout.current = setTimeout(() => {
      if (scrollHandleContainerRef.current) {
        scrollHandleContainerRef.current.style.opacity = '0';
      }
    }, 1500);
  };

  const filteredNotes = useMemo(() => {
    let list = notes;
    
    // View filter
    if (activeView === 'trash') {
      list = list.filter(n => n.isTrash);
    } else {
      list = list.filter(n => !n.isTrash);
      if (activeView !== 'all') {
        list = list.filter(n => n.category === activeView);
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [notes, activeView, searchQuery]);

  const handleExport = () => {
    runWithLoader(() => {
      const data = JSON.stringify(notes, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notepad_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'Exporting Data...');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        onImport(imported);
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (newCatName.trim() && !settings.categories.includes(newCatName.trim())) {
      runWithLoader(() => {
        onUpdateSettings({ categories: [...settings.categories, newCatName.trim()] });
        setNewCatName('');
        setIsAddingCategory(false);
      }, 'Adding Category...');
    }
  };

  const cancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCatName('');
  };

  const handleRenameCategory = (oldName: string) => {
    if (editCatName.trim() && editCatName.trim() !== oldName && !settings.categories.includes(editCatName.trim())) {
      runWithLoader(() => {
        const newCategories = settings.categories.map(cat => cat === oldName ? editCatName.trim() : cat);
        onUpdateSettings({ categories: newCategories });
        setEditingCategory(null);
        setEditCatName('');
      }, 'Renaming Category...');
    } else {
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (catName: string) => {
    runWithLoader(() => {
      onUpdateSettings({ categories: settings.categories.filter(c => c !== catName) });
      if (activeView === catName) setActiveView('all');
      setDeletingCategory(null);
    }, 'Deleting Category...');
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/60 z-40 animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <div 
        className={`absolute top-0 left-0 h-full w-[280px] bg-md-surface z-50 shadow-2xl flex flex-col transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-28 bg-md-surface-container-high p-4 flex flex-col justify-end">
          <h2 className="text-[19px] font-normal text-md-on-surface">DEV NOTE</h2>
          <p className="text-[11px] text-md-on-surface-variant mt-1">100% Offline Storage</p>
        </div>
        
        <nav className="flex-1 py-1.5 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
          <button 
            onClick={() => runWithLoader(() => { setActiveView('all'); setIsSidebarOpen(false); }, 'Loading All Notes...')}
            className={`flex items-center gap-4 px-6 py-2.5 mx-3 rounded-full transition-colors ${
              activeView === 'all' ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant hover:bg-black/5'
            }`}
          >
            <FileText className="w-[24px] h-[24px]" />
            <span className="text-[13px] font-medium tracking-[0.1px]">All Notes</span>
          </button>

          <div className="h-[1px] bg-md-outline-variant/30 my-2 mx-6" />
          
          <div className="px-6 py-2 text-xs font-semibold text-md-primary uppercase tracking-widest opacity-70">
            Categories
          </div>
          {settings.categories.map(cat => (
            <div key={cat} className="relative mx-3">
              {deletingCategory === cat ? (
                <div className="flex items-center justify-between px-6 py-2.5 bg-md-error-container text-md-on-error-container rounded-full animate-in flip-in-x duration-200">
                  <span className="text-[11px] font-bold">Delete?</span>
                  <div className="flex gap-4">
                    <button onClick={() => setDeletingCategory(null)} className="text-[11px] font-black uppercase">No</button>
                    <button onClick={() => handleDeleteCategory(cat)} className="text-[11px] font-black uppercase underline">Yes</button>
                  </div>
                </div>
              ) : editingCategory === cat ? (
                <div className="flex flex-col gap-2 px-3 py-2 bg-md-surface-container-high rounded-2xl mb-1 mt-1 shadow-inner">
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCategory(cat);
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                    className="bg-transparent border-none outline-none text-[13px] text-md-on-surface w-full"
                  />
                  <div className="flex justify-end gap-2 text-[10px] font-bold">
                    <button onClick={() => setEditingCategory(null)} className="text-md-on-surface-variant uppercase px-2 py-1">Cancel</button>
                    <button onClick={() => handleRenameCategory(cat)} className="text-md-primary uppercase px-2 py-1">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center group/cat relative">
                  <button 
                    onClick={() => runWithLoader(() => { setActiveView(cat); setIsSidebarOpen(false); }, `Loading ${cat}...`)}
                    className={`flex-1 flex items-center gap-4 px-6 py-2.5 rounded-full transition-colors ${
                      activeView === cat ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant hover:bg-black/5'
                    }`}
                  >
                    <Folder className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium truncate tracking-[0.1px] max-w-[120px]">{cat}</span>
                  </button>
                  <div className="absolute right-2 flex gap-0.5 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setEditCatName(cat); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-md-surface-container/80 shadow-sm text-md-on-surface hover:text-md-primary active:scale-90 transition-all"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingCategory(cat); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-md-surface-container/80 shadow-sm text-md-on-surface hover:text-md-error active:scale-90 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isAddingCategory ? (
            <div className="flex flex-col gap-2 mx-3 px-3 py-2 bg-md-surface-container-high rounded-2xl animate-in slide-in-from-top-2 duration-200">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') cancelAddCategory();
                }}
                placeholder="Category name"
                className="bg-transparent border-none outline-none text-[13px] text-md-on-surface placeholder:text-md-on-surface-variant/50 w-full"
              />
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={cancelAddCategory} className="text-[11px] font-bold text-md-on-surface-variant px-3 py-1.5 hover:bg-black/5 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleAddCategory} className="text-[11px] font-bold bg-white text-md-primary px-4 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all">Add</button>
              </div>
            </div>
          ) : (
            <button 
              id="tour-sidebar-new-category"
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-4 px-6 py-2.5 mx-3 rounded-full text-md-on-surface-variant hover:bg-black/5 decoration-dashed"
            >
              <Plus className="w-[20px] h-[20px] ml-0.5" />
              <span className="text-[13px] font-medium tracking-[0.1px]">New Category</span>
            </button>
          )}

          <div className="h-[1px] bg-md-outline-variant/30 my-2 mx-6" />

          <button 
            onClick={() => runWithLoader(() => { setActiveView('trash'); setIsSidebarOpen(false); }, 'Opening Recycle Bin...')}
            className={`flex items-center gap-4 px-6 py-2.5 mx-3 rounded-full transition-colors ${
              activeView === 'trash' ? 'bg-md-secondary-container text-md-on-secondary-container' : 'text-md-on-surface-variant hover:bg-black/5'
            }`}
          >
            <Trash2 className="w-[24px] h-[24px]" />
            <span className="text-[13px] font-medium tracking-[0.1px]">Recycle Bin</span>
          </button>

          <div className="h-[1px] bg-md-outline-variant/30 mt-auto my-2 mx-6" />

          <div className="px-6 py-2 flex gap-2">
            <button 
              id="tour-sidebar-export-json"
              onClick={handleExport}
              className="flex-1 flex flex-col items-center gap-1 p-2 bg-md-surface-container-high rounded-xl text-md-on-surface-variant hover:bg-md-primary-container transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold">Export JSON</span>
            </button>
            <label className="flex-1 flex flex-col items-center gap-1 p-2 bg-md-surface-container-high rounded-xl text-md-on-surface-variant hover:bg-md-primary-container transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold">Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <button 
            id="tour-sidebar-settings"
            onClick={() => runWithLoader(() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }, 'Opening Settings...')}
            className="flex items-center gap-4 px-6 py-2.5 mx-3 rounded-full text-md-on-surface-variant hover:bg-black/5"
          >
            <Settings className="w-[24px] h-[24px]" />
            <span className="text-[13px] font-medium tracking-[0.1px]">Settings</span>
          </button>
        </nav>
      </div>

      {/* Top App Bar */}
      <header className="shrink-0 bg-md-surface text-md-on-surface border-b border-md-outline-variant/10 relative pt-[env(safe-area-inset-top)]">
        <div className="h-[64px] px-1 sm:px-2 flex items-center justify-between w-full">
          {!isSearchActive ? (
            <>
              <div className="flex items-center">
                <button 
                  id="tour-hamburger"
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-md-on-surface/5 active:bg-md-on-surface/10 transition-colors shrink-0"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-[18px] sm:text-[20px] font-normal leading-normal tracking-normal ml-1.5 flex items-center text-md-on-surface">
                  {activeView === 'all' ? 'All Notes' : activeView === 'trash' ? 'Trash' : activeView}
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  id="tour-search"
                  onClick={() => setIsSearchActive(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-md-on-surface/5 active:bg-md-on-surface/10 transition-colors shrink-0"
                  title="Search"
                >
                  <Search className="w-6 h-6" />
                </button>
                <div className="relative flex items-center">
                  <button 
                    id="tour-view-mode"
                    onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-md-on-surface/5 active:bg-md-on-surface/10 transition-colors shrink-0 mr-1"
                    title="View Options"
                  >
                    <LayoutDashboard className="w-[23px] h-[23px]" strokeWidth={2.2} />
                  </button>

                  {isViewMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsViewMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-12 mt-1 w-48 bg-md-surface-container shadow-lg rounded-xl overflow-hidden z-[70] py-2 border border-black/5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-2 text-sm font-semibold text-md-on-surface-variant mb-1">
                          View
                        </div>
                        <button
                          onClick={() => { onUpdateSettings({ viewMode: 'list' }); setIsViewMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors"
                        >
                          <AlignJustify className="w-5 h-5 opacity-70" />
                          <span className="text-[15px]">List</span>
                        </button>
                        <button
                          onClick={() => { onUpdateSettings({ viewMode: 'details' }); setIsViewMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors"
                        >
                          <Rows className="w-5 h-5 opacity-70" />
                          <span className="text-[15px]">Details</span>
                        </button>
                        <button
                          onClick={() => { onUpdateSettings({ viewMode: 'grid' }); setIsViewMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors"
                        >
                          <Grid3x3 className="w-5 h-5 opacity-70" />
                          <span className="text-[15px]">Grid</span>
                        </button>
                        <button
                          onClick={() => { onUpdateSettings({ viewMode: 'large-grid' }); setIsViewMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors"
                        >
                          <Grid2x2 className="w-5 h-5 opacity-70" />
                          <span className="text-[15px]">Large grid</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center px-1 animate-in slide-in-from-right-4">
              <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5 shrink-0 ml-1">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <input 
                autoFocus
                placeholder="Search through offline notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-3 text-[18px] sm:text-[20px] font-normal text-md-on-surface placeholder:text-md-on-surface-variant/50 w-full flex items-center"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/5 shrink-0 mr-1 opacity-70"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 relative overflow-hidden group/list">
        <main 
          ref={listRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar scroll-smooth relative"
        >
          {/* Scroll Progress Bar (Top) */}
          <div className="sticky top-0 left-0 w-full h-[3px] z-[40] bg-md-primary/5">
            <div 
              ref={progressBarRef}
              className="h-full bg-md-primary transition-all duration-100 ease-out shadow-[0_0_12px_rgba(var(--color-md-primary),0.6)]" 
              style={{ width: '0%' }} 
            />
          </div>

          {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-on-surface-variant opacity-60 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-md-surface-container rounded-full flex items-center justify-center mb-4">
              {activeView === 'trash' ? <Trash2 size={40} /> : <FileText size={40} />}
            </div>
            <p className="text-[16px] font-medium">
              {searchQuery ? 'No results found' : activeView === 'trash' ? 'Trash is empty' : 'Empty folder'}
            </p>
            <p className="text-sm mt-1">{searchQuery ? 'Try different keywords' : 'Your offline notes will appear here'}</p>
          </div>
        ) : (
          <div className={`pb-24 ${
            settings.viewMode === 'grid' ? 'grid grid-cols-2 gap-2 p-2' : 
            settings.viewMode === 'large-grid' ? 'grid grid-cols-1 gap-3 p-3' : 
            'flex flex-col'
          }`}>
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                activeView={activeView}
                viewMode={settings.viewMode || 'details'}
                onSelect={onSelect}
                onRestore={onRestore}
                onPermanentDelete={onPermanentDelete}
                onMoveToTrash={onMoveToTrash}
              />
            ))}
          </div>
        )}
      </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        id="tour-fab-new"
        onClick={onNew}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-md-primary-container text-md-on-primary-container shadow-md hover:shadow-lg active:shadow-sm transition-all flex items-center justify-center active:scale-95 z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          onClose={() => setIsSettingsOpen(false)} 
          onUpdate={onUpdateSettings} 
        />
      )}
    </div>
  );
}
