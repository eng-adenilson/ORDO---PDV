// Telas: 07-entrada-mercadorias · 12-entrada-produto-novo
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, Banner, BottomSheet, Button, Card, Chip, Screen, Text, TextField } from '@/components/ui';
import { BusinessError, DuplicateCodeError, listCategories, listEntries, listProducts, listSuppliers, registerStockEntry } from '@/data/repo';
import { SearchBox } from '@/features/common/SearchBox';
import { openScanner } from '@/features/scanner/scanBus';
import { formatDayMonth } from '@/lib/format';
import { formatMoney, parseMoney } from '@/lib/money';
import { colors, radius } from '@/theme/tokens';
import type { Product, StockEntryRow, SupplierRow } from '@/types/domain';

const toField = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));

export default function Entrada() {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [product, setProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [recent, setRecent] = useState<StockEntryRow[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupCode, setDupCode] = useState<string | null>(null);

  useEffect(() => { listSuppliers().then(setSuppliers).catch(() => {}); listCategories().then(setCategories).catch(() => {}); }, []);

  const choose = (p: Product) => {
    setProduct(p); setPickerOpen(false); setCost(toField(p.cost_cents)); setPrice(toField(p.price_cents));
    listEntries(p.id, 3).then(setRecent).catch(() => setRecent([]));
  };

  const qtyN = /^\d+$/.test(qty.trim()) ? Number(qty) : 0;
  const qtyErr = qty.trim() && qtyN <= 0 ? 'Digite um número inteiro maior que zero.' : undefined;
  const costC = cost.trim() ? parseMoney(cost) : null;
  const priceC = price.trim() ? parseMoney(price) : null;
  const base = mode === 'existing' ? product?.stock_qty ?? 0 : 0;

  const reason = mode === 'existing' && !product ? 'Escolha o produto.'
    : mode === 'new' && !name.trim() ? 'Digite o nome do produto.'
      : mode === 'new' && !code.trim() ? 'Digite o código do produto.'
        : qtyN <= 0 ? 'Digite a quantidade recebida.'
          : !supplier.trim() ? 'Informe o fornecedor.'
            : (cost.trim() && costC === null) || (price.trim() && priceC === null) ? 'Corrija os preços.' : null;

  const submit = async () => {
    if (reason || busy) return;
    setBusy(true); setError(null); setDupCode(null);
    try {
      const r = await registerStockEntry({
        product_id: mode === 'existing' ? product!.id : null,
        new_product: mode === 'new' ? { code: code.trim(), name: name.trim(), category_id: categoryId } : null,
        qty: qtyN, cost_cents: costC, price_cents: priceC, supplier_name: supplier.trim(),
        supplier_id: suppliers.find((s) => s.name.toLowerCase() === supplier.trim().toLowerCase())?.id ?? null,
      });
      router.replace({ pathname: '/entrada-registrada', params: {
        name: r.product_name || product?.name || name, code: r.product_code || product?.code || code, qty: String(r.qty), prev: String(r.prev_qty), next: String(r.new_qty),
        cost: r.cost_cents === null ? '' : String(r.cost_cents), supplier: r.supplier_name, queued: r.queued ? '1' : '' } });
    } catch (e) {
      if (e instanceof DuplicateCodeError) setDupCode(e.existingName);
      else setError(e instanceof BusinessError || e instanceof Error ? e.message : 'Não foi possível registrar a entrada.');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Entrada de mercadorias" />
      <Screen footer={
        <>
          {reason ? <Text variant="caption" color={colors.muted} accessibilityLiveRegion="polite">{reason}</Text> : null}
          <Button large kind="brand" label={mode === 'new' ? 'Cadastrar e registrar entrada' : 'Registrar entrada'} loading={busy} disabled={!!reason} accessibilityHint={reason ?? undefined} onPress={submit} />
        </>
      }>
        <View style={styles.toggle}>
          <Chip label="Produto existente" selected={mode === 'existing'} onPress={() => setMode('existing')} />
          <Chip label="Produto novo" selected={mode === 'new'} onPress={() => setMode('new')} />
        </View>
        {error ? <Banner tone="danger" title={error} /> : null}

        {mode === 'existing' ? (
          product ? (
            <Card style={styles.prod}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={2}>{product.name}</Text>
                <Text variant="caption" color={colors.muted}>{product.code} · em estoque: {product.stock_qty}</Text>
              </View>
              <Chip label="Trocar" onPress={() => setPickerOpen(true)} />
            </Card>
          ) : <Button kind="ghost" icon="search" label="Escolher produto" onPress={() => setPickerOpen(true)} />
        ) : (
          <>
            <TextField label="Nome" required value={name} onChangeText={setName} placeholder="Ex.: Lixa d'água 220" />
            <TextField label={dupCode ? `Código * · já usado por ${dupCode}` : 'Código'} required={!dupCode} value={code} onChangeText={(s) => { setCode(s); setDupCode(null); }} autoCapitalize="characters"
              error={dupCode ? 'Use outro código ou escolha “Produto existente”.' : undefined}
              trailingIcon="barcode" onTrailingPress={() => { openScanner((c) => setCode(c)); router.push('/scanner'); }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="Sem categoria" selected={!categoryId} onPress={() => setCategoryId(null)} />
              {categories.map((c) => <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />)}
            </ScrollView>
          </>
        )}

        <TextField label="Quantidade recebida" required value={qty} onChangeText={setQty} keyboardType="number-pad" error={qtyErr} autoFocus={mode === 'existing' && !!product} />
        <TextField label={mode === 'new' ? 'Estoque inicial' : 'Novo saldo'} value={qtyN > 0 ? `${base} + ${qtyN} = ${base + qtyN}` : String(base)} readOnlyValue onChangeText={() => {}} />
        <TextField label="Preço de custo" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="Ex.: 61,40" />
        <TextField label="Preço de venda" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Ex.: 89,90" />
        <TextField label="Fornecedor" required value={supplier} onChangeText={setSupplier} autoCapitalize="words" hint="Escolha abaixo ou digite um nome novo" />
        {suppliers.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {suppliers.map((s) => <Chip key={s.id} label={s.name} selected={supplier.trim().toLowerCase() === s.name.toLowerCase()} onPress={() => setSupplier(s.name)} />)}
          </ScrollView>
        ) : null}

        {mode === 'existing' && product ? (
          <View style={{ gap: 8 }}>
            <Text variant="section">Últimas entradas deste produto</Text>
            {recent.length === 0 ? <Text variant="caption" color={colors.muted}>Nenhuma entrada registrada ainda.</Text> : recent.map((e) => (
              <Card key={e.id} style={styles.entry}>
                <View style={{ flex: 1 }}>
                  <Text variant="label">{formatDayMonth(new Date(e.created_at))} · {e.supplier_name}</Text>
                  <Text variant="caption" color={colors.muted}>{e.cost_cents === null ? 'Custo não informado' : `Custo ${formatMoney(e.cost_cents)}`}</Text>
                </View>
                <Text variant="money" color={colors.ok}>+{e.qty}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </Screen>
      <ProductPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={choose} />
    </View>
  );
}

function ProductPicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (p: Product) => void }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<Product[]>([]);
  useEffect(() => {
    if (!visible) { setQ(''); return; }
    let alive = true;
    const id = setTimeout(() => { listProducts({ q, filter: 'active' }).then((r) => { if (alive) setList(r.slice(0, 6)); }).catch(() => {}); }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [q, visible]);
  return (
    <BottomSheet visible={visible} title="Escolher produto" onClose={onClose}>
      <SearchBox label="Buscar produto" value={q} onChangeText={setQ} placeholder="Nome ou código…" autoFocus
        onScan={() => { onClose(); openScanner((c) => listProducts({ q: c, filter: 'active' }).then((r) => r[0] && onPick(r[0]))); router.push('/scanner'); }} />
      {list.length === 0 ? <Text variant="body" color={colors.muted}>Nenhum produto encontrado.</Text> : null}
      {list.map((p) => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Escolher ${p.name}`} onPress={() => onPick(p)} style={styles.pick}>
          <View style={{ flex: 1 }}><Text variant="bodyStrong" numberOfLines={1}>{p.name}</Text><Text variant="caption" color={colors.muted}>{p.code} · em estoque: {p.stock_qty}</Text></View>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', gap: 8 },
  prod: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pick: { minHeight: 52, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, borderRadius: radius.sm },
});
