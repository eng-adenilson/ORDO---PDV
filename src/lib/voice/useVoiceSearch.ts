import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useState } from 'react';
import { parseVoiceQuery } from './parseQuery';

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
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) { setState('denied'); return; }
    ExpoSpeechRecognitionModule.start({ lang: 'pt-BR', interimResults: true, continuous: false });
  }, []);

  const stop = useCallback(() => { ExpoSpeechRecognitionModule.abort(); setState('idle'); }, []);

  return { state, transcript, parsed, start, stop };
}
