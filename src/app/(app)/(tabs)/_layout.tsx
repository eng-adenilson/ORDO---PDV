import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { colors, fonts, sizes } from '@/theme/tokens';

const TAB: Record<string, { title: string; icon: IconName }> = {
  index: { title: 'Vender', icon: 'cart' },
  estoque: { title: 'Estoque', icon: 'box' },
  historico: { title: 'Histórico', icon: 'clock' },
  caixa: { title: 'Caixa', icon: 'cash' },
  mais: { title: 'Mais', icon: 'more' },
};

/** Barra inferior com 5 abas; a ativa ganha pílula brandSoft atrás do ícone (ver 02-vendas.png). */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const t = TAB[route.name] ?? { title: route.name, icon: 'more' as IconName };
        return {
          headerShown: false,
          title: t.title,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
          tabBarStyle: { height: sizes.tabBar, backgroundColor: colors.card, borderTopColor: colors.line, paddingTop: 8 },
          tabBarIcon: ({ focused }) => (
            <View style={[styles.pill, focused && styles.on]}><Icon name={t.icon} color={focused ? colors.ink : colors.muted} /></View>
          ),
        };
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="estoque" />
      <Tabs.Screen name="historico" />
      <Tabs.Screen name="caixa" />
      <Tabs.Screen name="mais" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.brandSoft },
});
