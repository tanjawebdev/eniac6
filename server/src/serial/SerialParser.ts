// ============================================
// Serial Data Parser & Validator
// Validates raw JSON from the Arduino against expected event shapes.
// Returns null for any data that doesn't match — never throws.
// ============================================

import type {
  HardwareEvent,
  PotEvent,
  ButtonEvent,
  ContactEvent,
  BananaEvent,
  NfcEvent,
} from '../../../shared/events.js';
import {
  POT_COUNT,
  CONTACT_COUNT,
  NFC_READER_COUNT,
} from '../../../shared/constants.js';

// --- Type guards for each event shape ---

function isPotEvent(data: any): data is PotEvent {
  return (
    data.type === 'pot' &&
    typeof data.id === 'number' &&
    Number.isInteger(data.id) &&
    data.id >= 0 &&
    data.id < POT_COUNT &&
    typeof data.value === 'number' &&
    Number.isInteger(data.value) &&
    data.value >= 0 &&
    data.value <= 1023
  );
}

function isButtonEvent(data: any): data is ButtonEvent {
  return (
    data.type === 'button' &&
    typeof data.id === 'number' &&
    Number.isInteger(data.id) &&
    (data.name === 'home' || data.name === 'intro') &&
    typeof data.pressed === 'boolean'
  );
}

function isContactEvent(data: any): data is ContactEvent {
  return (
    data.type === 'contact' &&
    typeof data.id === 'number' &&
    Number.isInteger(data.id) &&
    data.id >= 0 &&
    data.id < CONTACT_COUNT &&
    typeof data.active === 'boolean'
  );
}

function isBananaEvent(data: any): data is BananaEvent {
  const themes = ['pioneering', 'programming', 'recognition', 'teamwork'];
  const programmers = ['mcnulty', 'jennings', 'snyder', 'wescoff', 'bilas', 'lichterman'];
  return (
    data.type === 'banana' &&
    themes.includes(data.theme) &&
    (data.socket === 0 || data.socket === 1) &&
    typeof data.connected === 'boolean' &&
    (data.programmer === null || programmers.includes(data.programmer))
  );
}

function isNfcEvent(data: any): data is NfcEvent {
  return (
    data.type === 'nfc' &&
    typeof data.reader === 'number' &&
    Number.isInteger(data.reader) &&
    data.reader >= 0 &&
    data.reader < NFC_READER_COUNT &&
    typeof data.present === 'boolean' &&
    typeof data.uid === 'string'
  );
}

/**
 * Validate that an unknown value conforms to a HardwareEvent shape.
 * Returns the typed event or null if validation fails.
 */
export function validateHardwareEvent(data: unknown): HardwareEvent | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.type !== 'string') {
    return null;
  }

  switch (record.type) {
    case 'pot':
      return isPotEvent(record) ? record : null;
    case 'button':
      return isButtonEvent(record) ? record : null;
    case 'contact':
      return isContactEvent(record) ? record : null;
    case 'banana':
      return isBananaEvent(record) ? record : null;
    case 'nfc':
      return isNfcEvent(record) ? record : null;
    default:
      return null;
  }
}
