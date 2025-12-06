import { create } from 'zustand';

export type MatchmakingStatus = 'idle' | 'queuing' | 'match_found';

interface MatchFoundData {
  lobbyCode: string;
  opponentId: string;
  opponentName: string;
}

interface MatchmakingState {
  status: MatchmakingStatus;
  ticketId: string | null;
  queueStartTime: number | null;
  queuePosition: number | null;
  estimatedWait: number | null;
  queueSize: number;
  matchData: MatchFoundData | null;
  
  // Actions
  setQueuing: (ticketId: string) => void;
  updateQueueStatus: (position: number, estimatedWait: number | null, queueSize: number) => void;
  setMatchFound: (data: MatchFoundData) => void;
  reset: () => void;
}

export const useMatchmakingStore = create<MatchmakingState>((set) => ({
  status: 'idle',
  ticketId: null,
  queueStartTime: null,
  queuePosition: null,
  estimatedWait: null,
  queueSize: 0,
  matchData: null,
  
  setQueuing: (ticketId: string) => set({
    status: 'queuing',
    ticketId,
    queueStartTime: Date.now(),
    queuePosition: null,
    estimatedWait: null,
    matchData: null,
  }),
  
  updateQueueStatus: (position: number, estimatedWait: number | null, queueSize: number) => set({
    queuePosition: position,
    estimatedWait,
    queueSize,
  }),
  
  setMatchFound: (data: MatchFoundData) => set({
    status: 'match_found',
    matchData: data,
  }),
  
  reset: () => set({
    status: 'idle',
    ticketId: null,
    queueStartTime: null,
    queuePosition: null,
    estimatedWait: null,
    queueSize: 0,
    matchData: null,
  }),
}));
