export interface Video {
  id: string;
  title: string;
  r2Key: string;
  thumbnailKey: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  size: number; // bytes
  uploadedAt: string; // ISO date
  mimeType: "video/mp4" | "video/webm";
  views?: number;
  description?: string;
}

export interface SlideChange {
  slideNumber: number;
  timestamp: number;
}

export interface AIScore {
  totalScore: number;
  fluencyScore: number;
  fillerWordCount: number;
  fillerWordDetail: Record<string, number>;
  breakdown: {
    fillerWords: { score: number; feedback: string };
    fluency: { score: number; feedback: string };
    structure: { score: number; feedback: string };
    timeManagement: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
}

export interface PresentationSession {
  id: string;
  title: string;
  pptUrl: string;
  videoId?: string;
  slides: string[]; // array of R2 PNG URLs
  slideCount?: number;
  slideChanges: SlideChange[];
  startTime?: string;
  endTime?: string;
  score?: AIScore;
  shortCode?: string;
  uploadedAt: string;
}
