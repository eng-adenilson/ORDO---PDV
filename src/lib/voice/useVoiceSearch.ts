import { useCallback, useState } from 'react';
import { parseVoiceQuery } from './parseQuery';

/**
 * O reconhecimento de voz é um módulo nativo que NÃO existe no Expo Go.
 * - No Expo Go: `voiceAvailable = false`, o sheet mostra orientação para o vendedor digitar.
 * - Em development build (EAS) com o plugin configurado: funciona normalmente.
 */
type Speech = typeof import('expo-speech-recognition');
let speech: Speech | null = null;
let _loadError: string | null = null;
try {
  speech = require('expo-speech-recognition') as Speech;
  // Acessa o módulo nativo para confirmar que está registrado; lança em Expo Go.
  void speech.ExpoSpeechRecognitionModule.getStateAsync;
} catch (e) {
  speech = null;
  _loadError = e instanceof Error ? e.message : 'Módulo nativo não encontrado';
}

const useSpeechRecognitionEvent: Speech['useSpeechRecognitionEvent'] = speech
  ? speech.useSpeechRecognitionEvent
  : (() => {}) as never;

/** true somente em development builds que incluem o plugin expo-speech-recognition. */
export const voiceAvailable = !!speech;
/** Motivo pelo qual o módulo de voz não está disponível, ou null se disponível. */
export const voiceUnavailableReason: string | null = _loadError;

export type VoiceState = 'idle' | 'listening' | 'done' | 'not-understood' | 'denied' | 'error';

/**
 * Busca por voz (SPEC §6). Cada `start()` APAGA a busca anterior (§4.1 do documento).
 * O resultado nunca adiciona ao carrinho sozinho — a tela mostra opções para o vendedor confirmar.
 */
export function useVoiceSearch() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<{ qty: number | null; query: string } | null>(null);

  useSpeechRecognitionEvent('start', () => setState('listening'));
  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    setTranscript(text);
    if (e.isFinal) {
      const p = parseVoiceQuery(text);
      setParsed(p);
      setState(p.query ? 'done' : 'not-understood');
    }
  });
  useSpeechRecognitionEvent('error', (e) => setState(e.error === 'not-allowed' ? 'denied' : e.error === 'no-speech' ? 'not-understood' : 'error'));

  const start = useCallback(async () => {
    setTranscript(''); setParsed(null);
    if (!speech) { setState('error'); return; }
    const ExpoSpeechRecognitionModule = speech.ExpoSpeechRecognitionModule;
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) { setState('denied'); return; }
    ExpoSpeechRecognitionModule.start({ lang: 'pt-BR', interimResults: true, continuous: false });
  }, []);

  const stop = useCallback(() => { speech?.ExpoSpeechRecognitionModule.abort(); setState('idle'); }, []);

  return { state, transcript, parsed, start, stop };
}
