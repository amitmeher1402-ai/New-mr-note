import React, { useState } from 'react';
import { 
  Search, MoreVertical, BookOpen, Cloud, Pin, Plus, 
  CheckSquare, FileText, ChevronDown, ChevronUp, Trash2, 
  RefreshCw, Grid, List, Check, Archive, AlertTriangle, X 
} from 'lucide-react';
import { Note, NotebookType } from '../types';

interface NoteHomeProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onHardDeleteNote: (id: string) => void;
  onSyncNotes: () => void;
  isSynced: boolean;
  onEmptyTrash: () => void;
  onRestorePurgedNote: (note: Note) => void;
  // Navigation tab
  activeTab: 'notes' | 'todos';
  setActiveTab: (tab: 'notes' | 'todos') => void;
}

export default function NoteHome({
  notes,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onTogglePin,
  onRestoreNote,
  onHardDeleteNote,
  onSyncNotes,
  isSynced,
  onEmptyTrash,
  onRestorePurgedNote,
  activeTab,
  setActiveTab,
}: NoteHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('All notes');
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isNotebookPopupOpen, setIsNotebookPopupOpen] = useState(false);
  const [customNotebooks, setCustomNotebooks] = useState<string[]>(['Default notebook', 'Travel', 'Ideas', 'Personal']);
  const [newNotebookName, setNewNotebookName] = useState('');

  // Sections collapse states
  const [pinCollapsed, setPinCollapsed] = useState(false);
  const [otherCollapsed, setOtherCollapsed] = useState(false);

  // Secret settings states for permanently deleted notes
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretNotes, setSecretNotes] = useState<Note[]>([]);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSearchPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        try { navigator.vibrate(120); } catch {}
      }
      const savedPurged = localStorage.getItem('purged_notes_data');
      let currentPurged: Note[] = [];
      if (savedPurged) {
        try { currentPurged = JSON.parse(savedPurged); } catch {}
      }
      setSecretNotes(currentPurged);
      setShowSecretModal(true);
      longPressTimerRef.current = null;
    }, 1000); // 1 second is perfect
  };

  const handleSearchPressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      setIsSearchActive(true);
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSearchPressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleRestoreSecretNote = (note: Note) => {
    onRestorePurgedNote(note);
    const updated = secretNotes.filter(n => n.id !== note.id);
    setSecretNotes(updated);
    localStorage.setItem('purged_notes_data', JSON.stringify(updated));
    if (previewNote?.id === note.id) {
      setPreviewNote(null);
    }
  };

  const handleWipeSecretNote = (id: string) => {
    const updated = secretNotes.filter(n => n.id !== id);
    setSecretNotes(updated);
    localStorage.setItem('purged_notes_data', JSON.stringify(updated));
    if (previewNote?.id === id) {
      setPreviewNote(null);
    }
  };

  const handleWipeAllSecretNotes = () => {
    setSecretNotes([]);
    localStorage.removeItem('purged_notes_data');
    setPreviewNote(null);
  };

  // Filter notes based on category chip and search query
  const filteredNotes = notes.filter((note) => {
    // Search filter
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.blocks.some(block => block.content?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Notebook filter
    if (selectedNotebook === 'All notes') {
      return !note.isDeleted && matchesSearch;
    } else if (selectedNotebook === 'Recently deleted') {
      return note.isDeleted && matchesSearch;
    } else {
      return !note.isDeleted && note.notebook === selectedNotebook && matchesSearch;
    }
  });

  const pinnedNotes = filteredNotes.filter((note) => note.isPinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.isPinned);

  // Extract all checklist items for the To-dos tab
  const allTodoItems = notes
    .filter(note => !note.isDeleted)
    .flatMap(note => 
      note.blocks
        .filter(block => block.type === 'todo')
        .map(block => ({
          noteId: note.id,
          noteTitle: note.title,
          blockId: block.id,
          content: block.content,
          checked: !!block.checked
        }))
    );

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncNotes();
      setIsSyncing(false);
      setShowSyncBanner(false);
    }, 1500);
  };

  const addCustomNotebook = () => {
    if (newNotebookName.trim() && !customNotebooks.includes(newNotebookName.trim())) {
      setCustomNotebooks([...customNotebooks, newNotebookName.trim()]);
      setNewNotebookName('');
    }
  };

  const getNoteSnippet = (note: Note) => {
    const textBlocks = note.blocks.filter(b => b.type === 'paragraph' || b.type === 'todo');
    if (textBlocks.length > 0) {
      const text = textBlocks[0].content;
      return text.length > 42 ? text.slice(0, 42) + '...' : text;
    }
    return 'No content yet';
  };

  const getNoteThumbnail = (note: Note) => {
    const imageBlock = note.blocks.find(b => b.type === 'images' && b.imageUrls && b.imageUrls.length > 0);
    if (imageBlock && imageBlock.imageUrls) {
      return imageBlock.imageUrls[0];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans select-none pb-24">
      {/* Top Header */}
      <header className="px-6 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-40">
        {!isSearchActive ? (
          <>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight font-sans text-zinc-100 flex items-center gap-1">
                Notes
              </h1>
              {selectedNotebook !== 'Recently deleted' && (
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  {`${notes.filter(n => !n.isDeleted).length} notes`}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onMouseDown={handleSearchPressStart}
                onMouseUp={handleSearchPressEnd}
                onMouseLeave={handleSearchPressCancel}
                onTouchStart={handleSearchPressStart}
                onTouchEnd={handleSearchPressEnd}
                onTouchCancel={handleSearchPressCancel}
                onClick={(e) => e.preventDefault()}
                className="p-2.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer touch-none select-none relative"
                id="search_button"
                title="Hold to open Secret Trash"
              >
                <Search size={22} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
                  id="options_button"
                >
                  <MoreVertical size={22} />
                </button>
                {showOptionsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#18181b] border border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900/80 hover:text-zinc-100 transition-colors text-left"
                    >
                      {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                      <span>Show as {viewMode === 'grid' ? 'List' : 'Grid'}</span>
                    </button>
                    {selectedNotebook === 'Recently deleted' && filteredNotes.length > 0 && (
                      <button
                        onClick={() => {
                          onEmptyTrash();
                          setShowOptionsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors text-left border-t border-zinc-800/60"
                      >
                        <Trash2 size={16} />
                        <span>Empty Trash Bin</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 animate-in slide-in-from-top-3 duration-200">
            <Search size={18} className="text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search in titles & content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none flex-1"
              autoFocus
            />
            <button 
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Main Tabs Container */}
      {activeTab === 'notes' ? (
        <div className="px-6 flex-1">
          {/* Categories / Notebook Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none snap-x mb-4 -mx-6 px-6">
            {/* Book Icon/Notebook Selector trigger */}
            <button 
              onClick={() => setIsNotebookPopupOpen(true)}
              className={`p-3 rounded-2xl flex-shrink-0 transition-all duration-150 flex items-center justify-center border ${
                selectedNotebook !== 'All notes' && selectedNotebook !== 'Recently deleted'
                  ? 'bg-amber-400 border-amber-500 text-zinc-950'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              } active:scale-95`}
              title="Notebook Folders"
            >
              <BookOpen size={18} />
            </button>

            {/* Default categories */}
            {['All notes', 'Default notebook', ...customNotebooks.filter(n => n !== 'Default notebook'), 'Recently deleted'].map((notebook) => {
              const isActive = selectedNotebook === notebook;
              return (
                <button
                  key={notebook}
                  onClick={() => setSelectedNotebook(notebook)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide snap-start flex-shrink-0 transition-all duration-150 border ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 border-white'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {notebook}
                </button>
              );
            })}
          </div>

          {/* Sync Cloud Banner */}
          {showSyncBanner && selectedNotebook !== 'Recently deleted' && (
            <div className="bg-[#18181b] border border-zinc-800/80 rounded-2xl p-4 mb-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-3">
                <div className="p-2.5 rounded-full bg-zinc-900 text-amber-400 h-fit border border-zinc-800 flex-shrink-0">
                  <Cloud size={20} className={isSyncing ? "animate-bounce" : ""} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium leading-relaxed text-zinc-300 max-w-[85%]">
                    {isSynced 
                      ? "Cloud Backup is active. Your notes are synchronized and secure." 
                      : "Turn on Auto sync for Notes to keep your notes secure."}
                  </p>
                  
                  <div className="flex items-center justify-end gap-3 mt-3">
                    <button 
                      onClick={() => setShowSyncBanner(false)}
                      className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
                    >
                      Dismiss
                    </button>
                    {!isSynced && (
                      <button 
                        onClick={handleSyncClick}
                        disabled={isSyncing}
                        className="text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 hover:border-amber-400/30 transition-all px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Syncing...</span>
                          </>
                        ) : (
                          <span>Turn on</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Content Grid / List */}
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
              <FileText size={48} className="opacity-20 mb-4 stroke-[1.5]" />
              <h3 className="font-sans font-medium text-zinc-400">No notes here</h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">
                {searchQuery ? "No matches for your search" : "Tap the plus button below to create your first note."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PINNED NOTES SECTION */}
              {pinnedNotes.length > 0 && selectedNotebook !== 'Recently deleted' && (
                <div className="space-y-2">
                  <button 
                    onClick={() => setPinCollapsed(!pinCollapsed)}
                    className="flex items-center justify-between w-full text-zinc-400 hover:text-zinc-200 transition-all py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Pin size={13} className="text-amber-400 fill-amber-400/20" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Pin</span>
                      <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded-full text-zinc-500 font-mono">
                        {pinnedNotes.length}
                      </span>
                    </div>
                    {pinCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>

                  {!pinCollapsed && (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-2.5"}>
                      {pinnedNotes.map((note) => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onSelect={onSelectNote}
                          onTogglePin={onTogglePin}
                          onDelete={onDeleteNote}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* OTHER NOTES SECTION */}
              {unpinnedNotes.length > 0 && (
                <div className="space-y-2">
                  {pinnedNotes.length > 0 && selectedNotebook !== 'Recently deleted' && (
                    <button 
                      onClick={() => setOtherCollapsed(!otherCollapsed)}
                      className="flex items-center justify-between w-full text-zinc-400 hover:text-zinc-200 transition-all py-1 pt-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider">Other</span>
                        <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded-full text-zinc-500 font-mono">
                          {unpinnedNotes.length}
                        </span>
                      </div>
                      {otherCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  )}

                  {(!otherCollapsed || selectedNotebook === 'Recently deleted' || pinnedNotes.length === 0) && (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-2.5"}>
                      {unpinnedNotes.map((note) => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onSelect={onSelectNote}
                          onTogglePin={onTogglePin}
                          onDelete={onDeleteNote}
                          onRestore={onRestoreNote}
                          onHardDelete={onHardDeleteNote}
                          viewMode={viewMode}
                          isTrash={selectedNotebook === 'Recently deleted'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        /* Dedicate checklist tab */
        <div className="px-6 flex-1 animate-in fade-in duration-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <CheckSquare size={20} className="text-amber-400" />
              <span>General Checklists</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Active to-dos compiled from all your notes and lists.
            </p>
          </div>

          {allTodoItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
              <CheckSquare size={44} className="opacity-20 mb-3" />
              <h3 className="text-sm font-medium text-zinc-400">All caught up!</h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-[240px]">
                You have no active checklists inside your notes. Tap "+" on the main menu to make one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group items by note */}
              {Array.from(new Set(allTodoItems.map(item => item.noteId))).map(noteId => {
                const noteTitle = allTodoItems.find(item => item.noteId === noteId)?.noteTitle || 'Untitled Note';
                const itemsForNote = allTodoItems.filter(item => item.noteId === noteId);
                
                return (
                  <div key={noteId} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <button
                      onClick={() => onSelectNote(noteId)}
                      className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 text-left"
                    >
                      <span>{noteTitle}</span>
                      <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full font-mono">
                        {itemsForNote.filter(i => i.checked).length}/{itemsForNote.length}
                      </span>
                    </button>

                    <div className="space-y-2">
                      {itemsForNote.map(item => (
                        <div 
                          key={item.blockId} 
                          onClick={() => onSelectNote(noteId)}
                          className="flex items-start gap-2.5 cursor-pointer hover:bg-zinc-900/40 p-1.5 rounded-lg transition-colors"
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.checked 
                              ? 'bg-amber-400 border-amber-500 text-zinc-950' 
                              : 'border-zinc-700 hover:border-zinc-500'
                          }`}>
                            {item.checked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <span className={`text-sm ${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                            {item.content || "Empty item"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notebook Manager Popup / Folder Popup */}
      {isNotebookPopupOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
              <h3 className="font-sans font-medium text-base text-zinc-200">Notebook Folders</h3>
              <button 
                onClick={() => setIsNotebookPopupOpen(false)}
                className="p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 max-h-72 overflow-y-auto space-y-2.5">
              {/* Default Lists */}
              {['Default notebook', ...customNotebooks.filter(n => n !== 'Default notebook')].map((notebook) => (
                <div key={notebook} className="flex items-center justify-between group">
                  <button
                    onClick={() => {
                      setSelectedNotebook(notebook);
                      setIsNotebookPopupOpen(false);
                    }}
                    className={`flex items-center gap-3 text-sm font-medium py-1 px-2 rounded-xl flex-1 text-left ${
                      selectedNotebook === notebook 
                        ? 'text-amber-400 bg-amber-400/5' 
                        : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/50'
                    }`}
                  >
                    <BookOpen size={15} className="text-zinc-500" />
                    <span>{notebook}</span>
                  </button>
                  {notebook !== 'Default notebook' && (
                    <button
                      onClick={() => setCustomNotebooks(customNotebooks.filter(n => n !== notebook))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 transition-all rounded-lg hover:bg-zinc-900"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-5 bg-zinc-900/40 border-t border-zinc-800/60 flex gap-2">
              <input
                type="text"
                placeholder="New folder name..."
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomNotebook()}
                className="flex-1 bg-[#09090b] border border-zinc-800 text-sm rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={addCustomNotebook}
                className="p-2 bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      {selectedNotebook !== 'Recently deleted' && activeTab === 'notes' && (
        <button
          onClick={onNewNote}
          className="fixed bottom-24 right-6 w-14 h-14 bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center rounded-full shadow-lg hover:shadow-amber-400/20 active:scale-95 transition-all z-40 hover:rotate-90 duration-300"
          style={{ backgroundColor: '#fcd34d' }}
          id="new_note_button"
        >
          <Plus size={28} strokeWidth={2.5} className="text-zinc-950" />
        </button>
      )}

      {/* Bottom Tab Bar navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 border-t border-zinc-900/80 backdrop-blur-lg flex items-center justify-around py-3 px-6 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => {
            setActiveTab('notes');
            setSelectedNotebook('All notes');
          }}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'notes' && selectedNotebook !== 'Recently deleted'
              ? 'text-amber-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileText size={18} />
          <span className="text-[10px] font-bold tracking-wider font-sans">Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('todos')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'todos'
              ? 'text-amber-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <CheckSquare size={18} />
          <span className="text-[10px] font-bold tracking-wider font-sans">To-dos</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('notes');
            setSelectedNotebook('Recently deleted');
          }}
          className={`flex flex-col items-center gap-1.5 transition-colors ${
            activeTab === 'notes' && selectedNotebook === 'Recently deleted'
              ? 'text-red-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Archive size={18} />
          <span className="text-[10px] font-bold tracking-wider font-sans">Trash</span>
        </button>
      </nav>

      {/* Secret Purged Notes Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c0c0e] border border-amber-500/20 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.12)] flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
                  <AlertTriangle size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-zinc-100 flex items-center gap-1.5">
                    Secret Trash Bin
                  </h3>
                  <p className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
                    Deep Space Note Recovery
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSecretModal(false);
                  setPreviewNote(null);
                }}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {secretNotes.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                    <BookOpen size={24} />
                  </div>
                  <h4 className="font-sans font-semibold text-sm text-zinc-300">No secret notes found</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Notes permanently deleted from the trash bin will appear here. Hold the search button to reveal them.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>{secretNotes.length} PERMANENTLY DELETED NOTES AVAILABLE</span>
                    <button 
                      onClick={handleWipeAllSecretNotes}
                      className="text-red-400 hover:text-red-300 hover:underline font-bold transition-all text-xs"
                    >
                      Purge All Permanently
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[45vh] overflow-y-auto scrollbar-none pr-1">
                    {secretNotes.map((note) => {
                      const snippet = getNoteSnippet(note);
                      return (
                        <div 
                          key={note.id}
                          onClick={() => setPreviewNote(note)}
                          className="bg-[#121214] border border-zinc-800/80 hover:border-amber-500/30 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition-colors truncate">
                              {note.title || "Untitled note"}
                            </h4>
                            <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                              {snippet}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreSecretNote(note);
                              }}
                              className="text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1 rounded-full transition-colors active:scale-95"
                            >
                              Restore
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWipeSecretNote(note.id);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Erase forever"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Read-Only Preview Area */}
              {previewNote && (
                <div className="border border-zinc-800 rounded-2xl bg-[#08080a] p-4 space-y-3 mt-4 animate-in slide-in-from-bottom-4 duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      READ-ONLY PREVIEW
                    </span>
                    <button 
                      onClick={() => setPreviewNote(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold"
                    >
                      Hide Preview
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-zinc-100">
                      {previewNote.title || "Untitled note"}
                    </h3>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-none text-xs text-zinc-400 leading-relaxed font-sans">
                      {previewNote.blocks.map((block) => {
                        if (block.type === 'images' && block.imageUrls) {
                          return (
                            <div key={block.id} className="flex gap-1 py-1">
                              {block.imageUrls.map((url, i) => (
                                <div key={i} className="w-10 h-10 rounded overflow-hidden border border-zinc-800">
                                  <img src={url} alt="attached" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        if (block.type === 'table' && block.tableData) {
                          return <div key={block.id} className="text-[10px] font-mono bg-zinc-900 p-1 rounded">Grid/Table container</div>;
                        }
                        return (
                          <div key={block.id} className={block.type === 'todo' ? 'flex items-center gap-1.5' : ''}>
                            {block.type === 'todo' && <span className="w-3 h-3 border border-zinc-700 rounded-sm inline-block"></span>}
                            <span>{block.content}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleRestoreSecretNote(previewNote)}
                      className="flex-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs py-2 rounded-xl transition-all text-center active:scale-95"
                    >
                      Restore Note
                    </button>
                    <button
                      onClick={() => handleWipeSecretNote(previewNote.id)}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-red-950/30 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-xl transition-all"
                      title="Delete permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800/60 flex justify-end">
              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setPreviewNote(null);
                }}
                className="px-5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-full transition-all"
              >
                Close Secret Area
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// NOTE CARD COMPONENT FOR HOMEPAGE
interface NoteCardProps {
  key?: string | number;
  note: Note;
  onSelect: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onHardDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isTrash?: boolean;
}

function NoteCard({
  note,
  onSelect,
  onTogglePin,
  onDelete,
  onRestore,
  onHardDelete,
  viewMode,
  isTrash = false,
}: NoteCardProps) {
  const snippet = (() => {
    const textBlocks = note.blocks.filter(b => b.type === 'paragraph' || b.type === 'todo');
    if (textBlocks.length > 0) {
      const text = textBlocks[0].content;
      return text.length > 42 ? text.slice(0, 42) + '...' : text;
    }
    return 'No content yet';
  })();

  const thumbnail = (() => {
    const imageBlock = note.blocks.find(b => b.type === 'images' && b.imageUrls && b.imageUrls.length > 0);
    if (imageBlock && imageBlock.imageUrls) {
      return imageBlock.imageUrls[0];
    }
    return null;
  })();

  const formattedDate = () => {
    try {
      const d = new Date(note.lastModified);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return note.lastModified;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div 
        onClick={() => !isTrash && onSelect(note.id)}
        className="group bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all cursor-pointer h-40 relative"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <h4 className="font-sans font-medium text-zinc-100 text-sm truncate group-hover:text-amber-300 transition-colors">
              {note.title || "Untitled note"}
            </h4>
            {!isTrash && onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                className={`p-1 rounded-full hover:bg-zinc-800 transition-colors ${
                  note.isPinned ? 'text-amber-400' : 'text-zinc-600 opacity-40 group-hover:opacity-100'
                }`}
              >
                <Pin size={11} className={note.isPinned ? "fill-amber-400/15" : ""} />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-3">
            {snippet}
          </p>
        </div>

        {/* Thumbnail overlay */}
        {thumbnail && (
          <div className="absolute right-3 bottom-10 w-10 h-10 rounded-lg overflow-hidden border border-zinc-800/80">
            <img src={thumbnail} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800/40 pt-2 mt-2">
          <span className="text-[10px] font-mono text-zinc-500">{formattedDate()}</span>
          {isTrash ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore?.(note.id);
                }}
                className="text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 px-2 py-0.5 rounded-full transition-colors border border-emerald-500/10"
                title="Restore note"
              >
                Restore
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHardDelete?.(note.id);
                }}
                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                title="Delete forever"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(note.id);
              }}
              className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // LIST VIEW CARD (Mimicking screenshot list item!)
  return (
    <div 
      onClick={() => !isTrash && onSelect(note.id)}
      className="group bg-[#18181b]/50 border border-zinc-800/60 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer relative"
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          {!isTrash && note.isPinned && (
            <Pin size={11} className="text-amber-400 fill-amber-400/20" />
          )}
          <h4 className="font-sans font-medium text-zinc-100 text-[15px] truncate group-hover:text-amber-300 transition-colors">
            {note.title || "Untitled note"}
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[10px] text-zinc-500 flex-shrink-0">{formattedDate()}</span>
          <span className="text-zinc-400 font-sans truncate">
            {snippet}
          </span>
        </div>
      </div>

      {/* Small thumbnail on the right */}
      {thumbnail ? (
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800/80 flex-shrink-0 mr-2">
          <img src={thumbnail} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      ) : null}

      <div className="flex items-center gap-2 flex-shrink-0">
        {isTrash ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore?.(note.id);
              }}
              className="text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-full transition-colors border border-emerald-500/15"
            >
              Restore
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHardDelete?.(note.id);
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
              title="Delete permanently"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            {onTogglePin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-500 ${
                  note.isPinned ? 'text-amber-400 opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Pin size={13} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(note.id);
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
