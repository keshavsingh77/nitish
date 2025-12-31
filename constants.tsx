
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Maximize, Minimize, Settings, Plus, Trash2, Clock, 
  FileVideo, Info, MoreVertical, Check, ChevronDown, Download,
  Lock, Unlock, Search, LayoutGrid, List, PictureInPicture,
  Sun, X, Folder, Subtitles, RotateCcw, AlertCircle
} from 'lucide-react';

// Exporting components directly for reliability in React 19
export const ICONS = {
  Play,
  Pause,
  Back: SkipBack,
  Forward: SkipForward,
  VolumeHigh: Volume2,
  VolumeMuted: VolumeX,
  Maximize,
  Minimize,
  Settings,
  Upload: Plus,
  Plus,
  Delete: Trash2,
  Recent: Clock,
  Video: FileVideo,
  Info,
  Menu: MoreVertical,
  Check,
  ArrowDown: ChevronDown,
  Download,
  Lock,
  Unlock,
  Search,
  Grid: LayoutGrid,
  List,
  PiP: PictureInPicture,
  Brightness: Sun,
  Close: X,
  Folder,
  Subtitles,
  Reset: RotateCcw,
  Error: AlertCircle
};

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
