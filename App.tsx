
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

  useEffect(() => {
    const saved = localStorage.getItem('omniplayer_library');
    if (saved) {
      // Re-hydrate library. Note: URLs are not saved so we simulate a 'disconnected' state 
      // where the user must click thumbnail to 'link' if it's external, 
      // but here we keep things simple for the demo.
      setVideos(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Only save essential metadata
    const toSave = videos.map(v => ({ ...v, url: v.url.startsWith('blob:') ? '' : v.url }));
    localStorage.setItem('omniplayer_library', JSON.stringify(toSave));
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
      });

      const thumbnail = await generateThumbnail(file);
      
      // Determine folder based on simple logic
      let folder = 'Downloads';
      if (file.size > 500 * 1024 * 1024) folder = 'Movies';
      if (file.name.includes('VID')) folder = 'Camera';

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

    setVideos(prev => [...newVideos, ...prev]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const folders = ['All Media', ...new Set(videos.map(v => v.folder))];
  
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All Media' || v.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div 
      className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
      }}
    >
      {/* Drop Zone Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-blue-600/20 backdrop-blur-xl border-4 border-dashed border-blue-500 flex flex-col items-center justify-center p-10 animate-in fade-in duration-300">
           <div className="bg-blue-600 p-8 rounded-full shadow-2xl shadow-blue-500/50 mb-6">
             {ICONS.Upload}
           </div>
           <h2 className="text-4xl font-black tracking-tighter uppercase italic">Drop to Import</h2>
           <p className="text-blue-300 mt-2 font-medium tracking-wide">MP4, MKV, AVI and WebM supported</p>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="hidden lg:flex w-80 flex-col bg-zinc-900/10 border-r border-white/5 backdrop-blur-3xl z-30">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
              {ICONS.Video}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">OMNI<span className="text-blue-500">PRO</span></h1>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1 block">Media Station</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-8 overflow-y-auto pb-8">
          <div>
            <h3 className="px-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Navigation</h3>
            <div className="space-y-1">
              {folders.map(folder => (
                <button 
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${selectedFolder === folder ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg shadow-blue-500/5' : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200'}`}
                >
                  <div className="flex items-center gap-4">
                    {folder === 'All Media' ? ICONS.Video : ICONS.Folder}
                    {folder}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${selectedFolder === folder ? 'bg-blue-500/20' : 'bg-zinc-800 text-zinc-600'}`}>
                    {folder === 'All Media' ? videos.length : videos.filter(v => v.folder === folder).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
             <h3 className="px-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Library</h3>
             <button className="w-full flex items-center gap-4 px-6 py-4 text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-200 rounded-2xl font-bold transition-all">
                {ICONS.Recent} Recently Played
             </button>
          </div>
        </div>

        <div className="p-6 mt-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl shadow-white/5"
          >
            {ICONS.Upload} Import New
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        
        {/* Header Bar */}
        <header className="h-20 flex items-center justify-between px-8 bg-black/40 border-b border-white/5 backdrop-blur-md">
          <div className="flex-1 max-w-2xl relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-zinc-600 group-focus-within:text-blue-500 transition-colors">
              {ICONS.Search}
            </div>
            <input 
              type="text" 
              placeholder={`Search in ${selectedFolder}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-zinc-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-4 ml-6">
            <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-300'}`}
              >
                {ICONS.Grid}
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-600 hover:text-zinc-300'}`}
              >
                {ICONS.List}
              </button>
            </div>
            
            {isUploading && (
               <div className="px-5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" style={{ width: `${uploadProgress || 30}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Processing</span>
               </div>
            )}
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8 px-4">
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedFolder}</h2>
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-1">Total {filteredVideos.length} items</p>
                 </div>
                 {videos.length > 0 && (
                   <button 
                    onClick={() => {
                      if(confirm('Clear entire library?')) {
                        setVideos([]);
                        localStorage.removeItem('omniplayer_library');
                      }
                    }}
                    className="flex items-center gap-2 text-zinc-700 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                   >
                     {ICONS.Delete} Clear All
                   </button>
                 )}
              </div>
              
              <VideoLibrary 
                videos={filteredVideos} 
                onSelect={(v) => {
                  // If blob URL is empty (from storage), we notify user or try to restore 
                  // In this sandbox, we assume transient files for the current session.
                  if (!v.url && !v.url.startsWith('blob:')) {
                    alert('Please re-upload this file to play (Session limitation).');
                    return;
                  }
                  setSelectedVideo(v);
                }} 
                onDelete={(id) => setVideos(v => v.filter(i => i.id !== id))}
                viewMode={viewMode}
              />
           </div>
        </div>
      </main>

      {/* Fullscreen Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black animate-in fade-in zoom-in duration-500">
           <CustomVideoPlayer 
             video={selectedVideo} 
             onClose={() => setSelectedVideo(null)} 
             onUpdateMetadata={(id, up) => setVideos(prev => prev.map(v => v.id === id ? { ...v, ...up } : v))}
           />
        </div>
      )}
    </div>
  );
};

export default App;
