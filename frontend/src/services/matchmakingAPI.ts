import { API_BASE } from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';

interface QueueJoinResponse {
  ticket_id: string;
  position: number;
  queue_size: number;
}

interface QueueStatusResponse {
  in_queue: boolean;
  position: number | null;
  wait_seconds: number;
  estimated_wait: number | null;
  queue_size: number;
}

interface CooldownResponse {
  has_cooldown: boolean;
  remaining_seconds: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.detail || 'Request failed') as Error & { response?: { status: number; data: unknown } };
    error.response = { status: response.status, data };
    throw error;
  }

  return response.json();
}

export const matchmakingAPI = {
  /**
   * Join the matchmaking queue.
   */
  async joinQueue(gameMode: string = 'fortnite'): Promise<QueueJoinResponse> {
    return request('/matchmaking/queue', {
      method: 'POST',
      body: JSON.stringify({ game_mode: gameMode }),
    });
  },
  
  /**
   * Leave the matchmaking queue.
   */
  async leaveQueue(): Promise<{ success: boolean; message: string }> {
    return request('/matchmaking/queue', { method: 'DELETE' });
  },
  
  /**
   * Get current queue status.
   */
  async getStatus(): Promise<QueueStatusResponse> {
    return request('/matchmaking/status');
  },
  
  /**
   * Check if player has active cooldown.
   */
  async getCooldown(): Promise<CooldownResponse> {
    return request('/matchmaking/cooldown');
  },
};
