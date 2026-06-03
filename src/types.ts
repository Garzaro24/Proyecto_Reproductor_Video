export interface VideoComment {
  id: string;
  timestamp: number; // in seconds
  author: string;
  text: string;
  category: 'correction' | 'approval' | 'idea' | 'general';
  createdAt: string;
  avatar: string;
}

export interface VideoAsset {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  format: string; // e.g. "MP4", "WebM"
  resolution: string; // e.g. "1080p", "4K", "720p"
  fps: string; // e.g. "24fps", "30fps", "60fps"
  size: string; // e.g. "45.2 MB"
  duration: number; // in seconds, e.g. 290
  uploadedAt: string;
  projectId: string;
  description: string;
  comments: VideoComment[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  videoCount: number;
}
