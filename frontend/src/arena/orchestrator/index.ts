/**
 * Arena Orchestrator Module
 * 
 * Client and server initialization and game loop management.
 * 
 * @module orchestrator
 */

export {
  ClientOrchestrator,
  createClientOrchestrator,
  type IClientOrchestrator,
  type ClientState,
  type ClientSystems
} from './ClientOrchestrator';

export {
  ServerOrchestrator,
  createServerOrchestrator,
  type IServerOrchestrator,
  type ServerState,
  type ServerSystems
} from './ServerOrchestrator';
