// Tela: 11-mais
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppBar, Card, Icon, Screen, Text, type IconName } from '@/components/ui';
import { getSyncStatus } from '@/data/repo';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/features/common/Avatar';
import { useLoad } from '@/lib/useLoad';
import { colors } from '@/theme/tokens';

const ITEMS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Clientes', icon: 'user', href: '/clientes' },
  { label: 'Produtos', icon: 'tag', href: '/produtos' },
  { label: 'Entrada de mercadorias', icon: 'truck', href: '/entrada' },
];

export default function Mais() {
  const { user, signOut } = useAuth();
  const { data: sync } = useLoad(getSyncStatus);
  const [leaving, setLeaving] = useState(false);
  const pending = (sync?.pending.length ?? 0) + (sync?.attention.length ?? 0);
  const syncSub = sync?.localMode ? 'Modo local · tudo salvo neste aparelho' : pending ? `${pending} aguardando envio` : 'Tudo enviado';

  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Mais" back={false} />
      <Screen>
        <Card style={styles.user}>
          <Avatar name={user?.name ?? '?'} size={48} />
          <View style={{ flex: 1 }}>
            <Text variant="section">{user?.name}</Text>
            <Text variant="caption" color={colors.muted}>Vendedor</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" disabled={leaving} style={styles.signOut}
            onPress={async () => { setLeaving(true); await signOut(); }}>
            <Text variant="label" color={colors.danger}>Sair</Text>
          </Pressable>
        </Card>

        {ITEMS.map((i) => (
          <Card key={i.label} onPress={() => router.push(i.href)} style={styles.item}>
            <Icon name={i.icon} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>{i.label}</Text>
            <Icon name="chevron" color={colors.muted} />
          </Card>
        ))}
        <Card onPress={() => router.push('/sincronizacao')} style={styles.item}>
          <Icon name="cloudOff" />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Sincronização</Text>
            <Text variant="caption" color={pending ? colors.warn : colors.muted}>{syncSub}</Text>
          </View>
          <Icon name="chevron" color={colors.muted} />
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOut: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
});
