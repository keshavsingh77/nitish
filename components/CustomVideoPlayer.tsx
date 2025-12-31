
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
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [seekOverlay, setSeekOverlay] = useState<'back' | 'forward' | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [state, setState] = useState<PlayerState>({
    playing: false,
    currentTime: video.lastWatched || 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isMuted: false,
    isFullscreen: false,
    buffered: 0,
    showSubtitles: false
  });

  const resetControlsTimeout = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (state.playing && !isSettingsOpen) setShowControls(false);
    }, 3000);
  }, [state.playing, isSettingsOpen, isLocked]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = () => resetControlsTimeout();
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [resetControlsTimeout]);

  const togglePlay = () => {
    if (isLocked) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const skip = (seconds: number) => {
    if (isLocked || !videoRef.current) return;
    videoRef.current.currentTime += seconds;
    setSeekOverlay(seconds > 0 ? 'forward' : 'back');
    setTimeout(() => setSeekOverlay(null), 600);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isLocked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) skip(-10);
    else if (x > (rect.width * 2) / 3) skip(10);
    else toggleFullscreen();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setState(s => ({ ...s, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setState(s => ({ ...s, isFullscreen: false }));
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none group"
      onDoubleClick={handleDoubleClick}
      style={{ filter: `brightness(${brightness}%)` }}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="max-w-full max-h-full"
        onPlay={() => setState(s => ({ ...s, playing: true }))}
        onPause={() => setState(s => ({ ...s, playing: false }))}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = video.lastWatched || 0;
            setState(s => ({ ...s, duration: videoRef.current!.duration }));
          }
        }}
        onTimeUpdate={() => {
          const time = videoRef.current?.currentTime || 0;
          setState(s => ({ ...s, currentTime: time }));
          onUpdateMetadata(video.id, { lastWatched: time });
        }}
        onProgress={() => {
          if (videoRef.current?.buffered.length) {
            setState(s => ({ ...s, buffered: videoRef.current!.buffered.end(videoRef.current!.buffered.length - 1) }));
          }
        }}
      />

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-[100] p-6 flex items-start">
          <button 
            onClick={() => { setIsLocked(false); setShowControls(true); }}
            className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white/40 hover:text-white border border-white/10 hover:bg-black/60 transition-all"
          >
            {ICONS.Unlock}
          </button>
        </div>
      )}

      {/* Gesture Feedback */}
      {seekOverlay && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
             <div className="p-6 bg-blue-500/20 backdrop-blur-xl rounded-full text-blue-400">
               {seekOverlay === 'back' ? ICONS.Back : ICONS.Forward}
             </div>
             <span className="text-xl font-black text-blue-400 tracking-widest">{seekOverlay === 'back' ? '-10s' : '+10s'}</span>
          </div>
        </div>
      )}

      {/* Subtitle Display (Mock) */}
      {state.showSubtitles && state.playing && (
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none">
           <span className="bg-black/80 px-4 py-1.5 rounded-lg text-white text-lg font-medium border border-white/10 backdrop-blur-sm">
             [Subtitles Enabled]
           </span>
        </div>
      )}

      {/* Primary UI Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-all duration-500 ${showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Header */}
        <div className="bg-gradient-to-b from-black/90 to-transparent p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">{ICONS.Close}</button>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate max-w-xs md:max-w-xl text-white tracking-tight">{video.name}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{video.folder}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setState(s => ({ ...s, showSubtitles: !s.showSubtitles }))}
              className={`p-3 rounded-xl transition-all ${state.showSubtitles ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-zinc-400'}`}
              title="Toggle Subtitles"
            >
              {ICONS.Subtitles}
            </button>
            <button onClick={() => setIsLocked(true)} className="p-3 hover:bg-white/10 rounded-xl text-zinc-400">{ICONS.Lock}</button>
          </div>
        </div>

        {/* Play/Pause Large Center Button */}
        {!state.playing && (
          <button 
            onClick={togglePlay} 
            className="m-auto p-8 bg-blue-600 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.4)] hover:scale-110 transition-transform text-white"
          >
            {ICONS.Play}
          </button>
        )}

        {/* Bottom Control Dock */}
        <div className="bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 space-y-4">
          
          {/* Progress Area */}
          <div className="relative group/timeline h-6 flex items-center cursor-pointer">
            <input 
              type="range" min="0" max={state.duration || 0} step="any"
              value={state.currentTime}
              onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
              className="absolute z-30 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-y-[10px] left-0 right-0 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-white/20" style={{ width: `${(state.buffered / state.duration) * 100}%` }} />
               <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" style={{ width: `${(state.currentTime / state.duration) * 100}%` }} />
            </div>
            <div className="absolute h-4 w-4 bg-white rounded-full border-4 border-blue-500 shadow-xl top-1/2 -translate-y-1/2 opacity-0 group-hover/timeline:opacity-100 transition-opacity" style={{ left: `${(state.currentTime / state.duration) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button onClick={() => skip(-10)} className="p-2 hover:text-blue-400 transition-colors">{ICONS.Back}</button>
                <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:bg-zinc-200">
                  {state.playing ? ICONS.Pause : ICONS.Play}
                </button>
                <button onClick={() => skip(10)} className="p-2 hover:text-blue-400 transition-colors">{ICONS.Forward}</button>
              </div>

              <div className="hidden md:flex items-center gap-2 group/vol">
                <button onClick={() => setState(s => ({ ...s, isMuted: !s.isMuted }))} className="p-2 text-zinc-400 hover:text-white">
                  {state.isMuted || state.volume === 0 ? ICONS.VolumeMuted : ICONS.VolumeHigh}
                </button>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    value={state.isMuted ? 0 : state.volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if(videoRef.current) videoRef.current.volume = v;
                      setState(s => ({ ...s, volume: v, isMuted: v === 0 }));
                    }}
                    className="w-20 h-1 accent-blue-500"
                  />
                  <span className="text-[10px] font-bold text-zinc-500 w-8">{Math.round((state.isMuted ? 0 : state.volume) * 100)}%</span>
                </div>
              </div>

              <span className="text-sm font-bold tabular-nums text-zinc-300">
                {formatTime(state.currentTime)} <span className="text-zinc-600 mx-1">/</span> {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-4">
                 <ICONS.Brightness className="text-zinc-500" size={16} />
                 <input 
                    type="range" min="20" max="150" value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-16 h-1 accent-orange-500"
                 />
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black tracking-widest uppercase border border-white/5"
                >
                  {state.playbackRate}x
                </button>
                {isSettingsOpen && (
                  <div className="absolute bottom-full right-0 mb-4 w-40 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                    <div className="p-3 border-b border-white/5 text-[10px] uppercase font-bold text-zinc-500">Speed</div>
                    {PLAYBACK_RATES.map(rate => (
                      <button 
                        key={rate}
                        onClick={() => {
                          if(videoRef.current) videoRef.current.playbackRate = rate;
                          setState(s => ({ ...s, playbackRate: rate }));
                          setIsSettingsOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 flex justify-between items-center ${state.playbackRate === rate ? 'text-blue-400 bg-blue-500/5' : 'text-zinc-400'}`}
                      >
                        {rate}x
                        {state.playbackRate === rate && ICONS.Check}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="p-2 text-zinc-400 hover:text-white">
                {state.isFullscreen ? ICONS.Minimize : ICONS.Maximize}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
