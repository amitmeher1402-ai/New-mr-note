import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Share2, MoreVertical, Pin, Grid, Type, Check, 
  Trash2, Plus, GripVertical, CheckSquare, Sparkles, Image as ImageIcon, 
  Table as TableIcon, Heading1, Heading2, Mic, Paperclip, Copy, Scissors, ChevronDown, Download, ExternalLink, Bold, Eye, X
} from 'lucide-react';
import { Note, NoteBlock, BlockType, GridStyle, LineSpacing, VoiceRecording, TableRow } from '../types';
import VoiceRecorder from './VoiceRecorder';

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onUpdateNote: (updated: Note) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onGenerateShareLink: (noteId: string) => string;
}

export default function NoteEditor({
  note,
  onBack,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onGenerateShareLink
}: NoteEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashSearch, setSlashSearch] = useState('');
  
  // Highlighting/Style menu state
  const [selectedBlockForStyle, setSelectedBlockForStyle] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentStyleType, setCurrentStyleType] = useState<'none' | 'background' | 'underline' | 'wavy' | 'text-color'>('none');
  
  // Options menus
  const [showEditorMenu, setShowEditorMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState<string | null>(null); // For TXT/PDF presentation

  const editorRef = useRef<HTMLDivElement>(null);

  // Default mountain/yak photos
  const SAMPLE_MOUNTAIN = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";
  const SAMPLE_YAK = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80";

  // Auto scroll to active block slash menu
  useEffect(() => {
    if (slashMenuBlockId) {
      const activeEl = document.getElementById(`block-editor-${slashMenuBlockId}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [slashMenuBlockId]);

  // Handle note updates
  const updateNoteTitle = (newTitle: string) => {
    onUpdateNote({
      ...note,
      title: newTitle,
      lastModified: new Date().toISOString()
    });
  };

  const toggleTitleSwitch = () => {
    onUpdateNote({
      ...note,
      titleToggleState: !note.titleToggleState,
      lastModified: new Date().toISOString()
    });
  };

  const updateBlocks = (updatedBlocks: NoteBlock[]) => {
    onUpdateNote({
      ...note,
      blocks: updatedBlocks,
      lastModified: new Date().toISOString()
    });
  };

  // Block management
  const handleBlockChange = (blockId: string, value: string) => {
    const isSlash = value.endsWith('/');
    
    const updated = note.blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, content: value };
      }
      return block;
    });

    if (isSlash) {
      setSlashMenuBlockId(blockId);
      setSlashSearch('');
    } else if (slashMenuBlockId === blockId && !value.includes('/')) {
      setSlashMenuBlockId(null);
    }

    updateBlocks(updated);
  };

  const selectBlockStyle = (blockId: string, style: 'none' | 'background' | 'underline' | 'wavy' | 'text-color') => {
    setCurrentStyleType(style);
    if (style === 'none') {
      const updated = note.blocks.map(b => b.id === blockId ? { ...b, highlightType: 'none' as const, highlightColor: undefined } : b);
      updateBlocks(updated);
      setSelectedBlockForStyle(null);
    } else {
      setShowColorPicker(true);
    }
  };

  const applyHighlightColor = (colorClass: string) => {
    if (!selectedBlockForStyle) return;
    const updated = note.blocks.map(block => {
      if (block.id === selectedBlockForStyle) {
        return {
          ...block,
          highlightType: currentStyleType,
          highlightColor: colorClass
        };
      }
      return block;
    });
    updateBlocks(updated);
    setShowColorPicker(false);
    setSelectedBlockForStyle(null);
  };

  const applyBoldToBlock = (blockId: string) => {
    const updated = note.blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, isBold: !block.isBold };
      }
      return block;
    });
    updateBlocks(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, block: NoteBlock) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Add a new paragraph block below
      const newBlock: NoteBlock = {
        id: 'block_' + Date.now(),
        type: BlockType.PARAGRAPH,
        content: ''
      };
      const updated = [...note.blocks];
      updated.splice(index + 1, 0, newBlock);
      updateBlocks(updated);
      setTimeout(() => {
        const nextInput = document.getElementById(`input-${newBlock.id}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      }, 50);
    } else if (e.key === 'Backspace' && block.content === '' && note.blocks.length > 1) {
      e.preventDefault();
      // Delete empty block and focus previous
      const updated = note.blocks.filter(b => b.id !== block.id);
      updateBlocks(updated);
      const prevBlock = note.blocks[index - 1];
      if (prevBlock) {
        setTimeout(() => {
          const prevInput = document.getElementById(`input-${prevBlock.id}`);
          if (prevInput) {
            (prevInput as HTMLInputElement).focus();
            // Put cursor at the end
            const val = prevBlock.content;
            (prevInput as HTMLInputElement).value = '';
            (prevInput as HTMLInputElement).value = val;
          }
        }, 50);
      }
    }
  };

  // Convert block type
  const convertBlockType = (blockId: string, type: BlockType) => {
    const updated = note.blocks.map(block => {
      if (block.id === blockId) {
        // Strip out trailing '/' if converting from slash menu
        let cleanedContent = block.content;
        if (cleanedContent.endsWith('/')) {
          cleanedContent = cleanedContent.slice(0, -1);
        }

        const base: Partial<NoteBlock> = {
          ...block,
          type,
          content: cleanedContent
        };

        if (type === BlockType.TODO) {
          base.checked = false;
        }

        if (type === BlockType.IMAGES) {
          base.imageUrls = [SAMPLE_MOUNTAIN, SAMPLE_YAK];
          base.imageLayout = 'side-by-side';
        }

        if (type === BlockType.TABLE) {
          base.tableData = {
            headers: ['Item', 'Qty', 'Status'],
            rows: [
              { id: 'r1', cells: ['Boots', '1 Pair', 'Packed'] },
              { id: 'r2', cells: ['Jacket', '1', 'Ready'] }
            ]
          };
        }

        return base as NoteBlock;
      }
      return block;
    });

    updateBlocks(updated);
    setSlashMenuBlockId(null);
  };

  // Reorder / Drag simulation
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= note.blocks.length) return;
    
    const updated = [...note.blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    updateBlocks(updated);
  };

  // Switch image layout (Side by side vs Stacked)
  const toggleImageLayout = (blockId: string) => {
    const updated = note.blocks.map(block => {
      if (block.id === blockId && block.type === BlockType.IMAGES) {
        const nextLayout = block.imageLayout === 'side-by-side' ? 'stacked' : 'side-by-side';
        return { ...block, imageLayout: nextLayout as 'side-by-side' | 'stacked' };
      }
      return block;
    });
    updateBlocks(updated);
  };

  // Table Editing
  const updateTableCell = (blockId: string, rowIndex: number, cellIndex: number, val: string) => {
    const updated = note.blocks.map(block => {
      if (block.id === blockId && block.type === BlockType.TABLE && block.tableData) {
        const newRows = [...block.tableData.rows];
        newRows[rowIndex].cells[cellIndex] = val;
        return {
          ...block,
          tableData: { ...block.tableData, rows: newRows }
        };
      }
      return block;
    });
    updateBlocks(updated);
  };

  // Selection mode helper
  const handleSelectBlock = (id: string) => {
    if (selectedBlockIds.includes(id)) {
      setSelectedBlockIds(selectedBlockIds.filter(bid => bid !== id));
    } else {
      setSelectedBlockIds([...selectedBlockIds, id]);
    }
  };

  const handleBulkFormat = (type: BlockType) => {
    const updated = note.blocks.map(block => {
      if (selectedBlockIds.includes(block.id)) {
        return { ...block, type, checked: type === BlockType.TODO ? false : undefined };
      }
      return block;
    });
    updateBlocks(updated);
    setIsSelectMode(false);
    setSelectedBlockIds([]);
  };

  const handleBulkDelete = () => {
    const updated = note.blocks.filter(block => !selectedBlockIds.includes(block.id));
    if (updated.length === 0) {
      updated.push({ id: 'block_empty_' + Date.now(), type: BlockType.PARAGRAPH, content: '' });
    }
    updateBlocks(updated);
    setIsSelectMode(false);
    setSelectedBlockIds([]);
  };

  // Sound memos management
  const addVoiceRecording = (rec: VoiceRecording) => {
    const currentMemos = note.recordings || [];
    onUpdateNote({
      ...note,
      recordings: [...currentMemos, rec],
      lastModified: new Date().toISOString()
    });
  };

  const deleteVoiceRecording = (id: string) => {
    const currentMemos = note.recordings || [];
    onUpdateNote({
      ...note,
      recordings: currentMemos.filter(rec => rec.id !== id),
      lastModified: new Date().toISOString()
    });
  };

  // Generate public sharing url
  const copyShareLink = () => {
    const url = onGenerateShareLink(note.id);
    navigator.clipboard.writeText(url);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Export note as text file
  const downloadTxt = () => {
    let text = `=== ${note.title} ===\nLast Modified: ${new Date(note.lastModified).toLocaleString()}\n\n`;
    note.blocks.forEach((block, idx) => {
      if (block.type === BlockType.H1) text += `# ${block.content}\n\n`;
      else if (block.type === BlockType.H2) text += `## ${block.content}\n\n`;
      else if (block.type === BlockType.TODO) text += `[${block.checked ? 'x' : ' '}] ${block.content}\n`;
      else if (block.type === BlockType.TABLE && block.tableData) {
        text += `| ${block.tableData.headers.join(' | ')} |\n`;
        text += `| ${block.tableData.headers.map(() => '---').join(' | ')} |\n`;
        block.tableData.rows.forEach(r => {
          text += `| ${r.cells.join(' | ')} |\n`;
        });
        text += '\n';
      } else if (block.type === BlockType.IMAGES) {
        text += `[Images: ${block.imageUrls?.join(', ')}]\n\n`;
      } else {
        text += `${block.content}\n\n`;
      }
    });

    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title || 'Note'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Grid style class generator
  const getGridStyleClass = () => {
    switch (note.gridStyle) {
      case GridStyle.RULED:
        return 'ruled-background-dark text-zinc-100';
      case GridStyle.GRID:
        return 'grid-background-dark text-zinc-100';
      case GridStyle.DOTS:
        return 'dots-background-dark text-zinc-100';
      default:
        return 'bg-[#09090b] text-zinc-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none relative pb-32">
      {/* Navigation Top Header */}
      <header className="px-5 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/95 backdrop-blur-md z-40 border-b border-zinc-800/80 shadow-md text-white">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex items-center gap-1">
          {/* Grid line style selector */}
          <div className="relative">
            <button 
              onClick={() => setShowEditorMenu(!showEditorMenu)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
              title="Grid Lines & Layout"
            >
              <Grid size={18} />
              <span className="capitalize">{note.gridStyle === GridStyle.NONE ? 'Plain' : note.gridStyle}</span>
              <ChevronDown size={12} />
            </button>
            {showEditorMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#18181b] border border-zinc-800 rounded-2xl shadow-xl py-2 z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Background style</div>
                {Object.values(GridStyle).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      onUpdateNote({ ...note, gridStyle: style });
                      setShowEditorMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors"
                  >
                    <span className="capitalize">{style} Lines</span>
                    {note.gridStyle === style && <Check size={14} className="text-amber-400" />}
                  </button>
                ))}
                
                <div className="border-t border-zinc-800/60 my-1.5" />
                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Spacing</div>
                {['tight', 'normal', 'relaxed'].map((space) => (
                  <button
                    key={space}
                    onClick={() => {
                      onUpdateNote({ ...note, lineSpacing: space as LineSpacing });
                      setShowEditorMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-zinc-900 transition-colors"
                  >
                    <span className="capitalize">{space} Spacing</span>
                    {note.lineSpacing === space && <Check size={13} className="text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => onTogglePin(note.id)}
            className={`p-2 rounded-full hover:bg-zinc-800 transition-colors active:scale-95 ${
              note.isPinned ? 'text-amber-400' : 'text-zinc-400'
            }`}
          >
            <Pin size={18} className={note.isPinned ? "fill-amber-400/10" : ""} />
          </button>

          {/* Share/Export button */}
          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 transition-colors active:scale-95"
            >
              <Share2 size={18} />
            </button>
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#18181b] border border-zinc-800 rounded-2xl shadow-xl py-2 z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Export As</div>
                <button
                  onClick={() => {
                    downloadTxt();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors text-left"
                >
                  <Download size={14} className="text-amber-400" />
                  <span>Text File (.txt)</span>
                </button>
                
                <button
                  onClick={() => {
                    window.print();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors text-left"
                >
                  <Download size={14} className="text-amber-400" />
                  <span>Print or PDF</span>
                </button>

                <div className="border-t border-zinc-800/60 my-1.5" />
                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Share link</div>
                <button
                  onClick={copyShareLink}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-900 transition-colors text-left"
                >
                  <span className="text-zinc-300">
                    {copiedSuccess ? "Copied!" : "Copy Share Link"}
                  </span>
                  <ExternalLink size={12} className="text-zinc-500" />
                </button>
              </div>
            )}
          </div>

          {/* Bulk select mode toggle */}
          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedBlockIds([]);
            }}
            className={`p-2 rounded-full transition-colors active:scale-95 ${
              isSelectMode ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold' : 'hover:bg-zinc-800 text-zinc-300'
            }`}
            title="Multi-select blocks"
          >
            <Eye size={18} />
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <div 
        ref={editorRef}
        className={`flex-1 px-6 pt-6 pb-20 transition-all overflow-y-auto ${getGridStyleClass()}`}
        style={{
          lineHeight: note.lineSpacing === 'tight' ? '1.3' : note.lineSpacing === 'relaxed' ? '1.8' : '1.5',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Title Block with slider switch */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-3 mb-6">
          <input 
            type="text"
            value={note.title}
            onChange={(e) => updateNoteTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-2xl font-bold font-sans bg-transparent border-none focus:outline-none text-zinc-100 placeholder-zinc-700"
          />

          {/* Samsung Note slide switch */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono font-bold text-zinc-500">Lock Title</span>
            <button
              onClick={toggleTitleSwitch}
              className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 flex items-center justify-between relative shadow-inner ${
                note.titleToggleState ? 'bg-blue-500' : 'bg-zinc-800'
              }`}
            >
              {/* Floating yellow accent dot from image */}
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1.5 opacity-80" />
              
              {/* Main sliding white handle */}
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 absolute ${
                  note.titleToggleState ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dynamic Blocks Container */}
        <div className="space-y-4">
          {note.blocks.map((block, idx) => {
            const isActive = activeBlockId === block.id;
            const isSelected = selectedBlockIds.includes(block.id);
            const isHighlightActive = block.highlightType && block.highlightType !== 'none';
            
            // Build dynamic inline style classes for highlights based on mock
            let textStyleClasses = "text-base outline-none w-full bg-transparent border-none py-1 ";
            
            if (block.isBold) textStyleClasses += " font-bold ";

            if (block.highlightType === 'background') {
              textStyleClasses += ` px-1.5 py-0.5 rounded ${block.highlightColor || 'bg-amber-100'}`;
            } else if (block.highlightType === 'underline') {
              textStyleClasses += ` border-b-2 ${block.highlightColor || 'border-blue-500'}`;
            } else if (block.highlightType === 'wavy') {
              textStyleClasses += ` underline decoration-wavy ${block.highlightColor || 'decoration-green-500'}`;
            } else if (block.highlightType === 'text-color') {
              textStyleClasses += ` ${block.highlightColor || 'text-red-500'}`;
            }

            return (
              <div 
                key={block.id}
                id={`block-editor-${block.id}`}
                className={`group/block flex items-start gap-2 rounded-xl transition-all relative ${
                  isSelectMode ? 'hover:bg-zinc-900/40 p-2 border border-dashed border-zinc-800/80' : ''
                }`}
              >
                {/* Drag handle or Selection modes indicators */}
                {isSelectMode ? (
                  <button
                    onClick={() => handleSelectBlock(block.id)}
                    className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors mr-1 ${
                      isSelected 
                        ? 'bg-amber-400 border-amber-500 text-zinc-950' 
                        : 'border-zinc-700 text-transparent hover:border-zinc-600'
                    }`}
                  >
                    <Check size={11} strokeWidth={4} />
                  </button>
                ) : (
                  <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-0.5 absolute -left-7 top-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800 text-zinc-400 shadow-lg z-10">
                    <button 
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:text-white rounded hover:bg-zinc-800 disabled:opacity-20"
                    >
                      <ChevronDown size={12} className="rotate-180" />
                    </button>
                    <button 
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === note.blocks.length - 1}
                      className="p-1 hover:text-white rounded hover:bg-zinc-800 disabled:opacity-20"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedBlockForStyle(block.id);
                        setCurrentStyleType('background');
                        setShowColorPicker(true);
                      }}
                      className="p-1 hover:text-white rounded hover:bg-zinc-800 text-amber-400"
                      title="Highlight formatting"
                    >
                      <Sparkles size={11} />
                    </button>
                  </div>
                )}

                {/* Block Content Rendering */}
                <div className="flex-1 min-w-0">
                  {block.type === BlockType.PARAGRAPH && (
                    <input
                      id={`input-${block.id}`}
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockChange(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, block)}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDoubleClick={() => setSelectedBlockForStyle(block.id)}
                      placeholder="Type text, double-click to style, '/' for menu"
                      className={`${textStyleClasses} text-zinc-100 placeholder-zinc-600`}
                    />
                  )}

                  {block.type === BlockType.H1 && (
                    <input
                      id={`input-${block.id}`}
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockChange(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, block)}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDoubleClick={() => setSelectedBlockForStyle(block.id)}
                      placeholder="Title 1"
                      className={`${textStyleClasses} text-xl font-extrabold text-zinc-100 border-none pb-1 placeholder-zinc-500`}
                    />
                  )}

                  {block.type === BlockType.H2 && (
                    <input
                      id={`input-${block.id}`}
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockChange(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, block)}
                      onFocus={() => setActiveBlockId(block.id)}
                      onDoubleClick={() => setSelectedBlockForStyle(block.id)}
                      placeholder="Subtitle 2"
                      className={`${textStyleClasses} text-lg font-bold text-zinc-200 border-none pb-0.5 placeholder-zinc-500`}
                    />
                  )}

                  {block.type === BlockType.TODO && (
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          const updated = note.blocks.map(b => b.id === block.id ? { ...b, checked: !b.checked } : b);
                          updateBlocks(updated);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                          block.checked 
                            ? 'bg-blue-500 border-blue-600 text-white' 
                            : 'border-zinc-700 hover:border-zinc-500 text-zinc-400'
                        }`}
                      >
                        {block.checked && <Check size={13} strokeWidth={3} />}
                      </button>
                      <input
                        id={`input-${block.id}`}
                        type="text"
                        value={block.content}
                        onChange={(e) => handleBlockChange(block.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, block)}
                        onFocus={() => setActiveBlockId(block.id)}
                        className={`text-base outline-none w-full bg-transparent border-none py-1 ${
                          block.checked ? 'text-zinc-500 line-through' : 'text-zinc-100'
                        }`}
                        placeholder="To-do item"
                      />
                    </div>
                  )}

                  {block.type === BlockType.IMAGES && block.imageUrls && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between bg-zinc-900/40 p-2 rounded-xl border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <ImageIcon size={14} />
                          <span>Image Block (Himalayan pack)</span>
                        </span>
                        
                        <button
                          onClick={() => toggleImageLayout(block.id)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-200 shadow-sm transition-colors"
                        >
                          {block.imageLayout === 'side-by-side' ? "Switch to Stacked rows" : "Switch to Side-by-Side cols"}
                        </button>
                      </div>

                      <div className={`grid gap-3 transition-all duration-300 ${
                        block.imageLayout === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1'
                      }`}>
                        {block.imageUrls.map((url, i) => (
                          <div key={i} className="rounded-2xl overflow-hidden border border-zinc-800 shadow-sm group/img relative bg-zinc-950">
                            <img 
                              src={url} 
                              alt="attached item" 
                              className="w-full max-h-64 object-cover object-center" 
                              referrerPolicy="no-referrer"
                            />
                            {/* Visual toggle overlays of checkbox circles from Image 2 */}
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white/80 bg-black/10 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === BlockType.TABLE && block.tableData && (
                    <div className="overflow-x-auto my-3 p-1 border border-zinc-800 rounded-xl bg-zinc-950/40 shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase font-bold tracking-wider">
                            {block.tableData.headers.map((h, hidx) => (
                              <th key={hidx} className="p-2.5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.tableData.rows.map((row, ridx) => (
                            <tr key={row.id} className="border-b border-zinc-800 last:border-none">
                              {row.cells.map((cell, cidx) => (
                                <td key={cidx} className="p-2">
                                  <input 
                                    type="text" 
                                    value={cell}
                                    onChange={(e) => updateTableCell(block.id, ridx, cidx, e.target.value)}
                                    className="bg-transparent border-none text-zinc-100 w-full focus:outline-none focus:bg-zinc-900 rounded px-1"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Floating slash command popover menu matching Image 3 */}
                {slashMenuBlockId === block.id && (
                  <div className="absolute left-6 top-10 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Recently used</div>
                    
                    <button
                      onClick={() => convertBlockType(block.id, BlockType.H2)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px] flex items-center justify-center border border-amber-500/20">H2</span>
                      <span>Subtitle</span>
                    </button>

                    <button
                      onClick={() => convertBlockType(block.id, BlockType.TODO)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <CheckSquare size={12} />
                      </span>
                      <span>To-dos</span>
                    </button>

                    <button
                      onClick={() => convertBlockType(block.id, BlockType.IMAGES)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <ImageIcon size={12} />
                      </span>
                      <span>Take photo (Attach Himalayan yaks)</span>
                    </button>

                    <button
                      onClick={() => convertBlockType(block.id, BlockType.H1)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded bg-orange-500/10 text-orange-400 font-bold text-[10px] flex items-center justify-center border border-orange-500/20">H1</span>
                      <span>Title Heading</span>
                    </button>

                    <button
                      onClick={() => convertBlockType(block.id, BlockType.TABLE)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                        <TableIcon size={12} />
                      </span>
                      <span>Insert Table Grid</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating formatting highlighters menu matching Image 4 */}
        {selectedBlockForStyle && !isSelectMode && (
          <div className="fixed left-1/2 bottom-28 -translate-x-1/2 bg-zinc-900 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.4)] border border-zinc-800 px-4 py-2.5 flex items-center gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <button 
              onClick={() => {
                setSelectedBlockForStyle(null);
                setShowColorPicker(false);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800"
            >
              <X size={15} />
            </button>

            <button 
              onClick={() => applyBoldToBlock(selectedBlockForStyle)}
              className="px-3.5 py-1.5 flex flex-col items-center gap-0.5 text-zinc-300 hover:bg-zinc-800 rounded-xl hover:text-white"
            >
              <Bold size={15} className="text-zinc-100" />
              <span className="text-[9px] font-medium text-zinc-500">Bold</span>
            </button>

            <button 
              onClick={() => selectBlockStyle(selectedBlockForStyle, 'background')}
              className="px-3.5 py-1.5 flex flex-col items-center gap-0.5 text-zinc-300 hover:bg-zinc-800 rounded-xl hover:text-white"
            >
              <span className="w-5 h-5 bg-amber-400 text-zinc-900 font-bold text-xs flex items-center justify-center rounded">A</span>
              <span className="text-[9px] font-medium text-zinc-500">Highlight</span>
            </button>

            <button 
              onClick={() => selectBlockStyle(selectedBlockForStyle, 'underline')}
              className="px-3.5 py-1.5 flex flex-col items-center gap-0.5 text-zinc-300 hover:bg-zinc-800 rounded-xl hover:text-white"
            >
              <span className="text-zinc-100 font-bold text-xs border-b-2 border-blue-400 px-0.5">A</span>
              <span className="text-[9px] font-medium text-zinc-500">Underline</span>
            </button>

            <button 
              onClick={() => selectBlockStyle(selectedBlockForStyle, 'wavy')}
              className="px-3.5 py-1.5 flex flex-col items-center gap-0.5 text-zinc-300 hover:bg-zinc-800 rounded-xl hover:text-white"
            >
              <span className="text-zinc-100 font-bold text-xs underline decoration-wavy decoration-emerald-500 px-0.5">A</span>
              <span className="text-[9px] font-medium text-zinc-500">Wavy</span>
            </button>

            <button 
              onClick={() => selectBlockStyle(selectedBlockForStyle, 'text-color')}
              className="px-3.5 py-1.5 flex flex-col items-center gap-0.5 text-zinc-300 hover:bg-zinc-800 rounded-xl hover:text-white"
            >
              <span className="text-red-400 font-extrabold text-xs">A</span>
              <span className="text-[9px] font-medium text-zinc-500">Text color</span>
            </button>

            {/* Sub palette popup of circular colors */}
            {showColorPicker && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-3 flex items-center gap-2 animate-in zoom-in-95 duration-150">
                {/* Gray, Orange, Red, Blue, Green, Light Gray */}
                {[
                  { class: 'bg-zinc-800 border-zinc-900', label: 'Dark Slate' },
                  { class: 'bg-orange-500 border-orange-600', label: 'Orange' },
                  { class: 'bg-red-500 border-red-600', label: 'Red' },
                  { class: 'bg-blue-500 border-blue-600', label: 'Blue' },
                  { class: 'bg-emerald-500 border-emerald-600', label: 'Green' },
                  { class: 'bg-zinc-700 border-zinc-600', label: 'Light' }
                ].map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Apply corresponding tailwind class based on highlight type
                      let highlightValue = '';
                      if (currentStyleType === 'background') {
                        if (col.label === 'Dark Slate') highlightValue = 'bg-zinc-800 text-white';
                        if (col.label === 'Orange') highlightValue = 'bg-orange-950/80 text-orange-200 border border-orange-800/40';
                        if (col.label === 'Red') highlightValue = 'bg-red-950/80 text-red-200 border border-red-800/40';
                        if (col.label === 'Blue') highlightValue = 'bg-blue-950/80 text-blue-200 border border-blue-800/40';
                        if (col.label === 'Green') highlightValue = 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/40';
                        if (col.label === 'Light') highlightValue = 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/40';
                      } else if (currentStyleType === 'underline') {
                        if (col.label === 'Dark Slate') highlightValue = 'border-zinc-700';
                        if (col.label === 'Orange') highlightValue = 'border-orange-500';
                        if (col.label === 'Red') highlightValue = 'border-red-500';
                        if (col.label === 'Blue') highlightValue = 'border-blue-500';
                        if (col.label === 'Green') highlightValue = 'border-emerald-500';
                        if (col.label === 'Light') highlightValue = 'border-zinc-800';
                      } else if (currentStyleType === 'wavy') {
                        if (col.label === 'Dark Slate') highlightValue = 'decoration-zinc-700';
                        if (col.label === 'Orange') highlightValue = 'decoration-orange-500';
                        if (col.label === 'Red') highlightValue = 'decoration-red-500';
                        if (col.label === 'Blue') highlightValue = 'decoration-blue-500';
                        if (col.label === 'Green') highlightValue = 'decoration-emerald-500';
                        if (col.label === 'Light') highlightValue = 'decoration-zinc-800';
                      } else if (currentStyleType === 'text-color') {
                        if (col.label === 'Dark Slate') highlightValue = 'text-zinc-300 font-semibold';
                        if (col.label === 'Orange') highlightValue = 'text-orange-400 font-semibold';
                        if (col.label === 'Red') highlightValue = 'text-red-400 font-semibold';
                        if (col.label === 'Blue') highlightValue = 'text-blue-400 font-semibold';
                        if (col.label === 'Green') highlightValue = 'text-emerald-400 font-semibold';
                        if (col.label === 'Light') highlightValue = 'text-zinc-500';
                      }
                      applyHighlightColor(highlightValue);
                    }}
                    className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${col.class}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Embedded Voice Memo & Recordings Section */}
        {showVoiceRecorder && (
          <VoiceRecorder 
            recordings={note.recordings || []}
            onAddRecording={addVoiceRecording}
            onDeleteRecording={deleteVoiceRecording}
          />
        )}
      </div>

      {/* FOOTER ACTIONS BAR */}
      {isSelectMode ? (
        /* Dark block selection floating bar exactly matching Image 2 */
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-800 p-4 flex items-center justify-between z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleBulkFormat(BlockType.TODO)}
              disabled={selectedBlockIds.length === 0}
              className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <CheckSquare size={16} />
              <span className="text-[10px] font-semibold text-zinc-500">To-dos</span>
            </button>

            <button 
              onClick={() => handleBulkFormat(BlockType.H2)}
              disabled={selectedBlockIds.length === 0}
              className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <span className="text-zinc-200 font-bold text-sm leading-none h-4">Aa</span>
              <span className="text-[10px] font-semibold text-zinc-500">Format</span>
            </button>

            <button 
              onClick={() => {
                const text = note.blocks
                  .filter(b => selectedBlockIds.includes(b.id))
                  .map(b => b.content)
                  .join('\n');
                navigator.clipboard.writeText(text);
              }}
              disabled={selectedBlockIds.length === 0}
              className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <Copy size={16} />
              <span className="text-[10px] font-semibold text-zinc-500">Copy</span>
            </button>

            <button 
              onClick={() => {
                const text = note.blocks
                  .filter(b => selectedBlockIds.includes(b.id))
                  .map(b => b.content)
                  .join('\n');
                navigator.clipboard.writeText(text);
                handleBulkDelete();
              }}
              disabled={selectedBlockIds.length === 0}
              className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <Scissors size={16} />
              <span className="text-[10px] font-semibold text-zinc-500">Cut</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full mr-1">
              {selectedBlockIds.length} selected
            </span>
            <button 
              onClick={handleBulkDelete}
              disabled={selectedBlockIds.length === 0}
              className="p-3 bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 text-zinc-400 rounded-2xl transition-all disabled:opacity-30"
              title="Delete selected blocks"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Standard write/attachment bottom bar matching Note edit footer in Image 3 */
        <div className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 border-t border-zinc-800/80 backdrop-blur-md py-3.5 px-6 flex items-center justify-between z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-5">
            {/* Format brush / gradient icon */}
            <button 
              onClick={() => {
                const active = activeBlockId || note.blocks[0].id;
                setSelectedBlockForStyle(active);
                setShowColorPicker(true);
              }}
              className="text-zinc-400 hover:text-white transition-all active:scale-95"
              title="Format text background"
            >
              <Sparkles size={20} className="text-amber-400" />
            </button>

            {/* Checklist checkbox toggler button */}
            <button 
              onClick={() => {
                const newBlock: NoteBlock = {
                  id: 'block_' + Date.now(),
                  type: BlockType.TODO,
                  content: '',
                  checked: false
                };
                updateBlocks([...note.blocks, newBlock]);
              }}
              className="text-zinc-400 hover:text-white transition-all active:scale-95"
              title="Add checkbox"
            >
              <CheckSquare size={19} />
            </button>

            {/* Font formatting size option */}
            <button 
              onClick={() => {
                const newBlock: NoteBlock = {
                  id: 'block_' + Date.now(),
                  type: BlockType.H1,
                  content: ''
                };
                updateBlocks([...note.blocks, newBlock]);
              }}
              className="text-zinc-400 hover:text-white transition-all active:scale-95 text-sm font-bold flex items-center"
              title="Add heading"
            >
              Aa
            </button>

            {/* Microphone audio voice memo trigger button */}
            <button 
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`p-1.5 rounded-xl transition-all active:scale-95 ${
                showVoiceRecorder 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Record Voice Memo"
            >
              <Mic size={19} />
            </button>

            {/* Paperclip attachment option */}
            <button 
              onClick={() => {
                // Instantly inject the Himalayan images
                const newBlock: NoteBlock = {
                  id: 'block_' + Date.now(),
                  type: BlockType.IMAGES,
                  content: '',
                  imageUrls: [SAMPLE_MOUNTAIN, SAMPLE_YAK],
                  imageLayout: 'side-by-side'
                };
                updateBlocks([...note.blocks, newBlock]);
              }}
              className="text-zinc-400 hover:text-white transition-all active:scale-95"
              title="Attach mountain & yak photos"
            >
              <Paperclip size={19} />
            </button>
          </div>

          <button
            onClick={onBack}
            className="px-5 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-full transition-all shadow-md active:scale-95"
          >
            Save Note
          </button>
        </div>
      )}
    </div>
  );
}
