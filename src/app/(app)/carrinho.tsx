// Telas: 03-carrinho · 03c-carrinho-desconto · R2-carrinho-vazio
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppBar, Badge, Banner, Button, Card, EmptyState, Icon, Screen, Stepper, Text, Thumb } from '@/components/ui';
import { useCart } from '@/features/cart/CartContext';
import { DiscountSheet } from '@/features/cart/DiscountSheet';
import { lineTotals } from '@/features/cart/pricing';
import type { CartItem } from '@/features/cart/cart';
import { formatMoney } from '@/lib/money';
import { colors, radius } from '@/theme/tokens';

export default function Carrinho() {
  const { state, dispatch, summary } = useCart();
  const [editing, setEditing] = useState<CartItem | null>(null);

  if (state.items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Carrinho" subtitle="vazio" />
        <Screen scroll={false} footer={<Button large label="Voltar para produtos" onPress={() => router.back()} />}>
          <EmptyState icon="cart" title="Nenhum item no carrinho" message="Busque ou fale o nome do produto para começar a venda." />
        </Screen>
      </View>
    );
  }

  const blocked = summary.overStock.length > 0;
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Carrinho" subtitle={`${state.items.length} produtos · ${summary.units} unidades`} />
      <Screen footer={
        <View style={{ gap: 8 }}>
          <Row label="Subtotal" value={formatMoney(summary.gross)} />
          <Row label="Descontos" value={`- ${formatMoney(summary.discount)}`} color={colors.ok} />
          <View style={styles.total}><Text variant="sheetTitle">Total</Text><Text variant="title">{formatMoney(summary.total)}</Text></View>
          <Button large label="Ir para pagamento" disabled={blocked} onPress={() => router.push('/pagamento')}
            accessibilityHint={blocked ? 'Ajuste as quantidades acima do estoque' : undefined} />
        </View>
      }>
        {state.items.map((i) => {
          const t = lineTotals(i.product.price_cents ?? 0, i.qty, i.discount);
          const over = i.availableQty !== null && i.qty > i.availableQty;
          return (
            <Card key={i.product.id} tone={over ? 'danger' : undefined} style={{ gap: 10 }}>
              <View style={styles.top}>
                <Thumb uri={i.product.photo_url} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{i.product.name}</Text>
                  {i.discount ? (
                    <View style={styles.price}>
                      <Text variant="caption" color={colors.muted} style={{ textDecorationLine: 'line-through' }}>{formatMoney(i.product.price_cents ?? 0)}</Text>
                      <Text variant="label" color={colors.ok}>{formatMoney(t.finalUnit)}</Text>
                      <Badge tone="ok" label={i.discount.type === 'percent' ? `-${i.discount.value}%` : `-${formatMoney(i.discount.value)}`} />
                    </View>
                  ) : <Text variant="label">{formatMoney(i.product.price_cents ?? 0)}</Text>}
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${i.product.name}`} hitSlop={10}
                  onPress={() => dispatch({ type: 'remove', productId: i.product.id })}>
                  <Icon name="trash" size={20} color={colors.muted} />
                </Pressable>
              </View>
              <View style={styles.actions}>
                <Stepper value={i.qty} max={i.availableQty ?? undefined} onChange={(qty) => dispatch({ type: 'setQty', productId: i.product.id, qty })} />
                <Pressable accessibilityRole="button" onPress={() => setEditing(i)} style={styles.desc}>
                  <Icon name="tag" size={20} /><Text variant="label">Desc.</Text>
                </Pressable>
                <Text variant="money" style={{ marginLeft: 'auto' }}>{formatMoney(t.total)}</Text>
              </View>
              {over ? <Text variant="badge" color={colors.danger}>Disponível: {i.availableQty}</Text> : null}
            </Card>
          );
        })}
        {summary.overStock.map((i) => (
          <Banner key={i.product.id} tone="danger" title={`${i.product.name}: só ${i.availableQty} em estoque`} message="Ajuste a quantidade para finalizar." />
        ))}
      </Screen>
      <DiscountSheet item={editing} onClose={() => setEditing(null)}
        onApply={(d) => { if (editing) dispatch({ type: 'setDiscount', productId: editing.product.id, discount: d }); setEditing(null); }} />
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return <View style={styles.row}><Text color={colors.muted}>{label}</Text><Text variant="bodyStrong" color={color}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: 12 },
  price: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  desc: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
});
