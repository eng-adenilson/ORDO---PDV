// Telas: 02b-vendas-busca-por-voz · 02c-voz-ouvindo · 02d-voz-sem-quantidade · 02e-voz-nao-entendi
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, BottomSheet, Button, Card, Icon, Text, Thumb } from '@/components/ui';
import { searchProducts } from '@/data/repo';
import { formatMoney } from '@/lib/money';
import { useVoiceSearch, voiceAvailable } from '@/lib/voice/useVoiceSearch';
import { colors, radius } from '@/theme/tokens';
import type { SaleProduct } from '@/types/domain';

/** Nunca adiciona sozinho: o vendedor toca no produto certo e confirma (regra §4). */
export function VoiceSheet({ visible, onClose, onConfirm, onType }: {
  visible: boolean; onClose: () => void; onConfirm: (p: SaleProduct, qty: number) => void; onType: () => void;
}) {
  const voice = useVoiceSearch();
  const [results, setResults] = useState<SaleProduct[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) { voice.stop(); return; }
    setResults([]); setSelected(null);
    // Só inicia o reconhecimento se o módulo nativo estiver disponível (dev build).
    // No Expo Go mostramos o estado "não disponível" sem chamar start().
    if (voiceAvailable) void voice.start();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voice.state !== 'done' || !voice.parsed) return;
    searchProducts(voice.parsed.query).then((r) => { setResults(r.slice(0, 5)); setSelected(r[0]?.id ?? null); });
  }, [voice.state, voice.parsed]);

  const qty = voice.parsed?.qty ?? 1;
  const restart = () => { setResults([]); setSelected(null); void voice.start(); }; // §4.1: nova busca substitui a anterior

  // Módulo nativo ausente (Expo Go ou ambiente sem o plugin compilado).
  // Orienta o vendedor a usar a digitação sem mostrar mensagem de erro confusa.
  if (!voiceAvailable) {
    return (
      <BottomSheet visible={visible} title="Busca por voz" onClose={onClose}
        footer={<View style={{ flex: 1 }}><Button label="Digitar" icon="search" onPress={onType} /></View>}>
        <View style={styles.center}>
          <View style={[styles.ring, { backgroundColor: colors.warnSoft }]}>
            <Icon name="mic" size={40} color={colors.warn} />
          </View>
          <Text variant="section">Voz não disponível neste app</Text>
          <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
            A busca por voz funciona no app instalado via EAS.{'\n'}
            Aqui no Expo Go, use a busca por texto.
          </Text>
        </View>
      </BottomSheet>
    );
  }

  if (voice.state === 'listening' || voice.state === 'idle') {
    return (
      <BottomSheet visible={visible} title="Ouvindo…" onClose={onClose} footer={<View style={{ flex: 1 }}><Button kind="ghost" label="Cancelar" onPress={onClose} /></View>}>
        <View style={styles.center}>
          <View style={styles.ring}><View style={styles.mic}><Icon name="mic" /></View></View>
          <Text variant="caption" color={colors.muted}>{voice.transcript || 'Fale o nome e a medida. Ex.: “chapa 20”'}</Text>
        </View>
      </BottomSheet>
    );
  }

  if (voice.state !== 'done' || results.length === 0) {
    const denied = voice.state === 'denied';
    return (
      <BottomSheet visible={visible} title={denied ? 'Microfone bloqueado' : 'Não entendi'} onClose={onClose}
        footer={<>
          <View style={{ flex: 1 }}><Button kind="ghost" label="Digitar" onPress={onType} /></View>
          {!denied ? <View style={{ flex: 1 }}><Button label="Falar de novo" icon="mic" onPress={restart} /></View> : null}
        </>}>
        <View style={styles.center}>
          <View style={[styles.ring, { backgroundColor: colors.warnSoft }]}><Icon name="mic" size={40} color={colors.warn} /></View>
          <Text variant="section">{denied ? 'Permita o microfone nas configurações.' : 'Não reconheci nenhum produto.'}</Text>
          <Text variant="caption" color={colors.muted}>Fale mais perto do celular ou digite o nome.</Text>
        </View>
      </BottomSheet>
    );
  }

  const chosen = results.find((r) => r.id === selected);
  return (
    <BottomSheet visible={visible} title="Busca por voz" onClose={onClose}
      footer={<>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Falar de novo" icon="mic" onPress={restart} /></View>
        <View style={{ flex: 1 }}><Button label={qty > 1 ? `Adicionar ${qty}` : 'Adicionar'} disabled={!chosen} onPress={() => chosen && onConfirm(chosen, qty)} /></View>
      </>}>
      <View style={styles.said}>
        <View style={styles.micSmall}><Icon name="mic" /></View>
        <View><Text variant="caption" color={colors.muted}>Você disse:</Text><Text variant="section">“{voice.transcript}”</Text></View>
      </View>
      <Text variant="label" color={colors.ink2}>{voice.parsed?.qty ? 'Toque no produto certo' : 'Nenhuma quantidade falada · entra com 1'}</Text>
      {results.map((p) => (
        <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: p.id === selected }} onPress={() => setSelected(p.id)}>
          <Card tone={p.id === selected ? 'selected' : undefined} style={styles.row}>
            <Thumb uri={p.photo_url} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{p.name}</Text>
              <Text variant="caption" color={colors.muted}>{p.code} · {formatMoney(p.price_cents ?? 0)}</Text>
            </View>
            {p.id === selected && voice.parsed?.qty ? <Badge label={`Qtd ${voice.parsed.qty}`} tone="neutral" /> : null}
          </Card>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  ring: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  said: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.brandSoft, padding: 12, borderRadius: radius.card },
  micSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
});
