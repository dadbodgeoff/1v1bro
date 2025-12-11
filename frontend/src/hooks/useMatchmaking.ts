import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchmakingStore } from '../stores/matchmakingStore';
import { matchmakingAPI } from '../services/matchmakingAPI';
import { useAuthStore } from '../stores/authStore';

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
  selectedCategory: string | null;
  isReconnecting: boolean;
  connectionError: string | null;
  
  joinQueue: (category?: string, mapSlug?: string) => Promise<void>;
  leaveQueue: () => Promise<void>;
}

// Reconnection configuration
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS = [1000, 2000, 4000]; // Exponential backoff
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingCategoryRef = useRef<string>('fortnite');
  const pendingMapSlugRef = useRef<string>('vortex-arena');
  const reconnectAttemptsRef = useRef(0);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
  
  // Ref to track if we're in the process of joining
  const isJoiningRef = useRef(false);
  
  // Reset heartbeat timeout
  const resetHeartbeatTimeout = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    lastHeartbeatRef.current = Date.now();
    
    // Set timeout to detect dead connection
    heartbeatTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && status === 'queuing') {
        // Trigger reconnection
        wsRef.current.close();
      }
    }, HEARTBEAT_TIMEOUT);
  }, [status]);
  
  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setIsReconnecting(false);
      setConnectionError('Connection lost. Please try again.');
      reset();
      return;
    }
    
    const delay = RECONNECT_DELAYS[reconnectAttemptsRef.current] || RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
    reconnectAttemptsRef.current += 1;
    setIsReconnecting(true);
    
    setTimeout(() => {
      if (status === 'queuing' || isReconnecting) {
        connectAndJoinQueue(pendingCategoryRef.current, pendingMapSlugRef.current);
      }
    }, delay);
  }, [status, isReconnecting, reset]);
  
  // Connect to matchmaking WebSocket and handle all queue operations
  const connectAndJoinQueue = useCallback((category: string = 'fortnite', mapSlug: string = 'vortex-arena') => {
    pendingCategoryRef.current = category;
    pendingMapSlugRef.current = mapSlug;
    setSelectedCategory(category);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Already connected, just send join message with category and map
      wsRef.current.send(JSON.stringify({ type: 'queue_join', payload: { category, map_slug: mapSlug } }));
      return;
    }
    
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    isJoiningRef.current = true;
    
    // Connect to matchmaking WebSocket
    const isDev = import.meta.env.DEV;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = isDev ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/matchmaking`;
    
    // Pass token via Sec-WebSocket-Protocol header instead of query params
    // This prevents token exposure in server logs, browser history, and referrer headers
    const ws = new WebSocket(wsUrl, [`auth.${token}`]);
    wsRef.current = ws;
    
    ws.onopen = () => {
      // Check if this was a reconnection BEFORE resetting the counter
      const wasReconnecting = reconnectAttemptsRef.current > 0;
      
      // Reset reconnection state on successful connection
      reconnectAttemptsRef.current = 0;
      setIsReconnecting(false);
      setConnectionError(null);
      resetHeartbeatTimeout();
      
      // Resync state with server after reconnection
      if (wasReconnecting) {
        matchmakingAPI.getStatus().then(serverStatus => {
          if (serverStatus.in_queue && serverStatus.position !== null) {
            updateQueueStatus(serverStatus.position, serverStatus.estimated_wait, serverStatus.queue_size);
          }
        }).catch(() => {
          // Silently handle resync errors
        });
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'matchmaking_connected':
            // Connection confirmed - now join the queue with category and map
            if (isJoiningRef.current) {
              ws.send(JSON.stringify({ 
                type: 'queue_join', 
                payload: { 
                  category: pendingCategoryRef.current,
                  map_slug: pendingMapSlugRef.current 
                } 
              }));
            }
            break;
            
          case 'queue_joined': {
            const payload = message.payload as { ticket_id: string; position: number; queue_size: number };
            isJoiningRef.current = false;
            setQueuing(payload.ticket_id);
            updateQueueStatus(payload.position, null, payload.queue_size);
            break;
          }
          
          case 'queue_status': {
            const payload = message.payload as QueueStatusPayload;
            updateQueueStatus(payload.position, payload.estimated_wait, payload.queue_size);
            break;
          }
          
          case 'match_found': {
            const payload = message.payload as MatchFoundPayload;
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
            break;
          }
          
          case 'queue_cancelled':
            reset();
            break;
          
          case 'match_cancelled': {
            // Match was cancelled due to opponent disconnection
            // Stay in queue - we were re-queued by the server
            // The server will send queue_status updates
            break;
          }
          
          case 'heartbeat_ping':
            // Respond to server heartbeat
            ws.send(JSON.stringify({ type: 'heartbeat_pong' }));
            resetHeartbeatTimeout();
            break;
          
          case 'health_ping':
            // Respond to health check ping
            ws.send(JSON.stringify({ type: 'health_pong' }));
            break;
            
          case 'error': {
            const payload = message.payload as { code: string; message: string };
            isJoiningRef.current = false;
            // Check for cooldown
            if (payload.code.startsWith('QUEUE_COOLDOWN:')) {
              const remaining = parseInt(payload.code.split(':')[1], 10);
              setCooldownSeconds(remaining);
            }
            reset();
            break;
          }
        }
      } catch {
        // Silently handle parse errors
      }
    };
    
    ws.onclose = (event) => {
      isJoiningRef.current = false;
      
      // Clear heartbeat timeout
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      
      // Attempt reconnection if we were in queue and it wasn't a clean close
      if (status === 'queuing' && event.code !== 1000) {
        attemptReconnect();
      }
    };
    
    ws.onerror = () => {
      isJoiningRef.current = false;
    };
  }, [setQueuing, updateQueueStatus, setMatchFound, reset, navigate, resetHeartbeatTimeout, attemptReconnect, status]);
  
  // Cleanup WebSocket when not queuing
  useEffect(() => {
    if (status === 'idle' && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Cleanup heartbeat timeout
    return () => {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [status]);
  
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
  
  const joinQueue = useCallback(async (category: string = 'fortnite', mapSlug: string = 'vortex-arena') => {
    // Connect to WebSocket first, then join queue via WebSocket message
    // This ensures the connection is ready before we're matched
    connectAndJoinQueue(category, mapSlug);
  }, [connectAndJoinQueue]);
  
  const leaveQueue = useCallback(async () => {
    // Send leave message via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_queue' }));
    }
    // Also call REST API as backup (handles cleanup if WS disconnected)
    try {
      await matchmakingAPI.leaveQueue();
    } catch {
      // Ignore errors
    }
    reset();
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
    selectedCategory,
    isReconnecting,
    connectionError,
    joinQueue,
    leaveQueue,
  };
}
