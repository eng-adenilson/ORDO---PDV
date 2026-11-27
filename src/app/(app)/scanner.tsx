// Tela: 16-scanner
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Button, Icon, Text, TextField } from '@/components/ui';
import { cancelScan, emitScan } from '@/features/scanner/scanBus';
import { colors } from '@/theme/tokens';

export default function Scanner() {
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState('');
  const done = useRef(false);

  const finish = (c: string) => {
    if (done.current || !c.trim()) return;
    done.current = true;
    Vibration.vibrate(60);
    emitScan(c.trim());
    router.back();
  };
  const close = () => { cancelScan(); router.back(); };

  return (
    <View style={styles.root}>
      {perm?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'upc_a', 'code39'] }}
          onBarcodeScanned={({ data }) => finish(data)} />
      ) : null}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={close} style={styles.close}><Icon name="close" color="#FFFFFF" /></Pressable>
        <Text variant="screenTitle" color="#FFFFFF">Ler código de barras</Text>
      </View>

      <View style={styles.center}>
        {perm && !perm.granted ? (
          <View style={styles.denied}>
            <Text variant="sheetTitle" color="#FFFFFF" style={{ textAlign: 'center' }}>Precisamos da câmera</Text>
            <Text variant="body" color="#D9D7CF" style={{ textAlign: 'center' }}>Permita o uso da câmera para ler o código, ou digite o código do produto.</Text>
            {perm.canAskAgain ? <Button kind="brand" label="Permitir câmera" onPress={() => requestPerm()} /> : null}
          </View>
        ) : (
          <>
            <View style={styles.frame}><View style={styles.line} /></View>
            <Text variant="bodyStrong" color="#FFFFFF">Aponte para o código do produto</Text>
            <Text variant="caption" color="#D9D7CF">A leitura é automática</Text>
          </>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Button kind="ghost" icon="barcode" label="Digitar código" onPress={() => setTyping(true)} />
      </View>

      <BottomSheet visible={typing} title="Digitar código" onClose={() => setTyping(false)}
        footer={<View style={{ flex: 1 }}><Button label="Usar este código" disabled={!code.trim()} accessibilityHint={!code.trim() ? 'Digite o código para continuar' : undefined} onPress={() => finish(code)} /></View>}>
        <TextField label="Código do produto" required value={code} onChangeText={setCode} autoCapitalize="characters" autoFocus placeholder="Ex.: MET3020" />
        {!code.trim() ? <Text variant="caption" color={colors.muted}>Digite o código para continuar.</Text> : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.scannerBg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, backgroundColor: 'rgba(0,0,0,0.35)', paddingBottom: 8 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  frame: { width: 280, height: 180, borderRadius: 16, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  line: { width: 240, height: 3, backgroundColor: colors.brand, borderRadius: 2 },
  denied: { gap: 12, alignItems: 'stretch', width: '100%' },
  bottom: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(0,0,0,0.35)' },
});
