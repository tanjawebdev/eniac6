import { useHardwareStore } from '../stores/hardwareStore';
import type { NfcReaderState, ThemeBananaState } from '@shared/hardware';
import type { ThemeId } from '@shared/constants';

export function usePot(id: number): number {
  return useHardwareStore((state) => state.pots[id] ?? 0);
}

export function useButton(name: 'home' | 'intro'): boolean {
  return useHardwareStore((state) => state.buttons[name]);
}

export function useContact(id: number): boolean {
  return useHardwareStore((state) => state.contacts[id] ?? false);
}

export function useThemeBanana(theme: ThemeId): ThemeBananaState {
  return useHardwareStore((state) => state.banana[theme]);
}

export function useNfc(reader: number): NfcReaderState {
  return useHardwareStore(
    (state) =>
      state.nfc[reader] ?? {
        present: false,
        uid: '',
        lastSeen: 0,
      }
  );
}

export function useAllPots(): number[] {
  return useHardwareStore((state) => state.pots);
}

export function useAllNfc(): NfcReaderState[] {
  return useHardwareStore((state) => state.nfc);
}

export function useAllBananas(): Record<ThemeId, ThemeBananaState> {
  return useHardwareStore((state) => state.banana);
}

export function useAllContacts(): boolean[] {
  return useHardwareStore((state) => state.contacts);
}
