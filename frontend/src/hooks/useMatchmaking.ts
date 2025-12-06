import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchmakingStore } from '../stores/matchmakingStore';
import { matchmakingAPI } from '../services/matchmakingAPI';
import { wsService } from '../services/websocket';

interface QueueJoinedPayload {
  ticket_id: string;
  position: number;
  queue_size: number;
}

interface QueueStatusPayload {
  elapsed: number;
  position: number;
  estimated_wait: number | null;
  queue_size: number;
}

interface MatchFoundPayload {
  lobby_code: string;
  opponent_id: string;
  opponent_name: string;
}

interface UseMatchmakingReturn {
  isInQueue: boolean;
  queueTime: number;
  queuePosition: number | null;
  estimatedWait: number | null;
  queueSize: number;
  isMatchFound: boolean;
  matchData: { lobbyCode: string; opponentName: string } | null;
  cooldownSeconds: number | null;
  
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
}

export function useMatchmaking(): UseMatchmakingReturn {
  const navigate = useNavigate();
  
  const {
    status,
    queueStartTime,
    queuePosition,
    estimatedWait,
    queueSize,
    matchData,
    setQueuing,
    updateQueueStatus,
    setMatchFound,
    reset,
  } = useMatchmakingStore();
  
  const [queueTime, setQueueTime] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Update queue time every second
  useEffect(() => {
    if (status === 'queuing' && queueStartTime) {
      timerRef.current = setInterval(() => {
        setQueueTime(Math.floor((Date.now() - queueStartTime) / 1000));
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      setQueueTime(0);
    }
  }, [status, queueStartTime]);
  
  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubQueueJoined = wsService.on('queue_joined', (data) => {
      const payload = data as QueueJoinedPayload;
      setQueuing(payload.ticket_id);
      updateQueueStatus(payload.position, null, payload.queue_size);
    });
    
    const unsubQueueStatus = wsService.on('queue_status', (data) => {
      const payload = data as QueueStatusPayload;
      updateQueueStatus(payload.position, payload.estimated_wait, payload.queue_size);
    });
    
    const unsubQueueCancelled = wsService.on('queue_cancelled', () => {
      reset();
    });
    
    const unsubMatchFound = wsService.on('match_found', (data) => {
      const payload = data as MatchFoundPayload;
      setMatchFound({
        lobbyCode: payload.lobby_code,
        opponentId: payload.opponent_id,
        opponentName: payload.opponent_name,
      });
      
      // Navigate to lobby after 3 seconds
      setTimeout(() => {
        navigate(`/lobby/${payload.lobby_code}`);
        reset();
      }, 3000);
    });
    
    return () => {
      unsubQueueJoined();
      unsubQueueStatus();
      unsubQueueCancelled();
      unsubMatchFound();
    };
  }, [setQueuing, updateQueueStatus, setMatchFound, reset, navigate]);
  
  // Check cooldown on mount
  useEffect(() => {
    const checkCooldown = async () => {
      try {
        const response = await matchmakingAPI.getCooldown();
        if (response.has_cooldown) {
          setCooldownSeconds(response.remaining_seconds);
        }
      } catch {
        // Ignore errors
      }
    };
    
    checkCooldown();
  }, []);
  
  // Countdown cooldown
  useEffect(() => {
    if (cooldownSeconds !== null && cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (cooldownSeconds === 0) {
      setCooldownSeconds(null);
    }
  }, [cooldownSeconds]);
  
  const joinQueue = useCallback(async () => {
    try {
      // Try REST API first
      const response = await matchmakingAPI.joinQueue();
      setQueuing(response.ticket_id);
      updateQueueStatus(response.position, null, response.queue_size);
    } catch (error: unknown) {
      // Check for cooldown error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosError.response?.status === 403) {
          const match = axiosError.response.data?.detail?.match(/(\d+) seconds/);
          if (match) {
            setCooldownSeconds(parseInt(match[1], 10));
          }
        }
      }
      throw error;
    }
  }, [setQueuing, updateQueueStatus]);
  
  const leaveQueue = useCallback(async () => {
    try {
      await matchmakingAPI.leaveQueue();
      reset();
    } catch {
      reset();
    }
  }, [reset]);
  
  return {
    isInQueue: status === 'queuing',
    queueTime,
    queuePosition,
    estimatedWait,
    queueSize,
    isMatchFound: status === 'match_found',
    matchData: matchData ? { lobbyCode: matchData.lobbyCode, opponentName: matchData.opponentName } : null,
    cooldownSeconds,
    joinQueue,
    leaveQueue,
  };
}
