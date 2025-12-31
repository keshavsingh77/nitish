
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
  const [selectedFolder, setSelectedFolder] = useState<string>('All Media');
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('omniplayer_library');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        // Clean stale blob URLs - browser invalidates them on reload
        setVideos(items.map((v: VideoMetadata) => ({ ...v, url: '' })));
      } catch (e) {
        console.error("Failed to load library", e);
      }
    }
  }, []);

  useEffect(() => {
    // Only save essential metadata, blanking out the transient blob URL
    localStorage.setItem('omniplayer_library', JSON.stringify(videos.map(v => ({ ...v, url: '' }))));
  }, [videos]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setIsUploading(true);
    const newVideos: VideoMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/')) continue;
      
      setUploadProgress(Math.floor((i / files.length) * 100));
      
      const url = URL.createObjectURL(file);
      const videoEl = document.createElement('video');
      videoEl.src = url;
      
      const duration: number = await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => resolve(videoEl.duration);
        videoEl.onerror = () => resolve(0);
      });

      const thumbnail = await generateThumbnail(file);
      const folder = file.size > 500000000 ? 'Movies' : file.name.includes('VID') ? 'Camera' : 'Downloads';

      newVideos.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        duration,
        type: file.type,
        url,
        thumbnail,
        lastWatched: 0,
        uploadDate: Date.now(),
        folder
      });
    }

    setVideos(prev => {
      const unique = [...newVideos, ...prev].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      return unique;
    });
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedVideo) {
      const url = URL.createObjectURL(file);
      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? { ...v, subtitleUrl: url } : v));
      setSelectedVideo(prev => prev ? { ...prev, subtitleUrl: url } : null);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All Media' || v.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const folders = ['All Media', ...new Set(videos.map(v => v.folder))];

  return (
    <div 
      className="flex h-screen bg-black text-zinc-100 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-blue-600/30 backdrop-blur-3xl border-4 border-dashed border-blue-500/50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-300">
           <ICONS.Plus size={64} className="text-white animate-bounce" />
           <h2 className="text-3xl font-black mt-4 uppercase tracking-tighter">Drop to Import Media</h2>
        </div>
      )}

      {/* Sidebar */}
      <nav className="hidden lg:flex w-72 flex-col bg-zinc-950 border-r border-white/5 z-30">
        <div className="p-8">
           <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">OMNI<span className="text-white not-italic">PRO</span></h1>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {folders.map(folder => (
            <button 
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${selectedFolder === folder ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
              <div className="flex items-center gap-4">
                {folder === 'All Media' ? <ICONS.Video size={20} /> : <ICONS.Folder size={20} />}
                <span className="truncate">{folder}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <ICONS.Upload size={16} /> Import Files
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000]">
        <header className="h-20 flex items-center justify-between px-8 bg-zinc-950/50 border-b border-white/5 backdrop-blur-xl">
           <div className="flex-1 max-w-xl relative group">
              <ICONS.Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search media library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
           </div>

           <div className="flex items-center gap-4 ml-6">
              <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/10">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><ICONS.Grid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><ICONS.List size={18} /></button>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedFolder}</h2>
                 {videos.some(v => !v.url) && (
                   <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                     Some files need re-linking (Click to add)
                   </p>
                 )}
              </div>

              <VideoLibrary 
                videos={filteredVideos} 
                onSelect={(v) => {
                  if (!v.url) {
                    fileInputRef.current?.click();
                    return;
                  }
                  setSelectedVideo(v);
                }}
                onDelete={(id) => setVideos(prev => prev.filter(v => v.id !== id))}
                viewMode={viewMode}
              />
           </div>
        </div>
      </main>

      {/* Video Player & Subtitle Logic */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black">
           <CustomVideoPlayer 
             video={selectedVideo} 
             onClose={() => setSelectedVideo(null)} 
             onUpdateMetadata={(id, up) => setVideos(prev => prev.map(v => v.id === id ? {...v, ...up} : v))}
           />
           {/* Floating Subtitle Button in player */}
           <div className="absolute top-20 right-6 z-[110] flex flex-col gap-2">
              <button 
                onClick={() => subInputRef.current?.click()}
                className="p-3 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white"
                title="Add External Subtitles"
              >
                <ICONS.Plus size={20} />
              </button>
              <input ref={subInputRef} type="file" accept=".srt,.vtt" className="hidden" onChange={handleSubtitleUpload} />
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
