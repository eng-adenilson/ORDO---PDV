import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Card } from './Card';
import { Text } from './Text';

/**
 * Marcador da fundação: mostra o ID da tela, a referência no Figma e links de navegação.
 * SUBSTITUA este componente pela implementação real seguindo SPEC.md e docs/figma/png/<screen>.png.
 */
export function SpecPlaceholder({ screen, todo, links = [] }: { screen: string; todo: string[]; links?: { label: string; href: Href }[] }) {
  return (
    <View style={styles.wrap}>
      <Card style={{ gap: 8 }}>
        <Text variant="badge" color={colors.warn}>A IMPLEMENTAR · {screen}</Text>
        <Text variant="caption" color={colors.muted}>Referência: docs/figma/png/{screen}.png · SPEC.md</Text>
        {todo.map((t) => <Text key={t} variant="body">• {t}</Text>)}
      </Card>
      {links.length ? (
        <Card style={{ gap: 4 }}>
          <Text variant="label" color={colors.muted}>Navegar (protótipo)</Text>
          {links.map((l) => (
            <Link key={l.label} href={l.href} style={styles.link}><Text variant="bodyStrong">→ {l.label}</Text></Link>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: 12 }, link: { paddingVertical: 12, borderRadius: radius.sm } });
