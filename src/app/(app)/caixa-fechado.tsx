// Tela: R6-caixa-fechado
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ResultScreen } from '@/components/ui';
import { exportDayReport } from '@/features/cash/exportReport';
import { ExportSheet, type ExportedFile } from '@/features/common/ExportSheet';
import { formatTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { colors } from '@/theme/tokens';

export default function CaixaFechado() {
  const p = useLocalSearchParams<{ expected: string; counted: string; diff: string; at: string; by: string; opening: string; cash: string }>();
  const [file, setFile] = useState<ExportedFile>(null);
  const [err, setErr] = useState(false);
  const diff = Number(p.diff);
  const exportIt = async () => {
    setErr(false);
    try { setFile(await exportDayReport({ opening_cents: Number(p.opening), expected_cents: Number(p.expected), counted_cents: Number(p.counted) })); } catch { setErr(true); }
  };
  return (
    <>
      <ResultScreen tone="brand" icon="lock" title="Caixa fechado" lines={[`Fechado às ${formatTime(p.at)} por ${p.by}`]}
        rows={[
          { label: 'Esperado', value: formatMoney(Number(p.expected)) },
          { label: 'Contado', value: formatMoney(Number(p.counted)) },
          { label: 'Diferença', value: diff === 0 ? 'Caixa confere' : `${diff < 0 ? '- ' : '+ '}${formatMoney(Math.abs(diff))}`, color: diff < 0 ? colors.danger : diff > 0 ? colors.warn : colors.ok },
        ]}
        note={err ? 'Não foi possível gerar a planilha. Tente de novo.' : undefined}
        primary={{ label: 'Concluir', onPress: () => router.dismissTo('/caixa') }}
        secondary={{ label: 'Exportar relatório Excel', onPress: exportIt }} />
      <ExportSheet file={file} onClose={() => setFile(null)} />
    </>
  );
}
