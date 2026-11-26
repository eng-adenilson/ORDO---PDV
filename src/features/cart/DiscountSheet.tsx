// Tela: 03c-carrinho-desconto
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet, Button, Card, Chip, Text, TextField } from '@/components/ui';
import { formatMoney, parseMoney } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { Discount } from '@/types/domain';
import type { CartItem } from './cart';
import { lineTotals } from './pricing';

/** Desconto por item, em R$ ou %. Sem limite máximo por enquanto (§3.2 — regra futura). */
export function DiscountSheet({ item, onClose, onApply }: { item: CartItem | null; onClose: () => void; onApply: (d: Discount | null) => void }) {
  const [type, setType] = useState<Discount['type']>('percent');
  const [raw, setRaw] = useState('');
  useEffect(() => {
    if (!item) return;
    setType(item.discount?.type ?? 'percent');
    setRaw(item.discount ? (item.discount.type === 'percent' ? String(item.discount.value) : formatMoney(item.discount.value)) : '');
  }, [item]);
  if (!item) return null;

  const unit = item.product.price_cents ?? 0;
  const value = type === 'percent' ? Number(raw.replace(',', '.')) || 0 : parseMoney(raw) ?? 0;
  const t = lineTotals(unit, item.qty, value ? { type, value } : null);

  return (
    <BottomSheet visible title="Desconto no item" subtitle={`${item.product.name} · ${item.qty} un`} onClose={onClose}
      footer={<>
        <View style={{ flex: 1 }}><Button kind="ghost" label="Remover" onPress={() => onApply(null)} /></View>
        <View style={{ flex: 1 }}><Button label="Aplicar" onPress={() => onApply(value ? { type, value } : null)} /></View>
      </>}>
      <View style={styles.toggle}>
        <View style={{ flex: 1 }}><Chip label="Em R$" selected={type === 'amount'} onPress={() => setType('amount')} /></View>
        <View style={{ flex: 1 }}><Chip label="Em %" selected={type === 'percent'} onPress={() => setType('percent')} /></View>
      </View>
      <TextField label={type === 'percent' ? 'Percentual de desconto' : 'Desconto por unidade (R$)'} value={raw} onChangeText={setRaw}
        keyboardType="decimal-pad" placeholder={type === 'percent' ? 'Ex.: 10' : 'Ex.: 5,00'} autoFocus />
      <Card style={{ gap: 6 }}>
        <Row label="Preço original" value={formatMoney(unit)} strike />
        <Row label="Preço final (un)" value={formatMoney(t.finalUnit)} color={colors.ok} />
        <Row label="Economia no item" value={`- ${formatMoney(t.discount)}`} color={colors.ok} />
      </Card>
    </BottomSheet>
  );
}

function Row({ label, value, color, strike }: { label: string; value: string; color?: string; strike?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant="label" color={colors.muted}>{label}</Text>
      <Text variant="money" color={color ?? colors.muted} style={strike ? { textDecorationLine: 'line-through' } : undefined}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ toggle: { flexDirection: 'row', gap: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between' } });
