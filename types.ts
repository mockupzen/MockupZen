
export interface MockupResult {
  id: string;
  imageUrl: string;
  scene: string;
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
  isFavorite?: boolean;
}

export interface MockupScene {
  id: string;
  name: string;
  prompt: string;
  category: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
