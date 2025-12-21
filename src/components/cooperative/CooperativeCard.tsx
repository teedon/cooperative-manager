import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Cooperative, GradientPreset } from '../../models';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../common/Icon';
import { getGradientConfig } from '../../utils/gradients';

interface CooperativeCardProps {
  cooperative: Cooperative;
  onPress?: () => void;
}

export const CooperativeCard: React.FC<CooperativeCardProps> = ({ cooperative, onPress }) => {
  const useGradient = cooperative.useGradient !== false;
  const gradientPreset = (cooperative.gradientPreset || 'ocean') as GradientPreset;
  const gradientConfig = getGradientConfig(gradientPreset);

  const renderBackground = () => {
    if (useGradient || !cooperative.imageUrl) {
      return (
        <LinearGradient
          colors={[...gradientConfig.colors] as [string, string, ...string[]]}
          start={{ x: gradientConfig.start.x, y: gradientConfig.start.y }}
          end={{ x: gradientConfig.end.x, y: gradientConfig.end.y }}
          style={styles.gradient}
        >
          <View style={styles.gradientPattern}>
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
          </View>
        </LinearGradient>
      );
    }
    return (
      <Image
        source={{ uri: cooperative.imageUrl }}
        style={styles.image}
      />
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {renderBackground()}
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
  gradient: {
    width: '100%',
    height: 120,
  },
  gradientPattern: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: -20,
    right: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: 20,
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

