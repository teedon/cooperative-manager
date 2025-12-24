import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Heart, ThumbsUp, PartyPopper, HandHeart, Lightbulb, HelpCircle, LucideIcon } from 'lucide-react-native';
import { ReactionType } from '../../models';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reactionType: ReactionType) => void;
  currentReaction?: ReactionType | null;
}

interface ReactionOption {
  type: ReactionType;
  Icon: LucideIcon;
  label: string;
  color: string;
}

const reactions: ReactionOption[] = [
  {
    type: 'like',
    Icon: ThumbsUp,
    label: 'Like',
    color: '#2196F3',
  },
  {
    type: 'love',
    Icon: Heart,
    label: 'Love',
    color: '#E91E63',
  },
  {
    type: 'celebrate',
    Icon: PartyPopper,
    label: 'Celebrate',
    color: '#FFC107',
  },
  {
    type: 'support',
    Icon: HandHeart,
    label: 'Support',
    color: '#9C27B0',
  },
  {
    type: 'insightful',
    Icon: Lightbulb,
    label: 'Insightful',
    color: '#FF9800',
  },
  {
    type: 'thinking',
    Icon: HelpCircle,
    label: 'Thinking',
    color: '#607D8B',
  },
];

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  visible,
  onClose,
  onSelect,
  currentReaction,
}) => {
  const handleSelect = (type: ReactionType) => {
    onSelect(type);
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.picker}>
            {reactions.map((reaction) => {
              const isSelected = currentReaction === reaction.type;
              const IconComponent = reaction.Icon;
              return (
                <TouchableOpacity
                  key={reaction.type}
                  style={[
                    styles.reactionButton,
                    isSelected && styles.reactionButtonSelected,
                  ]}
                  onPress={() => handleSelect(reaction.type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${reaction.color}20` }]}>
                    <IconComponent size={28} color={reaction.color} />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      isSelected && { color: reaction.color, fontWeight: '700' },
                    ]}
                  >
                    {reaction.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </RNModal>
  );
};

// Helper function to get reaction icon for display
export const getReactionIcon = (type: ReactionType, size: number = 16): React.ReactNode => {
  const reactionConfig = reactions.find((r) => r.type === type);
  if (!reactionConfig) return null;

  const IconComponent = reactionConfig.Icon;
  return <IconComponent size={size} color={reactionConfig.color} />;
};

// Helper function to get reaction color
export const getReactionColor = (type: ReactionType): string => {
  const reactionConfig = reactions.find((r) => r.type === type);
  return reactionConfig?.color || colors.text.secondary;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 360,
  },
  picker: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    ...shadows.lg,
  },
  reactionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 70,
  },
  reactionButtonSelected: {
    backgroundColor: colors.primary.light,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default ReactionPicker;
