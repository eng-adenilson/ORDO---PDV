// Telas: 03b-pagamento · 04-cadastro-rapido-cliente (sheet)
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppBar, BottomSheet, Button, Card, Icon, Screen, Text, TextField, type IconName } from '@/components/ui';
import { finalizeSale, searchCustomers } from '@/data/repo';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { Avatar } from '@/features/common/Avatar';
import { SearchBox } from '@/features/common/SearchBox';
import { useNewCustomer } from '@/features/customers/useNewCustomer';
import { formatMoney } from '@/lib/money';
import { colors, radius } from '@/theme/tokens';
import { PAYMENT_LABEL, type CustomerRow, type PaymentMethod } from '@/types/domain';

const METHODS: { id: PaymentMethod; icon: IconName }[] = [
  { id: 'pix', icon: 'pix' }, { id: 'dinheiro', icon: 'cash' }, { id: 'credito', icon: 'card' }, { id: 'debito', icon: 'card' },
];

export default function Pagamento() {
  const { user } = useAuth();
  const { state, dispatch, summary } = useCart();
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await finalizeSale(state, method);
      if (r.status === 'rejected') { Alert.alert('Não foi possível concluir', `${r.message}\nVolte ao carrinho e ajuste as quantidades.`); return; }
      dispatch({ type: 'clear' });
      router.replace({ pathname: '/venda-concluida', params: r.status === 'completed'
        ? { status: 'completed', id: r.saleId, number: String(r.saleNumber), total: String(r.totalCents), method }
        : { status: 'queued', total: String(r.totalCents), method } });
    } catch {
      Alert.alert('Não foi possível concluir', 'Ocorreu um erro ao salvar a venda. Tente de novo.');
    } finally { setBusy(false); }
  };

  const choose = (c: { id: string; name: string } | null) => { setCustomer(c); dispatch({ type: 'setCustomer', customerId: c?.id ?? null }); setPickerOpen(false); };

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
        <Pressable accessibilityRole="button" accessibilityLabel="Escolher cliente" onPress={() => setPickerOpen(true)} style={styles.customer}>
          <Icon name="user" color={colors.muted} />
          <Text variant="input" color={customer ? colors.ink : colors.muted} style={{ flex: 1 }}>{customer?.name ?? 'Buscar ou cadastrar cliente'}</Text>
          {customer
            ? <Pressable accessibilityRole="button" accessibilityLabel="Remover cliente da venda" onPress={() => choose(null)} style={styles.clear}><Icon name="close" color={colors.muted} /></Pressable>
            : <Icon name="plus" />}
        </Pressable>
        <Card style={{ gap: 6 }}>
          <Text variant="label" color={colors.muted}>{summary.units} itens · desconto {formatMoney(summary.discount)}</Text>
          <Text variant="label" color={colors.muted}>Vendedor: {user?.name}</Text>
          <Text variant="label" color={colors.ink2}>Estoque será baixado ao confirmar</Text>
        </Card>
      </Screen>
      <CustomerSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={choose} />
    </View>
  );
}

/** 04 — busca cliente existente; se não houver, cadastro rápido só com nome e telefone. */
function CustomerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (c: { id: string; name: string }) => void }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<CustomerRow[]>([]);
  const [creating, setCreating] = useState(false);
  const form = useNewCustomer((c) => { setCreating(false); onPick({ id: c.id, name: c.name }); });

  useEffect(() => {
    if (!visible) { setQ(''); setCreating(false); return; }
    let alive = true;
    const id = setTimeout(() => { searchCustomers(q).then((r) => { if (alive) setList(r.slice(0, 5)); }).catch(() => { if (alive) setList([]); }); }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [q, visible]);

  if (creating) {
    return (
      <BottomSheet visible={visible} title="Novo cliente" subtitle="Só nome e telefone — leva 10 segundos." onClose={onClose}
        footer={<View style={{ flex: 1, gap: 8 }}>
          {!form.valid && form.reason ? <Text variant="caption" color={colors.muted}>{form.reason}</Text> : null}
          <Button label="Salvar e usar nesta venda" loading={form.busy} disabled={!form.valid} accessibilityHint={form.reason ?? undefined} onPress={form.save} />
          <Button kind="ghost" label="Voltar à busca" onPress={() => setCreating(false)} />
        </View>}>
        {form.error ? <Text variant="caption" color={colors.danger}>{form.error}</Text> : null}
        <TextField label="Nome" required value={form.name} onChangeText={form.setName} autoCapitalize="words" autoFocus />
        <TextField label="Telefone" required value={form.phone} onChangeText={form.setPhone} keyboardType="phone-pad" error={form.phoneError} hint="Formato (DDD) 9 0000-0000" />
      </BottomSheet>
    );
  }
  return (
    <BottomSheet visible={visible} title="Cliente da venda" subtitle="Opcional — a venda pode ser concluída sem cliente." onClose={onClose}
      footer={<View style={{ flex: 1 }}><Button kind="ghost" icon="plus" label="Cadastrar novo cliente" onPress={() => setCreating(true)} /></View>}>
      <SearchBox label="Buscar cliente" value={q} onChangeText={setQ} placeholder="Nome ou telefone" />
      {list.length === 0 ? <Text variant="body" color={colors.muted}>{q ? `Nenhum cliente para “${q}”. Cadastre um novo abaixo.` : 'Nenhum cliente cadastrado ainda.'}</Text> : null}
      {list.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Usar ${c.name}`} onPress={() => onPick({ id: c.id, name: c.name })} style={styles.pickRow}>
          <Avatar name={c.name} />
          <View style={{ flex: 1 }}><Text variant="bodyStrong" numberOfLines={1}>{c.name}</Text><Text variant="caption" color={colors.muted}>{c.phone}</Text></View>
        </Pressable>
      ))}
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
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  pickRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
