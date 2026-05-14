export interface Game {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  description: string;
  controls: string;
  url: string; // Iframe URL or 'local-canvas' for built-in titles
  rating?: number;
  ratingsCount?: number;
  isFavorite?: boolean;
}

export interface Review {
  id: string;
  gameId: string;
  username: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface RecommendedGame {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  achievement: string;
}
