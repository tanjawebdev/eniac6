/**
 * Sound Manager
 *
 * All state lives at MODULE scope so it survives React StrictMode
 * double-mounts and AnimatePresence keeping old scenes alive.
 *
 * Scene music and NFC events are tracked via Zustand store subscriptions
 * that fire synchronously on every state change — completely bypassing
 * React's render/effect lifecycle so no transition can ever be missed.
 */

import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { useHardwareStore } from '../stores/hardwareStore';
import { WebSocketService } from '../services/WebSocketService';
import type { SceneName } from '../types/scenes';

// ─── Constants ────────────────────────────────
const FADE_DURATION = 0.8; // seconds for crossfade
const MASTER_VOLUME = 0.6;

const AMBIENT_TRACK_URLS: Partial<Record<SceneName, string>> = {
  intro: '/sounds/intro-music.mp3',
  home:  '/sounds/home-screen.mp3',
  theme: '/sounds/detail-page.mp3',
};

const SFX_FILES = {
  cardInserted: '/sounds/card-inserted.mp3',
  cableSuccess: '/sounds/plugged-in-cable_success.mp3',
  cableNoCard:  '/sounds/plugged-in-cable_NO-card.mp3',
} as const;

const SFX_VOLUME: Partial<Record<keyof typeof SFX_FILES, number>> = {
  cableSuccess: 0.45,
};

// ─── Types ────────────────────────────────────
interface AmbientTrack {
  audio: HTMLAudioElement;
  gain: GainNode;
  /**
   * The gain level we last scheduled towards (0 or MASTER_VOLUME).
   * We track this ourselves instead of reading AudioParam.value, which
   * can return the intrinsic initial value rather than the computed
   * automation value in some browsers.
   */
  targetGain: number;
}

// ─── Module-level singletons ──────────────────
let _ctx: AudioContext | null = null;
const _tracks: Partial<Record<SceneName, AmbientTrack>> = {};
const _sfx: Partial<Record<keyof typeof SFX_FILES, HTMLAudioElement>> = {};
let _activeScene: SceneName | null = null;
let _audioReady = false;
let _subscriptionsSetup = false;

// ─── Helpers ──────────────────────────────────
function scheduleGain(track: AmbientTrack, ctx: AudioContext, target: number) {
  const now = ctx.currentTime;
  track.gain.gain.cancelScheduledValues(now);
  track.gain.gain.setValueAtTime(track.targetGain, now); // anchor from known value
  track.gain.gain.linearRampToValueAtTime(target, now + FADE_DURATION);
  track.targetGain = target;
}

function playScene(scene: SceneName) {
  if (!_ctx || !_audioReady) return;
  if (_activeScene === scene) return;

  const prev = _activeScene;
  _activeScene = scene;

  // Fade out the previous track
  if (prev) {
    const outTrack = _tracks[prev];
    if (outTrack) {
      scheduleGain(outTrack, _ctx, 0);
      const capturedPrev = prev;
      const capturedTrack = outTrack;
      setTimeout(() => {
        if (_activeScene !== capturedPrev) capturedTrack.audio.pause();
      }, FADE_DURATION * 1000 + 60);
    }
  }

  // Fade in the new track
  const inTrack = _tracks[scene];
  if (inTrack) {
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => { });
    inTrack.audio.play().catch(() => { });
    scheduleGain(inTrack, _ctx, MASTER_VOLUME);
  }
}

function playSfx(key: keyof typeof SFX_FILES) {
  if (_ctx?.state === 'suspended') _ctx.resume().catch(() => { });
  const sfx = _sfx[key];
  if (!sfx) return;
  const clone = sfx.cloneNode() as HTMLAudioElement;
  clone.volume = SFX_VOLUME[key] ?? 1;
  clone.play().catch(() => { });
}

// ─── Audio initialisation (first user gesture) ─
function initAudio() {
  if (_audioReady) return;
  _audioReady = true;

  const ctx = new AudioContext();
  _ctx = ctx;

  for (const [scene, url] of Object.entries(AMBIENT_TRACK_URLS) as [SceneName, string][]) {
    const audio = new Audio(url);
    audio.loop = true;
    audio.preload = 'auto';
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);
    _tracks[scene] = { audio, gain, targetGain: 0 };
  }

  for (const [key, url] of Object.entries(SFX_FILES) as [keyof typeof SFX_FILES, string][]) {
    const sfx = new Audio(url);
    sfx.preload = 'auto';
    _sfx[key] = sfx;
  }

  document.removeEventListener('click', initAudio);
  document.removeEventListener('keydown', initAudio);
  document.removeEventListener('touchstart', initAudio);

  // Start the scene that's active right now
  _activeScene = null;
  playScene(useAppStore.getState().currentScene);
}

// ─── Zustand subscriptions (set up once) ──────
function setupSubscriptions() {
  if (_subscriptionsSetup) return;
  _subscriptionsSetup = true;

  // Scene changes → ambient music crossfade
  useAppStore.subscribe((state, prevState) => {
    if (state.currentScene !== prevState.currentScene) {
      playScene(state.currentScene);
    }
  });

  // NFC rising edge → card-inserted SFX
  useHardwareStore.subscribe((state, prevState) => {
    state.nfc.forEach((nfc, i) => {
      if (!(prevState.nfc[i]?.present ?? false) && nfc.present) {
        playSfx('cardInserted');
      }
    });
  });

  // Banana events → cable SFX
  // Using a raw WS listener so connected:true + programmer:null is detectable
  // (the store collapses that to null, same as a disconnect)
  WebSocketService.getInstance().addHardwareEventListener((event) => {
    if (event.type !== 'banana' || !event.connected) return;
    playSfx(event.programmer !== null ? 'cableSuccess' : 'cableNoCard');
  });
}

// ─── Hook (bootstrap only) ────────────────────
export function useSoundManager() {
  useEffect(() => {
    setupSubscriptions();

    if (!_audioReady) {
      document.addEventListener('click', initAudio);
      document.addEventListener('keydown', initAudio);
      document.addEventListener('touchstart', initAudio);
    }

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);
}
