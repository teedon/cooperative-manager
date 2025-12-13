import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Cooperative } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../common/Icon';

interface CooperativeCardProps {
  cooperative: Cooperative;
  onPress?: () => void;
}

export const CooperativeCard: React.FC<CooperativeCardProps> = ({ cooperative, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: cooperative.imageUrl || 'https://picsum.photos/200' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {cooperative.name}
          </Text>
          {cooperative.code && (
            <View style={styles.codeContainer}>
              <Icon name="Key" size={12} color={colors.primary.main} />
              <Text style={styles.codeText}>{cooperative.code}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {cooperative.description || 'No description available'}
        </Text>
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Icon name="Users" size={14} color={colors.text.secondary} />
            <Text style={styles.statText}>{cooperative.memberCount || 0} members</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="DollarSign" size={14} color={colors.text.secondary} />
            <Text style={styles.statText}>
              ₦{(cooperative.totalContributions || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.secondary.main,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
    gap: 4,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.main,
    letterSpacing: 1,
  },
  description: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
