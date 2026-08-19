// ============================================
// Serial Data Parser — CSV Line Parser
// Parses raw CSV lines from the Arduino serial output
// into typed results. Returns null for unrecognised lines.
//
// Arduino numbering is 1-based; output events use 0-based indices.
// ============================================

import type {
  HardwareEvent,
  NfcEvent,
} from '../../../shared/events.js';
import {
  BUTTON_NAMES,
} from '../../../shared/constants.js';

// --- Parse result types ---

/**
 * Discriminated union of all possible parse results.
 *
 * 'event'         — a fully formed HardwareEvent, ready to emit.
 * 'cable'         — raw cable+socket data; needs state-dependent
 *                   resolution (NFC UID lookup) in SerialService.
 * 'cable-removed' — cable was unplugged; SerialService resolves
 *                   the previous socket from its own tracking map.
 * 'system'        — system/diagnostic line (SYSTEM, NFC_READER, etc.)
 *                   to be logged, not emitted as an event.
 */
export type ParseResult =
  | { kind: 'event'; event: HardwareEvent }
  | { kind: 'cable'; cableId: number; socketId: number }
  | { kind: 'cable-removed'; cableId: number }
  | { kind: 'system'; line: string }
  | { kind: 'ignored' }
  | null;

/**
 * Parse a single CSV line from the Arduino serial output.
 *
 * Examples:
 *   BUTTON,1,PRESSED          → ButtonEvent
 *   CONTACT,3,ACTIVE          → ContactEvent
 *   POT,5,742                 → PotEvent
 *   NFC,2,PRESENT,04A1B2C3    → NfcEvent
 *   NFC,2,REMOVED             → ignored (presence tied to contact sensor)
 *   CABLE,4,SOCKET,7          → cable result (resolved later)
 *   CABLE,4,REMOVED           → cable-removed result
 *   SYSTEM,READY              → system log
 *   NFC_READER,1,READY,...    → system log
 */
export function parseSerialLine(line: string): ParseResult {
  const parts = line.split(',');
  if (parts.length < 2) return null;

  const category = parts[0];

  switch (category) {
    case 'POT':
      return parsePot(parts);

    case 'BUTTON':
      return parseButton(parts);

    case 'CONTACT':
      return parseContact(parts);

    case 'NFC':
      return parseNfc(parts);

    case 'CABLE':
      return parseCable(parts);

    // System / diagnostic lines — pass through for logging
    case 'SYSTEM':
    case 'NFC_READER':
    case 'NFC_SYSTEM':
    case 'NFC_DEBUG':
      return { kind: 'system', line };

    default:
      return null;
  }
}

// --- Individual parsers ---

/** POT,<id 1-based>,<value 0-1023> */
function parsePot(parts: string[]): ParseResult {
  if (parts.length < 3) return null;

  const id = parseInt(parts[1], 10) - 1;
  const value = parseInt(parts[2], 10);

  if (isNaN(id) || isNaN(value)) return null;
  if (id < 0 || id > 15) return null;
  if (value < 0 || value > 1023) return null;

  return { kind: 'event', event: { type: 'pot', id, value } };
}

/** BUTTON,<id 1-based>,PRESSED|RELEASED */
function parseButton(parts: string[]): ParseResult {
  if (parts.length < 3) return null;

  const id = parseInt(parts[1], 10) - 1;
  if (isNaN(id) || id < 0 || id >= BUTTON_NAMES.length) return null;

  const pressed = parts[2] === 'PRESSED';
  const name = BUTTON_NAMES[id];

  return { kind: 'event', event: { type: 'button', id, name, pressed } };
}

/** CONTACT,<id 1-based>,ACTIVE|INACTIVE */
function parseContact(parts: string[]): ParseResult {
  if (parts.length < 3) return null;

  const id = parseInt(parts[1], 10) - 1;
  if (isNaN(id) || id < 0 || id > 5) return null;

  const active = parts[2] === 'ACTIVE';

  return { kind: 'event', event: { type: 'contact', id, active } };
}

/**
 * NFC,<reader 1-based>,PRESENT,<uid hex>
 * NFC,<reader 1-based>,REMOVED
 */
function parseNfc(parts: string[]): ParseResult {
  if (parts.length < 3) return null;

  const reader = parseInt(parts[1], 10) - 1;
  if (isNaN(reader) || reader < 0 || reader > 5) return null;

  const action = parts[2];

  if (action === 'PRESENT' && parts.length >= 4) {
    const event: NfcEvent = { type: 'nfc', reader, present: true, uid: parts[3].trim() };
    return { kind: 'event', event };
  }

  if (action === 'REMOVED') {
    // Silently ignore NFC REMOVED lines; card presence is governed by contact switches
    return { kind: 'ignored' };
  }

  return null;
}

/**
 * CABLE,<cable 1-based>,SOCKET,<socket 1-based>
 * CABLE,<cable 1-based>,REMOVED
 * CABLE,<cable 1-based>,ERROR_MULTIPLE_SOCKETS  (ignored)
 */
function parseCable(parts: string[]): ParseResult {
  if (parts.length < 3) return null;

  const cableId = parseInt(parts[1], 10) - 1;
  if (isNaN(cableId) || cableId < 0 || cableId > 5) return null;

  const action = parts[2];

  if (action === 'SOCKET' && parts.length >= 4) {
    const socketId = parseInt(parts[3], 10) - 1;
    if (isNaN(socketId) || socketId < 0 || socketId > 7) return null;
    return { kind: 'cable', cableId, socketId };
  }

  if (action === 'REMOVED') {
    return { kind: 'cable-removed', cableId };
  }

  if (action === 'ERROR_MULTIPLE_SOCKETS') {
    return { kind: 'ignored' };
  }

  return null;
}
