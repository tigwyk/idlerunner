import {
  encounterEventSchema,
  type EncounterEvent,
} from '@shared'
import { getMultiplayerApiBaseUrl } from './multiplayerApi'

export function createEncounterSocketUrl(encounterId: string) {
  const apiBaseUrl = getMultiplayerApiBaseUrl()
  const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')
  return `${wsBaseUrl}/ws/encounter/${encounterId}`
}

export function parseEncounterEvent(payload: string): EncounterEvent {
  return encounterEventSchema.parse(JSON.parse(payload))
}
