
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
    buffered: 0
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
    setTimeout(() => setSeekOverlay(null), 500);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isLocked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) skip(-10);
    else if (x > (rect.width / 3) * 2) skip(10);
    else toggleFullscreen();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch (e) {
      console.error("PiP failed", e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group flex items-center justify-center overflow-hidden select-none"
      style={{ filter: `brightness(${brightness}%)` }}
      onClick={(e) => e.target === e.currentTarget && togglePlay()}
      onDoubleClick={handleDoubleClick}
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
        onProgress={() => {
          if (videoRef.current?.buffered.length) {
            setState(s => ({ ...s, buffered: videoRef.current!.buffered.end(videoRef.current!.buffered.length - 1) }));
          }
        }}
      />

      {/* Lock Status Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-transparent flex items-start justify-start p-6 z-[60]">
          <button 
            onClick={() => { setIsLocked(false); setShowControls(true); }}
            className="p-4 bg-white/10 backdrop-blur-xl rounded-full text-white/50 hover:text-white hover:bg-white/20 border border-white/5 transition-all shadow-2xl"
          >
            {ICONS.Unlock}
          </button>
        </div>
      )}

      {/* Seek Indicators */}
      {seekOverlay && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50`}>
          <div className={`p-8 bg-blue-500/20 backdrop-blur-md rounded-full text-blue-400 animate-ping`}>
            {seekOverlay === 'back' ? ICONS.Back : ICONS.Forward}
          </div>
        </div>
      )}

      {/* Main Overlay UI */}
      <div className={`absolute inset-0 flex flex-col justify-between p-6 transition-all duration-500 ${showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-2'}`}>
        
        {/* Top Header */}
        <div className="flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 p-6">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">{ICONS.Close}</button>
            <div>
              <h2 className="text-xl font-bold truncate max-w-[200px] md:max-w-xl tracking-tight">{video.name}</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">OmniPlayer Native Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={togglePiP} className="p-3 hover:bg-white/10 rounded-xl transition-all" title="Picture-in-Picture">{ICONS.PiP}</button>
             <button onClick={() => setIsLocked(true)} className="p-3 hover:bg-white/10 rounded-xl transition-all" title="Lock Screen">{ICONS.Lock}</button>
          </div>
        </div>

        {/* Center Control (Only on hover/pause) */}
        {!state.playing && (
          <button onClick={togglePlay} className="m-auto p-10 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 text-white shadow-2xl transform hover:scale-110 transition-all duration-300">
            {ICONS.Play}
          </button>
        )}

        {/* Bottom Controls Panel */}
        <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent absolute bottom-0 left-0 right-0 p-6 space-y-6">
          
          {/* Timeline */}
          <div className="relative h-1.5 group/seek cursor-pointer">
            <input 
              type="range" min="0" max={state.duration || 0} step="any"
              value={state.currentTime}
              onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
              className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/20 transition-all" style={{ width: `${(state.buffered / state.duration) * 100}%` }} />
              <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{ width: `${(state.currentTime / state.duration) * 100}%` }} />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity border-4 border-blue-500 shadow-xl" style={{ left: `${(state.currentTime / state.duration) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button onClick={() => skip(-10)} className="p-2 hover:text-blue-400 transition-colors">{ICONS.Back}</button>
                <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                  {state.playing ? ICONS.Pause : ICONS.Play}
                </button>
                <button onClick={() => skip(10)} className="p-2 hover:text-blue-400 transition-colors">{ICONS.Forward}</button>
              </div>

              <div className="hidden md:flex items-center gap-3 group/vol">
                <button onClick={() => setState(s => ({...s, isMuted: !s.isMuted}))} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  {state.isMuted || state.volume === 0 ? ICONS.VolumeMuted : ICONS.VolumeHigh}
                </button>
                <div className="w-0 group-hover/vol:w-24 transition-all duration-500 overflow-hidden">
                  <input 
                    type="range" min="0" max="1" step="0.01" value={state.volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if(videoRef.current) videoRef.current.volume = v;
                      setState(s => ({...s, volume: v, isMuted: v === 0}));
                    }}
                    className="w-24 accent-blue-500 h-1"
                  />
                </div>
              </div>

              <div className="text-sm font-bold tabular-nums text-zinc-300">
                {formatTime(state.currentTime)} <span className="text-zinc-600 mx-1">/</span> {formatTime(state.duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Brightness Sim Slider */}
              <div className="relative group/bright flex items-center">
                 <ICONS.Brightness className="text-zinc-500 mr-2" />
                 <input 
                    type="range" min="20" max="150" value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-16 accent-orange-400 h-1 opacity-40 hover:opacity-100 transition-opacity"
                 />
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="px-4 py-2 bg-zinc-800/80 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"
                >
                  {state.playbackRate}x {ICONS.ArrowDown}
                </button>
                {isSettingsOpen && (
                  <div className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-white/5 text-[10px] uppercase tracking-tighter text-zinc-500 font-black">Speed Control</div>
                    {PLAYBACK_RATES.map(rate => (
                      <button
                        key={rate}
                        onClick={() => {
                          if(videoRef.current) videoRef.current.playbackRate = rate;
                          setState(s => ({ ...s, playbackRate: rate }));
                          setIsSettingsOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-left text-sm flex items-center justify-between hover:bg-white/10 transition-colors ${state.playbackRate === rate ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                        {state.playbackRate === rate && ICONS.Check}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="p-2 text-zinc-400 hover:text-white transition-all">
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
