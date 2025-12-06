/**
 * Frontend integration tests for messaging API.
 * Tests the messagesAPI client against the real backend.
 * 
 * Run with: npx vitest run src/__tests__/integration/messages.test.ts
 * Requires backend to be running on localhost:8000
 */

import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = 'http://localhost:8000/api/v1'

// Helper to make authenticated requests
async function request<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  return response.json()
}

// Helper to create test user and get token
async function createTestUser(suffix: string): Promise<{ token: string; userId: string; email: string }> {
  const email = `msg_test_${suffix}_${Date.now()}@test.com`
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'TestPass123!',
      display_name: `Test User ${suffix}`,
    }),
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(`Failed to create user: ${data.error}`)
  }
  return {
    token: data.data.access_token,
    userId: data.data.user.id,
    email,
  }
}

// Helper to create friendship between two users
async function createFriendship(token1: string, token2: string, user2Id: string): Promise<void> {
  // User 1 sends request
  const sendRes = await request<{ friendship_id: string }>('/friends/request', token1, {
    method: 'POST',
    body: JSON.stringify({ user_id: user2Id }),
  })
  if (!sendRes.success) throw new Error(`Failed to send friend request: ${sendRes.error}`)
  
  // User 2 accepts
  const acceptRes = await request(`/friends/${sendRes.data!.friendship_id}/accept`, token2, {
    method: 'POST',
  })
  if (!acceptRes.success) throw new Error(`Failed to accept friend request: ${acceptRes.error}`)
}

describe('Messages API Integration', () => {
  let user1: { token: string; userId: string; email: string }
  let user2: { token: string; userId: string; email: string }

  beforeAll(async () => {
    // Create two test users and make them friends
    user1 = await createTestUser('alice')
    user2 = await createTestUser('bob')
    await createFriendship(user1.token, user2.token, user2.userId)
  }, 30000)

  describe('GET /messages/conversations', () => {
    it('returns empty list initially', async () => {
      // Create a fresh user with no conversations
      const freshUser = await createTestUser('fresh')
      const res = await request<{ conversations: unknown[]; total_unread: number }>(
        '/messages/conversations',
        freshUser.token
      )
      
      expect(res.success).toBe(true)
      expect(res.data?.conversations).toEqual([])
      expect(res.data?.total_unread).toBe(0)
    })
  })

  describe('POST /messages/{friend_id}', () => {
    it('sends a message to a friend', async () => {
      const res = await request<{ id: string; content: string; sender_id: string }>(
        `/messages/${user2.userId}`,
        user1.token,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello from integration test!' }),
        }
      )
      
      expect(res.success).toBe(true)
      expect(res.data?.content).toBe('Hello from integration test!')
      expect(res.data?.sender_id).toBe(user1.userId)
      expect(res.data?.id).toBeDefined()
    })

    it('rejects empty messages', async () => {
      const response = await fetch(`${API_BASE}/messages/${user2.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1.token}`,
        },
        body: JSON.stringify({ content: '' }),
      })
      
      // Should return 422 validation error
      expect(response.status).toBe(422)
    })

    it('rejects messages over 500 chars', async () => {
      const response = await fetch(`${API_BASE}/messages/${user2.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1.token}`,
        },
        body: JSON.stringify({ content: 'x'.repeat(501) }),
      })
      
      // Should return 422 validation error
      expect(response.status).toBe(422)
    })

    it('rejects messages to non-friends', async () => {
      const stranger = await createTestUser('stranger')
      const res = await request(
        `/messages/${stranger.userId}`,
        user1.token,
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Hello stranger' }),
        }
      )
      
      expect(res.success).toBe(false)
    })
  })

  describe('GET /messages/{friend_id}', () => {
    it('retrieves message history', async () => {
      // Send a few messages first
      await request(`/messages/${user2.userId}`, user1.token, {
        method: 'POST',
        body: JSON.stringify({ content: 'Message 1' }),
      })
      await request(`/messages/${user1.userId}`, user2.token, {
        method: 'POST',
        body: JSON.stringify({ content: 'Message 2' }),
      })
      
      const res = await request<{ messages: Array<{ content: string }>; has_more: boolean }>(
        `/messages/${user2.userId}`,
        user1.token
      )
      
      expect(res.success).toBe(true)
      expect(res.data?.messages.length).toBeGreaterThanOrEqual(2)
      // Messages should be in chronological order
      const contents = res.data?.messages.map(m => m.content) || []
      expect(contents).toContain('Message 1')
      expect(contents).toContain('Message 2')
    })

    it('supports pagination with limit', async () => {
      const res = await request<{ messages: unknown[]; has_more: boolean }>(
        `/messages/${user2.userId}?limit=2`,
        user1.token
      )
      
      expect(res.success).toBe(true)
      expect(res.data?.messages.length).toBeLessThanOrEqual(2)
    })
  })

  describe('POST /messages/{friend_id}/read', () => {
    it('marks messages as read', async () => {
      // User 1 sends message to User 2
      await request(`/messages/${user2.userId}`, user1.token, {
        method: 'POST',
        body: JSON.stringify({ content: 'Please read this' }),
      })
      
      // Check User 2 has unread
      const beforeRes = await request<{ conversations: Array<{ unread_count: number }> }>(
        '/messages/conversations',
        user2.token
      )
      const beforeUnread = beforeRes.data?.conversations.find(c => c.unread_count > 0)
      expect(beforeUnread).toBeDefined()
      
      // User 2 marks as read
      const readRes = await request<{ marked_count: number }>(
        `/messages/${user1.userId}/read`,
        user2.token,
        { method: 'POST' }
      )
      
      expect(readRes.success).toBe(true)
      expect(readRes.data?.marked_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('GET /messages/unread/count', () => {
    it('returns total unread count', async () => {
      const res = await request<{ unread_count: number }>(
        '/messages/unread/count',
        user1.token
      )
      
      expect(res.success).toBe(true)
      expect(typeof res.data?.unread_count).toBe('number')
    })
  })

  describe('Conversations list after messaging', () => {
    it('shows conversation with last message', async () => {
      // Send a unique message
      const uniqueContent = `Unique message ${Date.now()}`
      await request(`/messages/${user2.userId}`, user1.token, {
        method: 'POST',
        body: JSON.stringify({ content: uniqueContent }),
      })
      
      const res = await request<{
        conversations: Array<{
          friend_id: string
          last_message: { content: string } | null
          unread_count: number
        }>
      }>('/messages/conversations', user1.token)
      
      expect(res.success).toBe(true)
      const conv = res.data?.conversations.find(c => c.friend_id === user2.userId)
      expect(conv).toBeDefined()
      expect(conv?.last_message?.content).toBe(uniqueContent)
    })
  })
})
