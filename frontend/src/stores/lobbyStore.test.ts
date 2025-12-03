import { describe, it, expect, beforeEach } from 'vitest'
import { useLobbyStore } from './lobbyStore'

describe('lobbyStore', () => {
  beforeEach(() => {
    useLobbyStore.getState().reset()
  })

  it('starts with initial state', () => {
    const state = useLobbyStore.getState()
    expect(state.lobbyId).toBeNull()
    expect(state.code).toBeNull()
    expect(state.players).toEqual([])
    expect(state.canStart).toBe(false)
    expect(state.isHost).toBe(false)
    expect(state.status).toBe('idle')
  })

  it('setLobby updates all lobby fields', () => {
    const players = [
      { id: 'p1', display_name: 'Host', is_host: true, is_ready: false },
    ]

    useLobbyStore.getState().setLobby('lobby-123', 'ABC123', players, false)

    const state = useLobbyStore.getState()
    expect(state.lobbyId).toBe('lobby-123')
    expect(state.code).toBe('ABC123')
    expect(state.players).toEqual(players)
    expect(state.canStart).toBe(false)
    expect(state.status).toBe('waiting')
  })

  it('setPlayers updates player list', () => {
    const players = [
      { id: 'p1', display_name: 'Host', is_host: true, is_ready: false },
      { id: 'p2', display_name: 'Guest', is_host: false, is_ready: false },
    ]

    useLobbyStore.getState().setPlayers(players)

    expect(useLobbyStore.getState().players).toEqual(players)
  })

  it('setCanStart updates canStart flag', () => {
    useLobbyStore.getState().setCanStart(true)
    expect(useLobbyStore.getState().canStart).toBe(true)

    useLobbyStore.getState().setCanStart(false)
    expect(useLobbyStore.getState().canStart).toBe(false)
  })

  it('reset returns to initial state', () => {
    // Set some state
    useLobbyStore.getState().setLobby('lobby-123', 'ABC123', [], true)
    useLobbyStore.getState().setIsHost(true)

    // Reset
    useLobbyStore.getState().reset()

    const state = useLobbyStore.getState()
    expect(state.lobbyId).toBeNull()
    expect(state.code).toBeNull()
    expect(state.isHost).toBe(false)
    expect(state.status).toBe('idle')
  })
})
