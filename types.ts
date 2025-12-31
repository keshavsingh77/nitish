
export interface VideoMetadata {
  id: string;
  name: string;
  size: number;
  duration: number;
  type: string;
  url: string;
  thumbnail?: string;
  lastWatched: number; // current time in seconds
  uploadDate: number;
}

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
}
