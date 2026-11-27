// Telas: 09b-venda-cancelar · 18-venda-cancelada
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AppBar, Badge, Banner, Button, Card, EmptyState, Icon, Screen, Text, TextField, Toast } from '@/components/ui';
import { BusinessError, cancelSale, getAvailableQty, getProduct, getSale } from '@/data/repo';
import { useCart } from '@/features/cart/CartContext';
import { formatTime, plural } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { useLoad } from '@/lib/useLoad';
import { colors, radius } from '@/theme/tokens';
import { PAYMENT_LABEL } from '@/types/domain';

export default function Venda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dispatch } = useCart();
  const { data: sale, loading, error, reload } = useLoad(() => getSale(String(id)), [id]);
  const [modal, setModal] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!sale) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Venda" />
        <Screen>
          {loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando venda…</Text>
            : <><EmptyState icon="alert" title={error ? 'Não foi possível carregar' : 'Venda não encontrada'} message={error ?? undefined} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></>}
        </Screen>
      </View>
    );
  }

  const cancelled = sale.status === 'cancelled';
  const units = sale.items.reduce((a, i) => a + i.qty, 0);

  const confirmCancel = async () => {
    if (!reason.trim()) { setReasonErr('Informe o motivo para continuar.'); return; }
    setBusy(true); setCancelErr(null);
    try {
      await cancelSale(sale.id, reason);
      setModal(false); setReason('');
      setToast(`Cancelada · ${plural(units, 'item', 'itens')} de volta ao estoque`);
      await reload();
    } catch (e) { setCancelErr(e instanceof BusinessError || e instanceof Error ? e.message : 'Não foi possível cancelar.'); }
    finally { setBusy(false); }
  };

  const redo = async () => {
    dispatch({ type: 'clear' });
    for (const it of sale.items) {
      const p = await getProduct(it.product_id);
      if (!p || !p.active) continue;
      dispatch({ type: 'add', product: { id: p.id, code: p.code, name: p.name, photo_url: p.photo_url, price_cents: p.price_cents, category_id: p.category_id }, qty: it.qty, availableQty: await getAvailableQty(p.id) });
    }
    router.push('/carrinho');
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title={`Venda #${sale.number}`} subtitle={`${formatTime(sale.created_at)} · ${sale.seller_name}`} />
      <Screen footer={cancelled
        ? <Button large kind="brand" label="Refazer venda com estes itens" onPress={redo} />
        : <Button kind="ghost" label="Cancelar venda" onPress={() => { setReason(''); setReasonErr(undefined); setCancelErr(null); setModal(true); }} />}>
        {cancelled ? (
          <View style={styles.cancelBox} accessibilityRole="alert">
            <Text variant="label" color={colors.danger}>CANCELADA às {formatTime(sale.cancelled_at ?? sale.created_at)} por {sale.cancelled_by_name ?? '—'}</Text>
            <Text variant="body" color={colors.danger}>Motivo: {sale.cancel_reason}</Text>
          </View>
        ) : null}
        <Card style={{ gap: 8 }}>
          <Info k="Vendedor" v={sale.seller_name} />
          <Info k="Cliente" v={sale.customer_name ?? 'Sem cliente'} />
          <Info k="Pagamento" v={PAYMENT_LABEL[sale.payment_method]} />
        </Card>
        <Text variant="section">Itens</Text>
        {sale.items.map((it) => (
          <Card key={it.id} style={styles.item}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" color={cancelled ? colors.muted : colors.ink}>{it.product_name}</Text>
              <Text variant="caption" color={colors.muted}>{it.qty} × {formatMoney(it.unit_price_cents)}</Text>
              {it.discount_type ? <Badge tone="ok" label={it.discount_type === 'percent' ? `-${it.discount_value}%` : `-${formatMoney(Math.round(it.discount_value ?? 0))}`} /> : null}
            </View>
            <Text variant="money" color={cancelled ? colors.muted : colors.ink}>{formatMoney(it.line_total_cents)}</Text>
          </Card>
        ))}
        <Card style={{ gap: 8 }}>
          <Info k="Subtotal" v={formatMoney(sale.gross_cents)} />
          <Info k="Descontos" v={`- ${formatMoney(sale.discount_cents)}`} color={cancelled ? colors.muted : colors.ok} />
          <View style={styles.total}>
            <Text variant="sheetTitle">Total</Text>
            <Text variant="title" color={cancelled ? colors.muted : colors.ink} style={cancelled ? { textDecorationLine: 'line-through' } : undefined}>{formatMoney(sale.total_cents)}</Text>
          </View>
        </Card>
        {!cancelled ? <Text variant="caption" color={colors.muted}>Vendas finalizadas não podem ser editadas. Para corrigir, cancele e faça uma nova venda.</Text> : null}
      </Screen>

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={styles.scrim}>
          <View style={styles.modal}>
            <View style={styles.warnIcon}><Icon name="alert" color={colors.danger} size={32} /></View>
            <Text variant="sheetTitle" style={{ textAlign: 'center' }}>Cancelar venda #{sale.number}?</Text>
            <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>Os {plural(units, 'item', 'itens')} voltam ao estoque e o valor sai do caixa do dia. O registro da venda é mantido.</Text>
            {cancelErr ? <Banner tone="danger" title={cancelErr} /> : null}
            <TextField label="Motivo do cancelamento" required value={reason} onChangeText={(s) => { setReason(s); setReasonErr(undefined); }} error={reasonErr} multiline autoFocus placeholder="Ex.: Cliente desistiu da compra" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Button kind="ghost" label="Voltar" onPress={() => setModal(false)} /></View>
              <View style={{ flex: 1 }}><Button kind="danger" label="Cancelar venda" loading={busy} onPress={confirmCancel} /></View>
            </View>
          </View>
        </View>
      </Modal>
      <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} />
    </View>
  );
}

function Info({ k, v, color }: { k: string; v: string; color?: string }) {
  return <View style={styles.info}><Text variant="label" color={colors.muted}>{k}</Text><Text variant="label" color={color ?? colors.ink}>{v}</Text></View>;
}

const styles = StyleSheet.create({
  cancelBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.button, padding: 12, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.card, borderRadius: radius.sheet, padding: 20, gap: 12 },
  warnIcon: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
});
