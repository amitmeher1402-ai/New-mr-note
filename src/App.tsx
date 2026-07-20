import React, { useState, useEffect } from 'react';
import { Note, NoteBlock, BlockType, GridStyle, LineSpacing } from './types';
import NoteHome from './components/NoteHome';
import NoteEditor from './components/NoteEditor';
import NoteShareView from './components/NoteShareView';

const PRELOADED_NOTES: Note[] = [
  {
    id: 'note_1',
    title: 'New features in Notes',
    titleWithToggle: true,
    titleToggleState: true,
    lastModified: new Date().toISOString(),
    isPinned: true,
    notebook: 'Default notebook',
    gridStyle: GridStyle.RULED,
    lineSpacing: LineSpacing.NORMAL,
    recordings: [
      {
        id: 'rec_sample_1',
        name: 'Voice Explainer',
        duration: 8,
        url: '', // Simulated
        dateAdded: new Date().toLocaleDateString()
      }
    ],
    blocks: [
      {
        id: 'b1_1',
        type: BlockType.PARAGRAPH,
        content: 'Boost your productivity with paragraph-based editing, new highlight options, quick functions at the tap of "/", and more.'
      },
      {
        id: 'b1_2',
        type: BlockType.IMAGES,
        content: '',
        imageUrls: [
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', // mountain
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'  // yak
        ],
        imageLayout: 'side-by-side'
      },
      {
        id: 'b1_3',
        type: BlockType.H1,
        content: 'Packing list'
      },
      {
        id: 'b1_4',
        type: BlockType.TODO,
        content: 'Clothes: Shell jacket & pants, quick-dry top & bottoms, fleece set, waterproof hiking shoes, warm hat, sun hat',
        checked: false
      },
      {
        id: 'b1_5',
        type: BlockType.TODO,
        content: 'Hiking gear: Trekking poles, 30L pack',
        checked: false
      },
      {
        id: 'b1_6',
        type: BlockType.PARAGRAPH,
        content: 'Remember to pack extra sunglasses, meds, and dry food for the high mountain passes.',
        isBold: true,
        highlightType: 'underline',
        highlightColor: 'border-blue-500' // underlined like in image 4!
      },
      {
        id: 'b1_7',
        type: BlockType.PARAGRAPH,
        content: 'Line spacing, paragraph spacing, and color contrast have been fine-tuned for a more pleasant reading experience, with new grid line styles to choose from.'
      }
    ]
  },
  {
    id: 'note_2',
    title: 'apk install',
    lastModified: new Date('2026-07-10T15:20:00Z').toISOString(),
    isPinned: false,
    notebook: 'Default notebook',
    gridStyle: GridStyle.NONE,
    lineSpacing: LineSpacing.NORMAL,
    blocks: [
      {
        id: 'b2_1',
        type: BlockType.PARAGRAPH,
        content: 'Welcome to N-Educate and Thank you for choosing our platform. Here is the direct link to setup your notes apk on your local Android device for offline preparation.'
      }
    ]
  },
  {
    id: 'note_3',
    title: 'app',
    lastModified: new Date('2026-07-10T14:15:00Z').toISOString(),
    isPinned: false,
    notebook: 'Default notebook',
    gridStyle: GridStyle.NONE,
    lineSpacing: LineSpacing.NORMAL,
    blocks: [
      {
        id: 'b3_1',
        type: BlockType.PARAGRAPH,
        content: 'Prompt Start Here -----------------------'
      },
      {
        id: 'b3_2',
        type: BlockType.PARAGRAPH,
        content: 'Configure your custom system instructions and persona in AGENTS.md or GEMINI.md files at the project root directory.'
      }
    ]
  },
  {
    id: 'note_4',
    title: 'I want you to build a COMPLETE NATIVE ANDROID...',
    lastModified: new Date('2026-07-09T08:45:00Z').toISOString(),
    isPinned: false,
    notebook: 'Personal',
    gridStyle: GridStyle.NONE,
    lineSpacing: LineSpacing.NORMAL,
    blocks: [
      {
        id: 'b4_1',
        type: BlockType.PARAGRAPH,
        content: 'VERY IMPORTANT: Build exact functional client-side features without mock-ups. Use native components and ensure persistent data stores via LocalStorage.'
      }
    ]
  }
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'todos'>('notes');
  const [isSynced, setIsSynced] = useState(false);
  const [sharedNote, setSharedNote] = useState<Note | null>(null);

  // Load notes on mount and setup popstate history synchronization
  useEffect(() => {
    const saved = localStorage.getItem('notes_data');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        setNotes(PRELOADED_NOTES);
        localStorage.setItem('notes_data', JSON.stringify(PRELOADED_NOTES));
      }
    } else {
      setNotes(PRELOADED_NOTES);
      localStorage.setItem('notes_data', JSON.stringify(PRELOADED_NOTES));
    }

    // Set initial state for the homepage in history so they can't go back beyond it
    if (!window.history.state) {
      window.history.replaceState({ noteId: null }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.noteId) {
        setSelectedNoteId(state.noteId);
      } else {
        setSelectedNoteId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Check URL hash for shared note link
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashRoute);
    };
  }, []);

  const handleHashRoute = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#shared-')) {
      const id = hash.replace('#shared-', '');
      const saved = localStorage.getItem('notes_data');
      let currentNotes = PRELOADED_NOTES;
      if (saved) {
        try { currentNotes = JSON.parse(saved); } catch {}
      }
      const found = currentNotes.find(n => n.id === id);
      if (found) {
        setSharedNote(found);
      }
    } else {
      setSharedNote(null);
    }
  };

  // Sync to local storage
  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('notes_data', JSON.stringify(updatedNotes));
  };

  // Note actions
  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    window.history.pushState({ noteId: id }, '', `#note-${id}`);
  };

  const handleNewNote = () => {
    const newNoteId = 'note_' + Date.now();
    const newNote: Note = {
      id: newNoteId,
      title: '',
      lastModified: new Date().toISOString(),
      isPinned: false,
      notebook: 'Default notebook',
      gridStyle: GridStyle.NONE,
      lineSpacing: LineSpacing.NORMAL,
      blocks: [
        {
          id: 'block_' + Date.now(),
          type: BlockType.PARAGRAPH,
          content: ''
        }
      ]
    };
    saveNotes([newNote, ...notes]);
    setSelectedNoteId(newNoteId);
    window.history.pushState({ noteId: newNoteId }, '', `#note-${newNoteId}`);
  };

  const handleDeleteNote = (id: string) => {
    // Send to Recently Deleted
    const updated = notes.map(n => n.id === id ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() } : n);
    saveNotes(updated);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  };

  const handleRestoreNote = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n);
    saveNotes(updated);
  };

  const handleHardDeleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete) {
      const savedPurged = localStorage.getItem('purged_notes_data');
      let currentPurged: Note[] = [];
      if (savedPurged) {
        try { currentPurged = JSON.parse(savedPurged); } catch {}
      }
      if (!currentPurged.some(n => n.id === noteToDelete.id)) {
        const updatedPurged = [{ ...noteToDelete, isDeleted: false, deletedAt: undefined }, ...currentPurged];
        localStorage.setItem('purged_notes_data', JSON.stringify(updatedPurged));
      }
    }

    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  const handleEmptyTrash = () => {
    const deletedNotes = notes.filter(n => n.isDeleted);
    const savedPurged = localStorage.getItem('purged_notes_data');
    let currentPurged: Note[] = [];
    if (savedPurged) {
      try { currentPurged = JSON.parse(savedPurged); } catch {}
    }

    const updatedPurged = [...currentPurged];
    deletedNotes.forEach(dn => {
      if (!updatedPurged.some(n => n.id === dn.id)) {
        updatedPurged.unshift({ ...dn, isDeleted: false, deletedAt: undefined });
      }
    });
    localStorage.setItem('purged_notes_data', JSON.stringify(updatedPurged));

    const updated = notes.filter(n => !n.isDeleted);
    saveNotes(updated);
  };

  const handleRestorePurgedNote = (restoredNote: Note) => {
    const cleanNote = { ...restoredNote, isDeleted: false, deletedAt: undefined };
    saveNotes([cleanNote, ...notes]);
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    saveNotes(updated);
  };

  const handleUpdateNote = (updated: Note) => {
    const updatedList = notes.map(n => n.id === updated.id ? updated : n);
    saveNotes(updatedList);
  };

  const handleSyncNotes = () => {
    setIsSynced(true);
  };

  const generateShareLink = (noteId: string) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}#shared-${noteId}`;
  };

  const closeSharedView = () => {
    window.location.hash = '';
    setSharedNote(null);
  };

  // Routing
  if (sharedNote) {
    return <NoteShareView note={sharedNote} onClose={closeSharedView} />;
  }

  if (selectedNoteId) {
    const activeNote = notes.find(n => n.id === selectedNoteId);
    if (activeNote) {
      return (
        <NoteEditor
          note={activeNote}
          onBack={() => window.history.back()}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
          onGenerateShareLink={generateShareLink}
        />
      );
    }
  }

  return (
    <NoteHome
      notes={notes}
      onSelectNote={handleSelectNote}
      onNewNote={handleNewNote}
      onDeleteNote={handleDeleteNote}
      onTogglePin={handleTogglePin}
      onRestoreNote={handleRestoreNote}
      onHardDeleteNote={handleHardDeleteNote}
      onSyncNotes={handleSyncNotes}
      isSynced={isSynced}
      onEmptyTrash={handleEmptyTrash}
      onRestorePurgedNote={handleRestorePurgedNote}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}
