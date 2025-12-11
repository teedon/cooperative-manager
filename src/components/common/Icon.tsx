import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

const emojiMap: Record<string, string> = {
  Home: '🏠',
  User: '👤',
  Plus: '➕',
  Key: '🔑',
  Search: '🔍',
  List: '📋',
  ShoppingCart: '🛒',
  Wallet: '💳',
  Check: '✅',
  BarChart: '📊',
  Clipboard: '📋',
  Calendar: '📅',
  Clock: '⏱️',
  ChevronRight: '→',
  DollarSign: '💰',
  CreditCard: '💳',
};

export default function Icon({
  name,
  size = 20,
  color = '#000',
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}) {
  // Prefer Lucide icon if available
  // @ts-ignore - dynamic access on LucideIcons
  const Comp = (LucideIcons as any)[name];
  if (Comp) {
    // lucide icons accept color/width/height
    return <Comp color={color} width={size} height={size} style={style as any} />;
  }

  const emoji = emojiMap[name] ?? '❔';
  return (
    <View style={[styles.container, style]}>
      <Text style={{ fontSize: size * 0.9 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
