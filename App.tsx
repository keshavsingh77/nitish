
import React, { useState, useEffect, useRef } from 'react';
import { VideoMetadata } from './types';
import { ICONS } from './constants';
import VideoLibrary from './components/VideoLibrary';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import { generateThumbnail } from './services/videoService';

const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('omniplayer_library');
    if (saved) {
      const parsed = JSON.parse(saved);
      // We don't save the actual Blobs in localStorage, so this version
      // acts as a catalog. For a real app, we'd use IndexedDB or a server.
      // For this demo, we'll ask users to upload.
      setVideos(parsed);
    }
  }, []);

  // Save metadata updates
  useEffect(() => {
    localStorage.setItem('omniplayer_library', JSON.stringify(videos.map(v => ({
      ...v,
      url: '' // Don't save transient URLs
    }))));
  }, [videos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const newVideos: VideoMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      
      setUploadProgress(30);
      
      // Extract duration using temp video element
      const videoEl = document.createElement('video');
      videoEl.src = url;
      
      const duration: number = await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => resolve(videoEl.duration);
      });

      setUploadProgress(60);
      const thumbnail = await generateThumbnail(file);

      const metadata: VideoMetadata = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        duration: duration,
        type: file.type,
        url: url,
        thumbnail: thumbnail,
        lastWatched: 0,
        uploadDate: Date.now()
      };

      newVideos.push(metadata);
    }

    setUploadProgress(100);
    setTimeout(() => {
      setVideos(prev => [...newVideos, ...prev]);
      setIsUploading(false);
      setUploadProgress(0);
    }, 500);
  };

  const updateVideoMetadata = (id: string, updates: Partial<VideoMetadata>) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => {
      const video = prev.find(v => v.id === id);
      if (video?.url) URL.revokeObjectURL(video.url);
      return prev.filter(v => v.id !== id);
    });
    if (selectedVideo?.id === id) setSelectedVideo(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-100">
      
      {/* Sidebar Navigation (Desktop) / Bottom Nav (Mobile) */}
      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 flex-shrink-0 bg-zinc-900/40 border-r border-white/5 flex flex-col z-20">
          <div className="p-6">
            <h1 className="text-2xl font-black tracking-tighter text-blue-500 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1 rounded-lg">OMNI</span>
              PLAYER
            </h1>
          </div>
          
          <div className="flex-1 px-4 py-2 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-400 rounded-xl font-semibold transition-all">
              {ICONS.Video} All Videos
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 rounded-xl font-semibold transition-all">
              {ICONS.Recent} Recents
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 rounded-xl font-semibold transition-all">
              {ICONS.Settings} Settings
            </button>
          </div>

          <div className="p-4 border-t border-white/5">
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              {ICONS.Upload} Upload New
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="video/*" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative overflow-hidden">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-zinc-900/20 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-800 px-4 py-1.5 rounded-full text-xs font-bold text-zinc-400 border border-white/5">
                {videos.length} VIDEOS
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {isUploading && (
                  <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900 border border-white/5 rounded-full">
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Processing...</span>
                  </div>
               )}
            </div>
          </header>

          {/* Library Content */}
          <div className="flex-1 overflow-y-auto">
            <VideoLibrary 
              videos={videos} 
              onSelect={setSelectedVideo} 
              onDelete={deleteVideo} 
            />
          </div>

          {/* Player Overlay (Fullscreen Mode when active) */}
          {selectedVideo && (
            <div className="fixed inset-0 z-50 bg-black animate-in fade-in zoom-in duration-300">
              <CustomVideoPlayer 
                video={selectedVideo} 
                onClose={() => setSelectedVideo(null)} 
                onUpdateMetadata={updateVideoMetadata}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
