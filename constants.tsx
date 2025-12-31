
import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Maximize, Minimize, Settings, Plus, Trash2, Clock, 
  FileVideo, Info, MoreVertical, Check, ChevronDown, Download
} from 'lucide-react';

export const ICONS = {
  Play: <Play size={20} fill="currentColor" />,
  Pause: <Pause size={20} fill="currentColor" />,
  Back: <SkipBack size={20} fill="currentColor" />,
  Forward: <SkipForward size={20} fill="currentColor" />,
  VolumeHigh: <Volume2 size={20} />,
  VolumeMuted: <VolumeX size={20} />,
  Maximize: <Maximize size={20} />,
  Minimize: <Minimize size={20} />,
  Settings: <Settings size={18} />,
  Upload: <Plus size={20} />,
  Delete: <Trash2 size={16} />,
  Recent: <Clock size={16} />,
  Video: <FileVideo size={32} />,
  Info: <Info size={16} />,
  Menu: <MoreVertical size={18} />,
  Check: <Check size={14} />,
  ArrowDown: <ChevronDown size={14} />,
  Download: <Download size={18} />
};

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
