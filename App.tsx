
import React, { useState, useEffect, useRef } from 'react';
import { VideoMetadata } from './types';
import { ICONS } from './constants';
import VideoLibrary from './components/VideoLibrary';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import { generateThumbnail } from './services/videoService';

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('omniplayer_library');
    if (saved) {
      setVideos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('omniplayer_library', JSON.stringify(videos.map(v => ({ ...v, url: '' }))));
  }, [videos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newVideos: VideoMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.floor(((i + 0.5) / files.length) * 100));
      
      const url = URL.createObjectURL(file);
      const videoEl = document.createElement('video');
      videoEl.src = url;
      
      const duration: number = await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => resolve(videoEl.duration);
      });

      const thumbnail = await generateThumbnail(file);

      newVideos.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        duration: duration,
        type: file.type,
        url: url,
        thumbnail: thumbnail,
        lastWatched: 0,
        uploadDate: Date.now()
      });
    }

    setVideos(prev => [...newVideos, ...prev]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const filteredVideos = videos.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#070707] text-zinc-100 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex w-72 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-3xl z-30">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-blue-500 flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              {ICONS.Video}
            </div>
            OMNI<span className="text-zinc-400 font-light">PRO</span>
          </h1>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          <button className="w-full flex items-center justify-between px-6 py-4 bg-blue-600/10 text-blue-400 rounded-2xl font-bold transition-all border border-blue-500/10">
            <div className="flex items-center gap-4">{ICONS.Video} All Media</div>
            <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-lg">{videos.length}</span>
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200 rounded-2xl font-bold transition-all">
            {ICONS.Recent} Recents
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200 rounded-2xl font-bold transition-all">
            {ICONS.Settings} Settings
          </button>
        </div>

        <div className="p-6">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-blue-500/50"
          >
            {ICONS.Upload} Import Files
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Modern Top Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-zinc-900/10 border-b border-white/5 backdrop-blur-md">
          <div className="flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-500 pointer-events-none group-focus-within:text-blue-500 transition-colors">
              {ICONS.Search}
            </div>
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-zinc-800/60 transition-all placeholder:text-zinc-600"
            />
          </div>
          
          <div className="flex items-center gap-3 ml-6">
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-blue-400 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {ICONS.Grid}
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-blue-400 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {ICONS.List}
              </button>
            </div>
            
            {isUploading && (
              <div className="flex items-center gap-3 px-5 py-2 bg-zinc-900 border border-white/5 rounded-2xl">
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-tighter">Processing</span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Library */}
        <div 
          className="flex-1 overflow-y-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            // Fix: Cast Array.from(e.dataTransfer.files) as File[] to prevent 'type' property access error on 'unknown'
            const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('video/'));
            if (files.length) {
              const syntheticEvent = { target: { files } } as any;
              handleFileUpload(syntheticEvent);
            }
          }}
        >
          <VideoLibrary 
            videos={filteredVideos} 
            onSelect={setSelectedVideo} 
            onDelete={(id) => setVideos(v => v.filter(item => item.id !== id))}
            viewMode={viewMode}
          />
        </div>
      </main>

      {/* Floating Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black animate-in fade-in duration-500">
          <CustomVideoPlayer 
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
            onUpdateMetadata={(id, up) => setVideos(prev => prev.map(v => v.id === id ? {...v, ...up} : v))}
          />
        </div>
      )}
    </div>
  );
};

export default App;
