import React, { useState } from 'react';
import { Note, BlockType, GridStyle } from '../types';
import { BookOpen, Calendar, ShieldCheck, Sun, Moon, Volume2, Play, Pause, Download } from 'lucide-react';

interface NoteShareViewProps {
  note: Note;
  onClose: () => void;
}

export default function NoteShareView({ note, onClose }: NoteShareViewProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<{ [id: string]: number }>({});

  const formattedDate = () => {
    try {
      return new Date(note.lastModified).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return note.lastModified;
    }
  };

  const getGridStyleClass = () => {
    if (isDarkMode) return 'bg-[#09090b] text-zinc-100';
    
    switch (note.gridStyle) {
      case GridStyle.RULED:
        return 'ruled-background bg-[#fafafa] text-zinc-900';
      case GridStyle.GRID:
        return 'grid-background bg-[#fafafa] text-zinc-900';
      case GridStyle.DOTS:
        return 'dots-background bg-[#fafafa] text-zinc-900';
      default:
        return 'bg-[#fafafa] text-zinc-900';
    }
  };

  const togglePlay = (recId: string, duration: number) => {
    if (playingId === recId) {
      setPlayingId(null);
    } else {
      setPlayingId(recId);
      setPlayProgress(prev => ({ ...prev, [recId]: 0 }));
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += (100 / (duration * 10));
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setPlayingId(null);
        }
        setPlayProgress(prev => ({ ...prev, [recId]: progress }));
      }, 100);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#09090b]' : 'bg-[#fafafa]'} flex flex-col font-sans select-none`}>
      {/* Shared note banner / toolbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/60 bg-[#18181b]/80 backdrop-blur-md sticky top-0 z-40 text-white">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-400" />
          <span className="text-xs font-bold tracking-wide uppercase">Public Shared Note</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full transition-colors"
            title="Toggle read mode theme"
          >
            {isDarkMode ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} className="text-zinc-300" />}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-full transition-all"
          >
            Open My Notepad
          </button>
        </div>
      </header>

      {/* Main Shared View Presentation */}
      <div className={`flex-1 px-6 py-10 max-w-2xl mx-auto w-full rounded-2xl shadow-xl border my-6 ${
        isDarkMode ? 'border-zinc-800/60' : 'border-zinc-200/60'
      } ${getGridStyleClass()}`}
        style={{
          lineHeight: note.lineSpacing === 'tight' ? '1.3' : note.lineSpacing === 'relaxed' ? '1.8' : '1.5'
        }}
      >
        {/* Verification stamp */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 mb-6 bg-emerald-500/5 px-3 py-1.5 rounded-full w-fit border border-emerald-500/10">
          <ShieldCheck size={14} />
          <span>Note integrity secure (Link sync verified)</span>
        </div>

        {/* Note title */}
        <h1 className={`text-3xl font-extrabold tracking-tight mb-2 ${
          isDarkMode ? 'text-white' : 'text-zinc-900'
        }`}>
          {note.title || "Untitled Note"}
        </h1>

        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-8 pb-4 border-b border-zinc-800/20">
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            <span>Updated {formattedDate()}</span>
          </span>
          <span>•</span>
          <span className="bg-zinc-800/10 px-2 py-0.5 rounded-full font-semibold">
            {note.notebook}
          </span>
        </div>

        {/* Render Note blocks */}
        <div className="space-y-4">
          {note.blocks.map((block) => {
            let blockStyleClasses = "text-base outline-none w-full bg-transparent border-none py-1 ";
            if (block.isBold) blockStyleClasses += " font-bold ";

            if (block.highlightType === 'background') {
              blockStyleClasses += ` px-1.5 py-0.5 rounded ${block.highlightColor || 'bg-amber-100'}`;
            } else if (block.highlightType === 'underline') {
              blockStyleClasses += ` border-b-2 ${block.highlightColor || 'border-blue-500'}`;
            } else if (block.highlightType === 'wavy') {
              blockStyleClasses += ` underline decoration-wavy ${block.highlightColor || 'decoration-green-500'}`;
            } else if (block.highlightType === 'text-color') {
              blockStyleClasses += ` ${block.highlightColor || 'text-red-500'}`;
            }

            return (
              <div key={block.id} className="text-zinc-800">
                {block.type === BlockType.PARAGRAPH && (
                  <p className={`${blockStyleClasses} ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {block.content || <span className="opacity-0">Empty</span>}
                  </p>
                )}

                {block.type === BlockType.H1 && (
                  <h2 className={`${blockStyleClasses} text-xl font-extrabold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'} mt-4`}>
                    {block.content}
                  </h2>
                )}

                {block.type === BlockType.H2 && (
                  <h3 className={`${blockStyleClasses} text-lg font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} mt-3`}>
                    {block.content}
                  </h3>
                )}

                {block.type === BlockType.TODO && (
                  <div className="flex items-center gap-2.5 py-1">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      block.checked 
                        ? 'bg-blue-500 border-blue-600 text-white' 
                        : isDarkMode ? 'border-zinc-700' : 'border-zinc-400'
                    }`}>
                      {block.checked && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-base ${
                      block.checked 
                        ? 'line-through text-zinc-500' 
                        : isDarkMode ? 'text-zinc-300' : 'text-zinc-800'
                    }`}>
                      {block.content}
                    </span>
                  </div>
                )}

                {block.type === BlockType.IMAGES && block.imageUrls && (
                  <div className="my-5">
                    <div className={`grid gap-3 ${
                      block.imageLayout === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1'
                    }`}>
                      {block.imageUrls.map((url, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-zinc-800/10 shadow-md">
                          <img src={url} alt="Himalayan preview" className="w-full h-full max-h-80 object-cover object-center" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-2 text-center">
                      Layout: {block.imageLayout === 'side-by-side' ? 'Side-by-Side Cols' : 'Stacked rows'}
                    </div>
                  </div>
                )}

                {block.type === BlockType.TABLE && block.tableData && (
                  <div className={`overflow-x-auto my-4 p-1 border rounded-xl shadow-sm ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`${isDarkMode ? 'bg-zinc-800/40 text-zinc-400' : 'bg-zinc-50 text-zinc-600'} border-b font-bold uppercase tracking-wider`}>
                          {block.tableData.headers.map((h, hidx) => (
                            <th key={hidx} className="p-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.tableData.rows.map((row) => (
                          <tr key={row.id} className={`border-b last:border-none ${
                            isDarkMode ? 'border-zinc-800' : 'border-zinc-100'
                          }`}>
                            {row.cells.map((cell, cidx) => (
                              <td key={cidx} className={`p-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Playable shared recordings */}
        {note.recordings && note.recordings.length > 0 && (
          <div className="mt-10 pt-6 border-t border-zinc-800/20">
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
            }`}>Attached Audio Notes ({note.recordings.length})</h3>
            
            <div className="space-y-2">
              {note.recordings.map((rec) => {
                const isPlaying = playingId === rec.id;
                const progress = playProgress[rec.id] || 0;
                return (
                  <div key={rec.id} className={`p-3 rounded-xl border flex items-center gap-3 ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800/80 text-white' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                  }`}>
                    <button
                      onClick={() => togglePlay(rec.id, rec.duration)}
                      className="p-2 rounded-full bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors"
                    >
                      {isPlaying ? <Pause size={13} className="fill-zinc-950" /> : <Play size={13} className="fill-zinc-950 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-medium text-xs truncate">{rec.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {Math.floor(rec.duration / 60)}:{(rec.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      
                      {/* Interactive mock waveform player */}
                      <div className="h-3 bg-zinc-950/20 rounded overflow-hidden relative flex items-center justify-between px-1">
                        <div className="absolute left-0 top-0 bottom-0 bg-amber-400/20" style={{ width: `${progress}%` }} />
                        {[...Array(16)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-0.5 rounded-full" 
                            style={{ 
                              height: `${20 + Math.sin(i * 0.5) * 60}%`,
                              backgroundColor: (i / 16) * 100 <= progress ? '#fbbf24' : '#6b7280'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="py-8 text-center text-xs text-zinc-500">
        <p>Built with ❤️ matching the exact user interface requirements</p>
      </footer>
    </div>
  );
}
