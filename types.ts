
export interface Course {
  title: string;
  description: string;
  category: string;
  instructor: string;
  rating: number;
  duration: string;
}

export interface CourseWithProgress extends Course {
  completionPercentage: number;
}

export interface SyllabusItem {
  week: number;
  title: string;
  topic: string;
}

export interface Review {
  name: string;
  rating: number;
  comment: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface CourseDetails {
  learningObjectives: string[];
  syllabus: SyllabusItem[];
  reviews: Review[];
  youtubeVideoId: string;
  quiz: QuizQuestion[];
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export interface User {
  email: string;
  role: 'student' | 'tutor';
}