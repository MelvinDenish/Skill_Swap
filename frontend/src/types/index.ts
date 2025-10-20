export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profilePictureUrl?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability?: string;
  rating: number;
  points: number;
  level: string;
  completedSessions: number;
}

export interface Match {
  userId: string;
  name: string;
  profilePictureUrl?: string;
  matchingSkillsTheyOffer: string[];
  matchingSkillsYouOffer: string[];
  matchScore: number;
  rating: number;
  completedSessions: number;
}

export interface Session {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerProfilePicture?: string;
  skillTopic: string;
  scheduledTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string;
  isTeacher: boolean;
}
