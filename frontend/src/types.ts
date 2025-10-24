export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  profilePictureUrl?: string | null;
  skillsOffered: string[];
  skillsWanted: string[];
  availability?: string | null;
  rating: number;
  points: number;
  level: string;
  completedSessions: number;
}

export interface Session {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerProfilePicture?: string | null;
  skillTopic: string;
  scheduledTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string | null;
  isTeacher: boolean;
}

export interface Match {
  userId: string;
  name: string;
  matchScore: number;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
}

export interface ResourceItem {
  id: string;
  ownerId?: string;
  sessionId?: string | null;
  skillName?: string | null;
  type: 'PDF' | 'IMAGE' | 'LINK';
  title?: string | null;
  description?: string | null;
  url?: string | null;
  fileKey?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string;
}
