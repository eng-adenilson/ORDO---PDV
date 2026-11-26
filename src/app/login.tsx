// Telas: 01-login · R1-login-erro  (docs/figma/png/)
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, BottomSheet, Button, Logo, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { colors, sizes, space } from '@/theme/tokens';

export default function Login() {
  const { signIn, registerLocal, isLocalMode } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError(null);
    const err = await signIn(login, password);
    setLoading(false);
    if (err) setError(err); // navegação acontece sozinha pelo Stack.Protected
  };

  const passMismatch = newPassConfirm.length > 0 && newPass !== newPassConfirm;
  const canCreate = newName.trim().length > 0 && newLogin.trim().length > 0 && newPass.length >= 4 && newPass === newPassConfirm;

  const submitRegister = async () => {
    if (!canCreate) return;
    setRegLoading(true); setRegError(null);
    const err = await registerLocal({ name: newName, login: newLogin, password: newPass });
    setRegLoading(false);
    if (err) {
      setRegError(err);
      return;
    }
    setCreateOpen(false);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setRegError(null);
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
        <Button label="Entrar" onPress={submit} loading={loading} disabled={!login || !password}
          accessibilityHint={!login || !password ? 'Preencha usuário e senha para entrar.' : undefined} />
        {isLocalMode ? (
          <View style={styles.localBox}>
            <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
              Login local (sem internet): use joao.balcao ou carla (senha 123456).
            </Text>
            <Button kind="ghost" label="Criar usuário local" icon="user" onPress={() => setCreateOpen(true)} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
      <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>Versão 0.1 · funciona sem internet</Text>

      <BottomSheet visible={createOpen} title="Criar usuário local" subtitle="Salvo apenas neste aparelho, sem conta Google."
        onClose={closeCreate}
        footer={
          <View style={{ flex: 1, gap: space.xs }}>
            <Button label="Criar e entrar" onPress={submitRegister} loading={regLoading} disabled={!canCreate}
              accessibilityHint={!canCreate ? 'Preencha nome, usuário e senha igual nos dois campos.' : undefined} />
            {!canCreate ? (
              <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
                Preencha nome, usuário e senha com pelo menos 4 caracteres.
              </Text>
            ) : null}
          </View>
        }>
        {regError ? <Banner tone="danger" title={regError} /> : null}
        <TextField label="Nome" required value={newName} onChangeText={setNewName} placeholder="Ex.: Maria" />
        <TextField label="Usuário" required icon="user" value={newLogin} onChangeText={setNewLogin} autoCapitalize="none"
          autoCorrect={false} placeholder="Ex.: maria.balcao" hint="Será convertido para usuario@ordo.local" />
        <TextField label="Senha" required icon="lock" value={newPass} onChangeText={setNewPass} secureTextEntry
          hint="Mínimo de 4 caracteres" error={newPass.length > 0 && newPass.length < 4 ? 'Use pelo menos 4 caracteres.' : undefined} />
        <TextField label="Confirmar senha" required icon="lock" value={newPassConfirm} onChangeText={setNewPassConfirm}
          secureTextEntry onSubmitEditing={submitRegister} error={passMismatch ? 'As senhas não conferem.' : undefined} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space.xxl },
  body: { flex: 1, justifyContent: 'center', gap: space.lg },
  brand: { alignItems: 'center', gap: 8, marginBottom: space.xxl },
  forgot: { alignSelf: 'flex-end', minHeight: sizes.touch, justifyContent: 'center' },
  localBox: { gap: space.sm, marginTop: space.xs },
});
