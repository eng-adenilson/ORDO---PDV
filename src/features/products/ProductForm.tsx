// Telas: 06-cadastro-produto · R7-produto-codigo-duplicado
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Banner, Button, Card, Chip, Screen, Text, TextField, Thumb } from '@/components/ui';
import { DuplicateCodeError, findProductByCode, listCategories, saveProduct, uploadProductPhoto } from '@/data/repo';
import { openScanner } from '@/features/scanner/scanBus';
import { formatMoney, parseMoney } from '@/lib/money';
import { colors } from '@/theme/tokens';
import type { Product } from '@/types/domain';

const toField = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));

/** Formulário de produto (novo/editar). Só nome e código são obrigatórios (requisitos §2.1). Estoque não é editável aqui. */
export function ProductForm({ product, onSaved }: { product?: Product; onSaved: (p: Product) => void }) {
  const [name, setName] = useState(product?.name ?? '');
  const [code, setCode] = useState(product?.code ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null);
  const [active, setActive] = useState(product?.active ?? true);
  const [cost, setCost] = useState(toField(product?.cost_cents ?? null));
  const [price, setPrice] = useState(toField(product?.price_cents ?? null));
  const [description, setDescription] = useState(product?.description ?? '');
  const [photo, setPhoto] = useState<string | null>(product?.photo_url ?? null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [dupName, setDupName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);

  useEffect(() => { listCategories().then(setCategories).catch(() => {}); }, []);

  // detecta código duplicado antes de salvar (R7)
  useEffect(() => {
    const c = code.trim();
    if (!c) { setDupName(null); return; }
    let alive = true;
    const id = setTimeout(() => { findProductByCode(c, product?.id).then((p) => { if (alive) setDupName(p?.name ?? null); }).catch(() => {}); }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [code, product?.id]);

  const costCents = cost.trim() ? parseMoney(cost) : null;
  const priceCents = price.trim() ? parseMoney(price) : null;
  const costErr = cost.trim() && costCents === null ? 'Digite um valor válido. Ex.: 61,40' : undefined;
  const priceErr = price.trim() && priceCents === null ? 'Digite um valor válido. Ex.: 89,90' : undefined;
  const margin = costCents !== null && priceCents ? Math.round(((priceCents - costCents) / priceCents) * 100) : null;

  const reason = !name.trim() ? 'Digite o nome do produto.' : !code.trim() ? 'Digite o código do produto.' : dupName ? `O código ${code.trim()} já é usado por ${dupName}.` : costErr ?? priceErr ?? null;

  const pick = async (from: 'camera' | 'gallery') => {
    setPhotoMsg(null);
    try {
      const perm = from === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setPhotoMsg('Sem permissão. Libere o acesso nas configurações do aparelho — a foto é opcional.'); return; }
      const r = from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
      if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
    } catch { setPhotoMsg('Não foi possível abrir a câmera/galeria. A foto é opcional.'); }
  };

  const save = async () => {
    if (reason || busy) return;
    setBusy(true); setError(null);
    try {
      let photo_url = photo;
      if (photo && photo !== product?.photo_url) photo_url = await uploadProductPhoto(photo);
      const saved = await saveProduct({ code, name, category_id: categoryId, description: description.trim() || null, photo_url, cost_cents: costCents, price_cents: priceCents, active }, product?.id);
      onSaved(saved);
    } catch (e) {
      if (e instanceof DuplicateCodeError) setDupName(e.existingName);
      else setError(e instanceof Error ? e.message : 'Não foi possível salvar o produto.');
    } finally { setBusy(false); }
  };

  return (
    <Screen footer={
      <>
        {reason ? <Text variant="caption" color={dupName ? colors.danger : colors.muted} accessibilityLiveRegion="polite">{reason}</Text> : null}
        <Button large label={product ? 'Salvar alterações' : 'Salvar produto'} loading={busy} disabled={!!reason} accessibilityHint={reason ?? undefined} onPress={save} />
      </>
    }>
      {error ? <Banner tone="danger" title={error} /> : null}

      <Card style={styles.photoCard}>
        <Thumb uri={photo} size={72} />
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="label">Foto (opcional)</Text>
          <View style={styles.photoBtns}>
            <Chip label="Câmera" onPress={() => pick('camera')} />
            <Chip label="Galeria" onPress={() => pick('gallery')} />
            {photo ? <Chip label="Remover" onPress={() => setPhoto(null)} /> : null}
          </View>
        </View>
      </Card>
      {photoMsg ? <Text variant="caption" color={colors.warn}>{photoMsg}</Text> : null}

      <TextField label="Nome" required value={name} onChangeText={setName} autoCapitalize="sentences" placeholder="Ex.: Metalon 30x20 #18 6m" />
      <TextField label={dupName ? `Código * · já usado por ${dupName}` : 'Código'} required={!dupName} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false}
        error={dupName ? 'Use outro código ou edite o produto existente.' : undefined} hint="Único por produto" placeholder="Ex.: MET3020"
        trailingIcon="barcode" onTrailingPress={() => { openScanner((c) => setCode(c)); router.push('/scanner'); }} />

      <View style={{ gap: 8 }}>
        <Text variant="label" color={colors.ink2}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Sem categoria" selected={!categoryId} onPress={() => setCategoryId(null)} />
          {categories.map((c) => <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />)}
        </ScrollView>
      </View>

      <Pressable accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={() => setActive(!active)} style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Status: {active ? 'Ativo' : 'Inativo'}</Text>
          <Text variant="caption" color={colors.muted}>{active ? 'Aparece na tela de vendas.' : 'Não aparece na tela de vendas.'}</Text>
        </View>
        <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.ink, false: colors.line }} thumbColor="#FFFFFF" />
      </Pressable>

      <TextField label="Preço de custo" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="Ex.: 61,40" error={costErr} />
      <TextField label="Preço de venda" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Ex.: 89,90" error={priceErr}
        hint={`Custo não aparece na tela de vendas${margin !== null ? ` · margem ${margin}%` : ''}`} />
      <TextField label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Opcional" style={{ minHeight: 64, textAlignVertical: 'top' }} />

      {product ? (
        <Card style={{ gap: 4 }}>
          <Text variant="label" color={colors.muted}>Estoque atual</Text>
          <Text variant="section">{product.stock_qty} un{product.price_cents !== null ? ` · ${formatMoney(product.price_cents)}` : ''}</Text>
          <Text variant="caption" color={colors.muted}>O saldo só muda pela tela Entrada de mercadorias, vendas e cancelamentos.</Text>
        </Card>
      ) : (
        <Banner tone="ok" icon="box" title="O estoque inicial entra pela tela Entrada de mercadorias." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  switchRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
});
