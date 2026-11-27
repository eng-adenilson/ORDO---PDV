// Tela: 17-sincronizacao
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBar, Badge, Banner, Button, Card, EmptyState, Screen, Text } from '@/components/ui';
import { discardPending, getSyncStatus, syncNow } from '@/data/repo';
import { useIsOffline } from '@/lib/connectivity';
import { formatTime, plural } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';
import { colors } from '@/theme/tokens';

export default function Sincronizacao() {
  const offline = useIsOffline();
  const { data, loading, error, reload } = useLoad(getSyncStatus);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (id?: string) => {
    setBusy(true); setMsg(null);
    try {
      const r = await syncNow(id);
      setMsg(r.sent ? `${plural(r.sent, 'item enviado', 'itens enviados')}.` : r.failed ? 'Sem conexão com o servidor. Tentaremos de novo.' : r.rejected ? 'Há itens que precisam de atenção.' : 'Nada para enviar.');
      await reload();
    } finally { setBusy(false); }
  };

  if (!data) {
    return (
      <View style={{ flex: 1 }}>
        <AppBar title="Sincronização" />
        <Screen>{loading ? <Text variant="body" color={colors.muted} style={{ textAlign: 'center', paddingVertical: 32 }}>Carregando…</Text>
          : <><EmptyState icon="alert" title="Não foi possível carregar" message={error ?? undefined} /><Button kind="ghost" label="Tentar de novo" onPress={reload} /></>}</Screen>
      </View>
    );
  }
  const sales = data.pending.filter((p) => p.kind === 'sale').length;
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Sincronização" subtitle={data.localMode ? 'Modo local · sem servidor' : offline ? 'Sem internet' : 'Online'} />
      <Screen footer={data.localMode ? undefined : <Button large label="Tentar enviar agora" loading={busy} onPress={() => run()} />}>
        {data.localMode ? <Banner tone="ok" icon="check" title="Modo local" message="Vendas, estoque e caixa ficam salvos neste aparelho. Não há nada a enviar." /> : null}
        {!data.localMode && data.pending.length > 0 ? <Banner tone="warn" title={`${plural(sales, 'venda guardada', 'vendas guardadas')} neste celular`} message="Envio automático quando a internet voltar" /> : null}
        {msg ? <Text variant="caption" color={colors.muted} accessibilityLiveRegion="polite">{msg}</Text> : null}

        {!data.localMode ? (
          <>
            <Text variant="section">Aguardando envio</Text>
            {data.pending.length === 0 ? <Text variant="body" color={colors.muted}>Nada aguardando envio.</Text> : data.pending.map((o) => (
              <Card key={o.client_id} style={styles.row}>
                <View style={{ flex: 1 }}><Text variant="bodyStrong">{o.summary}</Text><Text variant="caption" color={colors.muted}>{formatTime(o.created_at)}</Text></View>
                <Badge label={o.status === 'failed' ? 'Tentando de novo' : 'Aguardando envio'} tone="pending" />
              </Card>
            ))}
            <Text variant="section">Precisa de atenção</Text>
            {data.attention.length === 0 ? <Text variant="body" color={colors.muted}>Nada com problema.</Text> : data.attention.map((o) => (
              <Card key={o.client_id} tone="danger" style={{ gap: 8 }}>
                <Text variant="bodyStrong">{o.summary}</Text>
                <Text variant="caption" color={colors.danger}>{o.last_error}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><Button kind="ghost" label="Descartar" onPress={async () => { await discardPending(o.client_id); await reload(); }} /></View>
                  <View style={{ flex: 1 }}><Button label="Tentar de novo" loading={busy} onPress={() => run(o.client_id)} /></View>
                </View>
                {o.kind === 'sale' ? <Button kind="ghost" label="Ver venda" onPress={() => router.push('/historico')} /> : null}
              </Card>
            ))}
          </>
        ) : null}

        <Card style={{ gap: 4 }}>
          <Text variant="label" color={colors.muted}>Registrado hoje</Text>
          <Text variant="bodyStrong">{plural(data.sentToday.sales, 'venda', 'vendas')} · {plural(data.sentToday.entries, 'entrada', 'entradas')}{data.sentToday.lastAt ? ` · última às ${formatTime(data.sentToday.lastAt)}` : ''}</Text>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
