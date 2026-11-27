// Tela: 05-clientes (+ cadastro). Mesmos campos do sheet rápido (04-cadastro-rapido-cliente).
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppBar, Banner, Button, Screen, Text, TextField } from '@/components/ui';
import { useNewCustomer } from '@/features/customers/useNewCustomer';
import { colors } from '@/theme/tokens';

export default function NovoCliente() {
  const f = useNewCustomer(() => router.back());
  return (
    <View style={{ flex: 1 }}>
      <AppBar title="Novo cliente" />
      <Screen footer={
        <>
          {!f.valid && f.reason ? <Text variant="caption" color={colors.muted} accessibilityLiveRegion="polite">{f.reason}</Text> : null}
          <Button large label="Salvar cliente" loading={f.busy} disabled={!f.valid} accessibilityHint={f.reason ?? undefined} onPress={f.save} />
        </>
      }>
        {f.error ? <Banner tone="danger" title={f.error} /> : null}
        <TextField label="Nome" required value={f.name} onChangeText={f.setName} autoCapitalize="words" autoFocus />
        <TextField label="Telefone" required value={f.phone} onChangeText={f.setPhone} keyboardType="phone-pad" error={f.phoneError} hint="Formato (DDD) 9 0000-0000" />
      </Screen>
    </View>
  );
}
