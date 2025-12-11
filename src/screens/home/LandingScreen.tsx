import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, borderRadius } from '../../theme';
import Icon from '../../components/common/Icon';
import { useNavigation } from '@react-navigation/native';

const LandingScreen: React.FC = () => {
  const { cooperatives } = useAppSelector((s) => s.cooperative);
  // Placeholder recent activity - in future hook into ledger or activity feed
  const recent = cooperatives.slice(0, 3);

  useEffect(() => {
    // small mount log
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const logger = require('../../utils/logger').default;
    logger.info('ui.landing.mounted');
  }, []);

  const navigation: any = useNavigation();

  const handleCreate = () => navigation.navigate('Home', { openModal: 'create' });
  const handleJoin = () => navigation.navigate('Home', { openModal: 'join' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.subtitle}>Here's what's happening with your cooperatives</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary.main + '20' }]}>
            <Icon name="Home" size={24} color={colors.primary.main} />
          </View>
          <Text style={styles.summaryNumber}>{cooperatives.length}</Text>
          <Text style={styles.summaryLabel}>Cooperatives</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent.main + '20' }]}>
            <Icon name="List" size={24} color={colors.accent.main} />
          </View>
          <Text style={styles.summaryNumber}>{cooperatives.reduce((s, c) => s + (c.memberCount ?? 0), 0)}</Text>
          <Text style={styles.summaryLabel}>Total Members</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning.main + '20' }]}>
            <Icon name="Plus" size={24} color={colors.warning.main} />
          </View>
          <Text style={styles.summaryNumber}>—</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Cooperatives</Text>
      {recent.length === 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.text.secondary }}>Looks like you're new here — get started quickly</Text>
          <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
            <TouchableOpacity style={[styles.summaryCardVertical, { flex: 1, marginRight: spacing.sm }]} onPress={handleCreate} activeOpacity={0.8}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success.main + '20' }]}>
                <Icon name="Plus" size={28} color={colors.success.main} />
              </View>
              <Text style={styles.summaryNumber}>Create</Text>
              <Text style={styles.summaryLabel}>Start a cooperative</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.summaryCardVertical, { flex: 1, marginLeft: spacing.sm }]} onPress={handleJoin} activeOpacity={0.8}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accent.main + '20' }]}>
                <Icon name="Key" size={28} color={colors.accent.main} />
              </View>
              <Text style={styles.summaryNumber}>Join</Text>
              <Text style={styles.summaryLabel}>Use a code to join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
        data={recent}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemSubtitle}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No recent activity</Text>}
      />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background.default },
  header: { marginBottom: spacing.lg },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  summaryCardVertical: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryNumber: { fontSize: 20, fontWeight: '700', marginTop: spacing.sm, color: colors.text.primary },
  summaryLabel: { fontSize: 12, color: colors.text.secondary, marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing['2xl'], fontSize: 16, fontWeight: '700', color: colors.text.primary },
  item: { padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.background.paper, marginTop: spacing.md },
  itemTitle: { fontWeight: '600', color: colors.text.primary },
  itemSubtitle: { color: colors.text.secondary, marginTop: spacing.xs },
  empty: { color: colors.text.secondary, marginTop: spacing.md },
});

export default LandingScreen;
