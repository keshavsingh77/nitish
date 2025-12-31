
import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Maximize, Minimize, Settings, Plus, Trash2, Clock, 
  FileVideo, Info, MoreVertical, Check, ChevronDown, Download,
  Lock, Unlock, Search, LayoutGrid, List, PictureInPicture,
  Sun, X, Folder, Subtitles, RotateCcw, AlertCircle
} from 'lucide-react';

export const ICONS = {
  Play: <Play size={24} fill="currentColor" />,
  Pause: <Pause size={24} fill="currentColor" />,
  Back: <SkipBack size={20} fill="currentColor" />,
  Forward: <SkipForward size={20} fill="currentColor" />,
  VolumeHigh: <Volume2 size={20} />,
  VolumeMuted: <VolumeX size={20} />,
  Maximize: <Maximize size={20} />,
  Minimize: <Minimize size={20} />,
  Settings: <Settings size={20} />,
  Upload: <Plus size={20} />,
  Plus: <Plus size={20} />,
  Delete: <Trash2 size={16} />,
  Recent: <Clock size={16} />,
  Video: <FileVideo size={32} />,
  Info: <Info size={16} />,
  Menu: <MoreVertical size={18} />,
  Check: <Check size={14} />,
  ArrowDown: <ChevronDown size={14} />,
  Download: <Download size={18} />,
  Lock: <Lock size={20} />,
  Unlock: <Unlock size={20} />,
  Search: <Search size={18} />,
  Grid: <LayoutGrid size={18} />,
  List: <List size={18} />,
  PiP: <PictureInPicture size={20} />,
  Brightness: <Sun size={20} />,
  Close: <X size={20} />,
  Folder: <Folder size={20} />,
  Subtitles: <Subtitles size={20} />,
  Reset: <RotateCcw size={16} />,
  Error: <AlertCircle size={32} />
};

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
