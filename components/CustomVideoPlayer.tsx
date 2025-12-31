
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

  // Handle Controls Visibility
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (state.playing && !isSettingsOpen) setShowControls(false);
    }, 3000);
  }, [state.playing, isSettingsOpen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = () => resetControlsTimeout();
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [resetControlsTimeout]);

  // Sync state with video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = video.lastWatched || 0;
    v.playbackRate = state.playbackRate;
    v.volume = state.volume;
    v.muted = state.isMuted;
  }, [video.id]); // Run only when video source changes

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
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

  const handleMetadata = () => {
    if (videoRef.current) {
      setState(s => ({ ...s, duration: videoRef.current!.duration }));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setState(s => ({ ...s, currentTime: time }));
      onUpdateMetadata(video.id, { lastWatched: time });
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const buffered = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setState(s => ({ ...s, buffered }));
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group flex items-center justify-center overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) togglePlay();
      }}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="max-w-full max-h-full"
        onPlay={() => setState(s => ({ ...s, playing: true }))}
        onPause={() => setState(s => ({ ...s, playing: false }))}
        onLoadedMetadata={handleMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onDoubleClick={toggleFullscreen}
      />

      {/* Center Play/Pause Indicator (Mobile Friendly) */}
      {!state.playing && showControls && (
        <button 
          onClick={togglePlay}
          className="absolute z-10 p-6 bg-white/10 backdrop-blur-md rounded-full text-white hover:scale-110 transition-transform"
        >
          {ICONS.Play}
        </button>
      )}

      {/* Overlay UI Controls */}
      <div className={`absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <span className="transform rotate-180 block">{ICONS.Forward}</span>
            </button>
            <h2 className="text-lg font-medium truncate max-w-[250px] md:max-w-md">{video.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full">{ICONS.Info}</button>
          </div>
        </div>

        {/* Bottom area */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="relative w-full group/progress">
            <input 
              type="range"
              min="0"
              max={state.duration || 0}
              value={state.currentTime}
              onChange={handleSeek}
              className="absolute z-20 w-full h-1.5 opacity-0 cursor-pointer"
            />
            {/* Custom Track UI */}
            <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-white/30" 
                  style={{ width: `${(state.buffered / state.duration) * 100}%` }}
                />
                <div 
                  className="absolute h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                  style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
                />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <button onClick={() => skip(-10)} className="p-1 hover:text-blue-400 transition-colors">{ICONS.Back}</button>
                <button onClick={togglePlay} className="p-1 hover:scale-110 transition-transform">
                  {state.playing ? ICONS.Pause : ICONS.Play}
                </button>
                <button onClick={() => skip(10)} className="p-1 hover:text-blue-400 transition-colors">{ICONS.Forward}</button>
              </div>

              <div className="hidden md:flex items-center gap-2 group/volume">
                <button 
                  onClick={() => setState(s => ({ ...s, isMuted: !s.isMuted }))}
                  className="p-1 hover:text-blue-400 transition-colors"
                >
                  {state.isMuted ? ICONS.VolumeMuted : ICONS.VolumeHigh}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={state.isMuted ? 0 : state.volume}
                  onChange={(e) => setState(s => ({ ...s, volume: parseFloat(e.target.value), isMuted: parseFloat(e.target.value) === 0 }))}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-blue-500 overflow-hidden"
                />
              </div>

              <span className="text-sm font-medium tabular-nums">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Playback Speed Setting */}
              <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold transition-colors"
                >
                  {state.playbackRate}x {ICONS.ArrowDown}
                </button>
                
                {isSettingsOpen && (
                  <div className="absolute bottom-full right-0 mb-4 w-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                    <div className="p-3 border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Playback Speed</div>
                    <div className="max-h-60 overflow-y-auto">
                      {PLAYBACK_RATES.map(rate => (
                        <button
                          key={rate}
                          onClick={() => {
                            setState(s => ({ ...s, playbackRate: rate }));
                            setIsSettingsOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-white/10 ${state.playbackRate === rate ? 'text-blue-400' : 'text-zinc-300'}`}
                        >
                          {rate}x
                          {state.playbackRate === rate && ICONS.Check}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={toggleFullscreen} 
                className="p-1 hover:text-blue-400 transition-colors"
              >
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
