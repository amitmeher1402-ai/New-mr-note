import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Calendar, Music } from 'lucide-react';
import { VoiceRecording } from '../types';

interface VoiceRecorderProps {
  onAddRecording: (recording: VoiceRecording) => void;
  recordings: VoiceRecording[];
  onDeleteRecording: (id: string) => void;
}

export default function VoiceRecorder({ onAddRecording, recordings, onDeleteRecording }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<{ [id: string]: number }>({});
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playTimerRef = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      Object.values(playTimerRef.current).forEach(clearInterval);
    };
  }, []);

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      // Try to get actual user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        const newRec: VoiceRecording = {
          id: 'rec_' + Date.now(),
          name: `Recording ${recordings.length + 1}`,
          duration: recordingTime || 5, // fallback if 0
          url: audioUrl,
          dateAdded: new Date().toLocaleDateString(),
        };
        onAddRecording(newRec);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access failed/denied, starting simulation:", err);
      // Fallback: Simulation mode for iframe environment
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Simulate stopping and saving a mock recording
      const simulatedDuration = recordingTime || 3;
      const newRec: VoiceRecording = {
        id: 'rec_' + Date.now(),
        name: `Voice Memo ${recordings.length + 1}`,
        duration: simulatedDuration,
        url: '', // Empty url implies mock audio
        dateAdded: new Date().toLocaleDateString(),
      };
      onAddRecording(newRec);
    }
    
    setIsRecording(false);
  };

  // Playback control
  const togglePlay = (rec: VoiceRecording) => {
    if (playingId === rec.id) {
      // Pause
      setPlayingId(null);
      if (playTimerRef.current[rec.id]) {
        clearInterval(playTimerRef.current[rec.id]);
        delete playTimerRef.current[rec.id];
      }
    } else {
      // If another recording is playing, stop it first
      if (playingId && playTimerRef.current[playingId]) {
        clearInterval(playTimerRef.current[playingId]);
        delete playTimerRef.current[playingId];
      }

      setPlayingId(rec.id);
      
      // If it's a real recording, play actual audio
      if (rec.url) {
        const audio = new Audio(rec.url);
        audio.play().catch(e => console.log("Audio playback failed", e));
        audio.onended = () => {
          setPlayingId(null);
          setPlayProgress(prev => ({ ...prev, [rec.id]: 0 }));
        };
        // sync progress
        const trackProgress = () => {
          if (audio.ended || audio.paused) return;
          setPlayProgress(prev => ({ 
            ...prev, 
            [rec.id]: (audio.currentTime / rec.duration) * 100 
          }));
          requestAnimationFrame(trackProgress);
        };
        audio.onplay = () => requestAnimationFrame(trackProgress);
      } else {
        // Simulating playback
        const startProgress = playProgress[rec.id] || 0;
        let currentProgress = startProgress >= 100 ? 0 : startProgress;
        
        setPlayProgress(prev => ({ ...prev, [rec.id]: currentProgress }));
        
        const interval = setInterval(() => {
          currentProgress += (100 / (rec.duration * 10)); // updates 10 times a second
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
            setPlayingId(null);
            delete playTimerRef.current[rec.id];
          }
          setPlayProgress(prev => ({ ...prev, [rec.id]: currentProgress }));
        }, 100);

        playTimerRef.current[rec.id] = interval;
      }
    }
  };

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 mt-6">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="font-sans font-medium text-sm text-zinc-200">Voice Recordings</h3>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
            {recordings.length} memos
          </span>
        </div>

        {/* Action Button */}
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-xs border border-red-500/30 animate-pulse"
          >
            <Square size={12} className="fill-red-400" />
            <span>Stop ({formatTime(recordingTime)})</span>
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-all text-xs border border-amber-400/20"
          >
            <Mic size={12} />
            <span>Record Voice Memo</span>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="flex flex-col items-center justify-center py-6 bg-zinc-900/40 rounded-xl border border-zinc-800/40 mb-4">
          <div className="flex items-center gap-1.5 h-8 mb-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 100 + 10}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-400 font-sans">Recording from microphone...</p>
          <span className="text-xl font-mono font-medium text-amber-400 mt-1">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
          <Volume2 size={24} className="opacity-40 mb-2" />
          <p className="text-xs font-sans text-center">No audio recordings added yet.<br />Tap 'Record Voice Memo' to attach audio notes.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {recordings.map((rec) => {
            const isPlaying = playingId === rec.id;
            const progress = playProgress[rec.id] || 0;
            return (
              <div 
                key={rec.id} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isPlaying 
                    ? 'bg-amber-400/5 border-amber-400/20' 
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  {/* Play Button */}
                  <button
                    onClick={() => togglePlay(rec)}
                    className={`p-2 rounded-full transition-all flex-shrink-0 ${
                      isPlaying 
                        ? 'bg-amber-400 text-zinc-900 scale-95' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isPlaying ? <Pause size={14} className="fill-zinc-900" /> : <Play size={14} className="fill-zinc-300 ml-0.5" />}
                  </button>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-sans font-medium text-sm text-zinc-200 truncate">
                        {rec.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {formatTime(rec.duration)}
                      </span>
                    </div>

                    {/* Waveform progress bar */}
                    <div className="relative w-full h-4 bg-zinc-950 rounded overflow-hidden flex items-center justify-between px-1">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-amber-400/10 transition-all duration-100" 
                        style={{ width: `${progress}%` }}
                      />
                      
                      {/* Fake waveforms lines */}
                      {[...Array(24)].map((_, i) => {
                        const barHeight = 20 + Math.sin(i * 0.4) * 40 + (Math.cos(i * 0.9) * 20);
                        const isBarPlayed = (i / 24) * 100 <= progress;
                        return (
                          <div 
                            key={i} 
                            className={`w-0.5 rounded-full transition-all duration-150`} 
                            style={{ 
                              height: `${Math.max(15, Math.min(100, barHeight))}%`,
                              backgroundColor: isBarPlayed ? '#fbbf24' : '#3f3f46'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">{rec.dateAdded}</span>
                  <button
                    onClick={() => onDeleteRecording(rec.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
