
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoMetadata, PlayerState } from '../types';
import { ICONS, PLAYBACK_RATES } from '../constants';
import { formatTime } from '../services/videoService';

interface Props {
  video: VideoMetadata;
  onClose?: () => void;
  onUpdateMetadata: (id: string, updates: Partial<VideoMetadata>) => void;
}

const CustomVideoPlayer: React.FC<Props> = ({ video, onClose, onUpdateMetadata }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [seekOverlay, setSeekOverlay] = useState<'back' | 'forward' | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [state, setState] = useState<PlayerState>({
    playing: false,
    currentTime: video.lastWatched || 0,
    duration: 0,
    volume: 1,
    audioBoost: 1, // 100%
    playbackRate: 1,
    isMuted: false,
    isFullscreen: false,
    buffered: 0,
    showSubtitles: !!video.subtitleUrl,
    isLocked: false
  });

  // Setup Audio Boost (Web Audio API)
  useEffect(() => {
    if (!videoRef.current) return;
    
    let audioCtx: AudioContext;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(videoRef.current);
        const gainNode = audioCtx.createGain();
        
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        audioCtxRef.current = audioCtx;
        gainNodeRef.current = gainNode;
    } catch (e) {
        console.warn("AudioContext setup failed (Likely already connected or unsupported)", e);
    }

    return () => {
      if (audioCtxRef.current) {
        // We don't necessarily want to close it if the component re-mounts quickly, 
        // but MediaElementSource can only be created once per element.
      }
    };
  }, []);

  // Sync Audio Boost
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = state.audioBoost;
    }
  }, [state.audioBoost]);

  const resetControlsTimeout = useCallback(() => {
    if (state.isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (state.playing && !isSettingsOpen) setShowControls(false);
    }, 3000);
  }, [state.playing, isSettingsOpen, state.isLocked]);

  const togglePlay = () => {
    if (state.isLocked) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    } else {
      videoRef.current.pause();
    }
  };

  const skip = (seconds: number) => {
    if (state.isLocked || !videoRef.current) return;
    videoRef.current.currentTime += seconds;
    setSeekOverlay(seconds > 0 ? 'forward' : 'back');
    setTimeout(() => setSeekOverlay(null), 600);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none group"
      onDoubleClick={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) skip(-10);
        else if (x > (rect.width * 2) / 3) skip(10);
        else toggleFullscreen();
      }}
      style={{ filter: `brightness(${brightness}%)` }}
      onMouseMove={resetControlsTimeout}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="max-w-full max-h-full"
        onPlay={() => setState(s => ({ ...s, playing: true }))}
        onPause={() => setState(s => ({ ...s, playing: false }))}
        onLoadedMetadata={() => setState(s => ({ ...s, duration: videoRef.current?.duration || 0 }))}
        onTimeUpdate={() => {
          const time = videoRef.current?.currentTime || 0;
          setState(s => ({ ...s, currentTime: time }));
          onUpdateMetadata(video.id, { lastWatched: time });
        }}
        crossOrigin="anonymous"
      >
        {video.subtitleUrl && (
          <track 
            default={state.showSubtitles} 
            kind="subtitles" 
            src={video.subtitleUrl} 
            label="English"
          />
        )}
      </video>

      {/* Lock Indicator */}
      {state.isLocked && (
        <div className="absolute inset-0 z-[100] flex items-start p-6">
          <button 
            onClick={() => { setState(s => ({...s, isLocked: false})); setShowControls(true); }}
            className="p-4 bg-blue-600/20 backdrop-blur-xl rounded-full text-blue-400 border border-blue-500/20 hover:bg-blue-600/40 transition-all"
          >
            <ICONS.Unlock size={32} />
          </button>
        </div>
      )}

      {/* Seek Overlay Animation */}
      {seekOverlay && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2 animate-ping text-blue-500">
            {seekOverlay === 'back' ? <ICONS.Back size={48} /> : <ICONS.Forward size={48} />}
            <span className="font-black">10s</span>
          </div>
        </div>
      )}

      {/* Primary UI Overlays */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-all duration-500 ${showControls && !state.isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-b from-black/90 to-transparent p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ICONS.Close size={24} /></button>
            <div className="min-w-0">
              <h2 className="text-xl font-black truncate max-w-sm text-white tracking-tighter">{video.name}</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">{video.folder}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setState(s => ({...s, showSubtitles: !s.showSubtitles}))}
              className={`p-3 rounded-xl transition-all ${state.showSubtitles ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-white/10'}`}
            >
              <ICONS.Subtitles size={20} />
            </button>
            <button onClick={() => setState(s => ({...s, isLocked: true}))} className="p-3 text-zinc-500 hover:text-white transition-all"><ICONS.Lock size={20} /></button>
          </div>
        </div>

        {/* Center Play Button */}
        {!state.playing && (
          <button onClick={togglePlay} className="m-auto p-12 bg-blue-600 rounded-full shadow-[0_0_80px_rgba(59,130,246,0.3)] hover:scale-110 transition-transform">
            <ICONS.Play size={48} fill="currentColor" />
          </button>
        )}

        {/* Bottom Bar */}
        <div className="bg-gradient-to-t from-black/95 to-transparent p-6 pt-16 space-y-6">
          
          {/* Timeline */}
          <div className="relative group/time h-8 flex items-center cursor-pointer">
             <input 
              type="range" min="0" max={state.duration || 0} step="any"
              value={state.currentTime}
              onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
              className="absolute z-30 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute h-1.5 inset-x-0 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]" style={{ width: `${(state.currentTime / (state.duration || 1)) * 100}%` }} />
            </div>
            <div className="absolute w-4 h-4 bg-white rounded-full border-4 border-blue-600 top-1/2 -translate-y-1/2 opacity-0 group-hover/time:opacity-100 transition-opacity" style={{ left: `${(state.currentTime / (state.duration || 1)) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button onClick={() => skip(-10)} className="p-2 hover:text-blue-500 transition-colors"><ICONS.Back size={24} /></button>
                <button onClick={togglePlay} className="p-4 bg-white text-black rounded-full hover:scale-105 transition-transform">
                  {state.playing ? <ICONS.Pause size={24} /> : <ICONS.Play size={24} fill="currentColor" />}
                </button>
                <button onClick={() => skip(10)} className="p-2 hover:text-blue-500 transition-colors"><ICONS.Forward size={24} /></button>
              </div>

              {/* VLC Style Volume/Boost */}
              <div className="flex items-center gap-3 group/vol bg-zinc-900/50 px-4 py-2 rounded-2xl border border-white/5">
                <ICONS.VolumeHigh size={16} className={state.audioBoost > 1 ? 'text-orange-500' : 'text-zinc-500'} />
                <input 
                  type="range" min="0" max="2" step="0.01" value={state.audioBoost}
                  onChange={(e) => setState(s => ({...s, audioBoost: parseFloat(e.target.value)}))}
                  className="w-20 h-1 accent-blue-500"
                />
                <span className={`text-[10px] font-black w-8 ${state.audioBoost > 1 ? 'text-orange-500' : 'text-zinc-400'}`}>
                  {Math.round(state.audioBoost * 100)}%
                </span>
              </div>

              <span className="text-sm font-bold tabular-nums text-zinc-400">
                {formatTime(state.currentTime)} <span className="mx-1 opacity-30">/</span> {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
               {/* Brightness */}
               <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-2 rounded-2xl border border-white/5">
                  <ICONS.Brightness size={14} className="text-zinc-500" />
                  <input 
                    type="range" min="20" max="150" value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-16 h-1 accent-orange-500"
                  />
               </div>

               <div className="relative">
                 <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
                 >
                   {state.playbackRate}x
                 </button>
                 {isSettingsOpen && (
                   <div className="absolute bottom-full right-0 mb-4 w-40 bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[110]">
                      {PLAYBACK_RATES.map(rate => (
                        <button 
                          key={rate}
                          onClick={() => {
                            if(videoRef.current) videoRef.current.playbackRate = rate;
                            setState(s => ({...s, playbackRate: rate}));
                            setIsSettingsOpen(false);
                          }}
                          className={`w-full px-5 py-3 text-left text-xs font-bold hover:bg-white/5 transition-colors ${state.playbackRate === rate ? 'text-blue-500 bg-blue-500/5' : 'text-zinc-500'}`}
                        >
                          {rate}x {state.playbackRate === rate && '•'}
                        </button>
                      ))}
                   </div>
                 )}
               </div>

               <button onClick={toggleFullscreen} className="p-2 text-zinc-500 hover:text-white transition-all">
                {state.isFullscreen ? <ICONS.Minimize size={24} /> : <ICONS.Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
