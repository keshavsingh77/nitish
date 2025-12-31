
import React from 'react';
import { VideoMetadata } from '../types';
import { ICONS } from '../constants';
import { formatTime, formatFileSize } from '../services/videoService';

interface Props {
  videos: VideoMetadata[];
  onSelect: (video: VideoMetadata) => void;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const VideoLibrary: React.FC<Props> = ({ videos, onSelect, onDelete, viewMode }) => {
  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 text-zinc-700 animate-pulse">
          <ICONS.Video size={48} />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-zinc-300 tracking-tight">Your Cinema is Empty</h3>
        <p className="text-zinc-500 max-w-sm leading-relaxed">
          Drop your favorite movies or recordings here to build your personal streaming library.
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-1 p-4 max-w-6xl mx-auto w-full">
        {videos.map((video) => (
          <div 
            key={video.id}
            onClick={() => onSelect(video)}
            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
          >
            <div className="w-40 aspect-video relative flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
              {video.thumbnail && <img src={video.thumbnail} className="w-full h-full object-cover" alt="" />}
              <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[10px] font-bold rounded">
                {formatTime(video.duration)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-zinc-200 truncate">{video.name}</h4>
              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <span>{formatFileSize(video.size)}</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
              className="p-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ICONS.Delete size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="group relative bg-zinc-900/30 rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/40 transition-all duration-500 shadow-xl"
        >
          <div className="aspect-video relative overflow-hidden cursor-pointer" onClick={() => onSelect(video)}>
            {video.thumbnail ? (
              <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={video.name}/>
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                <ICONS.Video size={48} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
               <div className="p-4 bg-blue-500 rounded-full text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <ICONS.Play size={24} fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/90 text-[10px] font-black rounded text-white tracking-widest shadow-lg border border-white/10">
              {formatTime(video.duration)}
            </div>
            {video.lastWatched > 0 && (
              <div className="absolute bottom-0 left-0 h-1 bg-zinc-700/50 w-full">
                <div className="h-full bg-blue-500" style={{ width: `${(video.lastWatched / video.duration) * 100}%` }} />
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate text-zinc-100 leading-tight" title={video.name}>{video.name}</h4>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                  <span>{formatFileSize(video.size)}</span>
                  <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                  <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(video.id); }} className="p-2 text-zinc-700 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all">
                <ICONS.Delete size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoLibrary;
