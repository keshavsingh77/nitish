
import React from 'react';
import { VideoMetadata } from '../types';
import { ICONS } from '../constants';
import { formatTime, formatFileSize } from '../services/videoService';

interface Props {
  videos: VideoMetadata[];
  onSelect: (video: VideoMetadata) => void;
  onDelete: (id: string) => void;
}

const VideoLibrary: React.FC<Props> = ({ videos, onSelect, onDelete }) => {
  if (videos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-700">
          {ICONS.Video}
        </div>
        <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
        <p className="text-zinc-500 max-w-xs">Upload some videos to get started with your pro playback experience.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all duration-300 shadow-xl"
        >
          {/* Thumbnail */}
          <div 
            className="aspect-video relative overflow-hidden cursor-pointer"
            onClick={() => onSelect(video)}
          >
            {video.thumbnail ? (
              <img 
                src={video.thumbnail} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt={video.name}
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                {ICONS.Video}
              </div>
            )}
            
            {/* Time badge */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-bold rounded text-white tracking-wide">
              {formatTime(video.duration)}
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <div className="p-3 bg-blue-500 rounded-full text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                {ICONS.Play}
              </div>
            </div>

            {/* Progress indicator */}
            {video.lastWatched > 0 && (
              <div className="absolute bottom-0 left-0 h-1 bg-zinc-700 w-full">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(video.lastWatched / video.duration) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold truncate text-zinc-100" title={video.name}>
                  {video.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                  <span>{formatFileSize(video.size)}</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Remove from library"
                >
                  {ICONS.Delete}
                </button>
              </div>
            </div>
            
            {video.lastWatched > 0 && (
              <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                {ICONS.Recent} 
                <span>Resuming at {formatTime(video.lastWatched)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoLibrary;
