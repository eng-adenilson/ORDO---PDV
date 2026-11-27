import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, Button, Card, Icon, Text } from '@/components/ui';
import { shareXlsx } from '@/lib/export/shareFile';
import { colors } from '@/theme/tokens';

export type ExportedFile = { uri: string; name: string; size: number; detail: string } | null;

/** R9 — "Exportação pronta": nome do arquivo, resumo e compartilhar/salvar. */
export function ExportSheet({ file, onClose }: { file: ExportedFile; onClose: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (!file) return null;
  const share = async () => {
    try { const ok = await shareXlsx(file.uri); setMsg(ok ? null : `Compartilhar não está disponível neste aparelho. Arquivo salvo: ${file.name}`); }
    catch { setMsg('Não foi possível compartilhar. O arquivo continua salvo no aparelho.'); }
  };
  return (
    <BottomSheet visible title="Exportação pronta" subtitle="Planilha Excel (.xlsx) gerada neste aparelho" onClose={onClose}
      footer={<><View style={{ flex: 1 }}><Button kind="ghost" label="Fechar" onPress={onClose} /></View><View style={{ flex: 1 }}><Button label="Compartilhar" icon="download" onPress={share} /></View></>}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.okSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="download" color={colors.ok} /></View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>{file.name}</Text>
          <Text variant="caption" color={colors.muted}>{file.detail} · {(file.size / 1024).toFixed(1).replace('.', ',')} KB</Text>
        </View>
      </Card>
      {msg ? <Text variant="caption" color={colors.warn}>{msg}</Text> : null}
    </BottomSheet>
  );
}
