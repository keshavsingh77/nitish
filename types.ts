
export interface VideoMetadata {
  id: string;
  name: string;
  size: number;
  duration: number;
  type: string;
  url: string;
  thumbnail?: string;
  lastWatched: number;
  uploadDate: number;
  folder: string;
  subtitleUrl?: string;
}

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  audioBoost: number; // 1 to 2 (100% to 200%)
  playbackRate: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
  showSubtitles: boolean;
  isLocked: boolean;
}
