import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Icon, Text, Thumb } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { colors, radius } from '@/theme/tokens';
import type { SaleProduct } from '@/types/domain';

/** Cartão da grade de vendas: foto, nome (2 linhas), código, preço, botão +. Sem estoque e sem custo. */
export function ProductCard({ product, onAdd }: { product: SaleProduct; onAdd: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.photo}><Thumb uri={product.photo_url} size={88} /></View>
      <Text variant="label" numberOfLines={2} style={{ minHeight: 34 }}>{product.name}</Text>
      <Text variant="caption" color={colors.muted}>{product.code}</Text>
      <View style={styles.foot}>
        <Text variant="money">{formatMoney(product.price_cents ?? 0)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Adicionar ${product.name}`} onPress={onAdd} style={styles.add}>
          <Icon name="plus" color="#FFFFFF" />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 4, padding: 8 },
  photo: { height: 88, borderRadius: radius.field, backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  add: { width: 44, height: 44, borderRadius: radius.field, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
