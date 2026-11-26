// Telas: 01-login · R1-login-erro  (docs/figma/png/)
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Logo, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { isDemo } from '@/lib/env';
import { colors, space } from '@/theme/tokens';

export default function Login() {
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError(null);
    const err = await signIn(login, password);
    setLoading(false);
    if (err) setError(err); // navegação acontece sozinha pelo Stack.Protected
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <View style={styles.brand}>
          <Logo size={80} />
          <Text variant="display" style={{ letterSpacing: 2 }}>ORDO</Text>
          <Text color={colors.muted}>Ponto de venda da sua loja</Text>
        </View>
        {error ? <Banner tone="danger" title={error} /> : null}
        <TextField label="Usuário" icon="user" value={login} onChangeText={setLogin} autoCapitalize="none" autoCorrect={false}
          autoComplete="username" textContentType="username" returnKeyType="next" />
        <TextField label="Senha" icon="lock" value={password} onChangeText={setPassword} secureTextEntry
          autoComplete="password" textContentType="password" onSubmitEditing={submit} error={error ? 'Confira a senha.' : undefined} />
        {/* TODO §13.2: recuperação de senha ainda não definida no documento. */}
        <Pressable accessibilityRole="link" style={styles.forgot}><Text variant="label">Esqueci a senha</Text></Pressable>
        <Button label="Entrar" onPress={submit} loading={loading} disabled={!login || !password} />
        {isDemo ? <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>Modo demonstração (sem .env): qualquer usuário e senha entram.</Text> : null}
      </KeyboardAvoidingView>
      <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>Versão 0.1 · funciona sem internet</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space.xxl },
  body: { flex: 1, justifyContent: 'center', gap: space.lg },
  brand: { alignItems: 'center', gap: 8, marginBottom: space.xxl },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
});
