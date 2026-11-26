// Telas: 03b-pagamento · 04-cadastro-rapido-cliente (sheet)
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppBar, BottomSheet, Button, Card, Icon, Screen, Text, TextField, type IconName } from '@/components/ui';
import { finalizeSale } from '@/data/repo';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { formatMoney } from '@/lib/money';
import { colors, radius } from '@/theme/tokens';
import { PAYMENT_LABEL, type PaymentMethod } from '@/types/domain';

const METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'pix', icon: 'pix' }, { id: 'dinheiro', icon: 'cash' }, { id: 'credito', icon: 'card' }, { id: 'debito', icon: 'card' },
];

export default function Pagamento() {
  const { user } = useAuth();
  const { state, dispatch, summary } = useCart();
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [customer, setCustomer] = useState<{ name: string } | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const r = await finalizeSale(state, method);
    setBusy(false);
    if (r.status === 'rejected') { Alert.alert('Não foi possível concluir', `${r.message}\nVolte ao carrinho e ajuste as quantidades.`); return; }
    dispatch({ type: 'clear' });
    router.replace({ pathname: '/venda-concluida', params: r.status === 'completed'
      ? { status: 'completed', number: String(r.saleNumber), total: String(r.totalCents), method }
      : { status: 'queued', total: String(r.totalCents), method } });
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Pagamento" />
      <Screen footer={<Button large kind="brand" label="Confirmar venda" loading={busy} onPress={confirm} />}>
        <Card style={styles.total}>
          <Text variant="label" color={colors.muted}>Total a receber</Text>
          <Text variant="display">{formatMoney(summary.total)}</Text>
        </Card>
        <Text variant="section">Forma de pagamento</Text>
        <View style={styles.grid}>
          {METHODS.map((m) => {
            const on = m.id === method;
            return (
              <Pressable key={m.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setMethod(m.id)}
                style={[styles.method, on && styles.methodOn]}>
                <Icon name={m.icon} /><Text variant="button" style={{ flex: 1 }}>{PAYMENT_LABEL[m.id]}</Text>
                {on ? <View style={styles.check}><Icon name="check" size={16} color="#FFFFFF" /></View> : null}
              </Pressable>
            );
          })}
        </View>
        <Text variant="section">Cliente (opcional)</Text>
        <Pressable accessibilityRole="button" onPress={() => setQuickOpen(true)} style={styles.customer}>
          <Icon name="user" color={colors.muted} />
          <Text variant="input" color={customer ? colors.ink : colors.muted} style={{ flex: 1 }}>{customer?.name ?? 'Buscar ou cadastrar cliente'}</Text>
          <Icon name="plus" />
        </Pressable>
        <Card style={{ gap: 6 }}>
          <Text variant="label" color={colors.muted}>{summary.units} itens · desconto {formatMoney(summary.discount)}</Text>
          <Text variant="label" color={colors.muted}>Vendedor: {user?.name}</Text>
          <Text variant="label" color={colors.ink2}>Estoque será baixado ao confirmar</Text>
        </Card>
      </Screen>
      <QuickCustomerSheet visible={quickOpen} onClose={() => setQuickOpen(false)}
        onSaved={(c) => { setCustomer(c); dispatch({ type: 'setCustomer', customerId: c.id }); setQuickOpen(false); }} />
    </View>
  );
}

/** 04 — só nome e telefone. TODO: buscar cliente existente antes de cadastrar; salvar via repo (createCustomer). */
function QuickCustomerSheet({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: (c: { id: string; name: string }) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <BottomSheet visible={visible} title="Novo cliente" subtitle="Só nome e telefone — leva 10 segundos." onClose={onClose}
      footer={<View style={{ flex: 1 }}><Button label="Salvar e usar nesta venda" disabled={!name || phone.replace(/\D/g, '').length < 10}
        onPress={() => onSaved({ id: `local-${Date.now()}`, name })} /></View>}>
      <TextField label="Nome" required value={name} onChangeText={setName} autoCapitalize="words" autoFocus />
      <TextField label="Telefone" required value={phone} onChangeText={setPhone} keyboardType="phone-pad" hint="Formato (DDD) 9 0000-0000" />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  total: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: { width: '48.5%', height: 72, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  methodOn: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.brandSoft },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  customer: { minHeight: 56, borderRadius: radius.button, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
});
