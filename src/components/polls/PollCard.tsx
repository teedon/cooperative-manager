import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { BarChart2, Pin, Clock, Check, ChevronRight } from 'lucide-react-native';
import { Poll } from '../../api/pollsApi';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  onPress?: () => void;
  showResults?: boolean;
}

const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  onPress,
  showResults = false,
}) => {
  const shouldShowResults = showResults || poll.hasVoted || poll.hasEnded || !poll.isActive;

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatEndsAt = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return 'Ended';

    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Ends in less than an hour';
    if (diffHours < 24) return `Ends in ${diffHours}h`;
    return `Ends in ${diffDays}d`;
  };

  const handleOptionPress = useCallback(
    (optionId: string) => {
      if (!poll.isActive || poll.hasEnded) return;
      onVote(poll.id, optionId);
    },
    [poll.id, poll.isActive, poll.hasEnded, onVote],
  );

  return (
    <TouchableOpacity
      style={[styles.container, poll.isPinned && styles.pinnedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <BarChart2 size={20} color={colors.primary.main} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={styles.authorName}>{poll.createdByName}</Text>
            {poll.isPinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={12} color={colors.warning.main} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{formatTimeAgo(poll.createdAt)}</Text>
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{poll.question}</Text>
      {poll.description && (
        <Text style={styles.description}>{poll.description}</Text>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {poll.options.map((option) => (
          <Pressable
            key={option.id}
            style={[
              styles.optionButton,
              option.isSelected && styles.optionSelected,
              (!poll.isActive || poll.hasEnded) && styles.optionDisabled,
            ]}
            onPress={() => handleOptionPress(option.id)}
            disabled={!poll.isActive || poll.hasEnded}
          >
            {shouldShowResults ? (
              <>
                <View
                  style={[
                    styles.optionProgress,
                    { width: `${option.percentage}%` },
                    option.isSelected && styles.optionProgressSelected,
                  ]}
                />
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    {option.isSelected && (
                      <Check size={16} color={colors.primary.main} style={styles.checkIcon} />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        option.isSelected && styles.optionTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {option.text}
                    </Text>
                  </View>
                  <Text style={styles.optionPercentage}>{option.percentage}%</Text>
                </View>
              </>
            ) : (
              <View style={styles.optionContent}>
                <Text style={styles.optionText} numberOfLines={2}>
                  {option.text}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {poll.totalVoters} {poll.totalVoters === 1 ? 'vote' : 'votes'}
          </Text>
          {poll.allowMultipleVotes && (
            <Text style={styles.multipleVotesText}>• Multiple choices</Text>
          )}
          {poll.isAnonymous && (
            <Text style={styles.anonymousText}>• Anonymous</Text>
          )}
        </View>

        {poll.endsAt && (
          <View style={styles.endsAtContainer}>
            <Clock size={12} color={colors.text.secondary} />
            <Text style={styles.endsAtText}>{formatEndsAt(poll.endsAt)}</Text>
          </View>
        )}

        {!poll.isActive && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>

      {onPress && (
        <View style={styles.viewMoreContainer}>
          <Text style={styles.viewMoreText}>View details</Text>
          <ChevronRight size={16} color={colors.primary.main} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.common.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.sm,
  },
  pinnedContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timestamp: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pinnedText: {
    ...typography.caption,
    color: colors.warning.main,
    marginLeft: 4,
  },
  question: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    marginTop: spacing.sm,
  },
  optionButton: {
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    minHeight: 44,
  },
  optionSelected: {
    borderColor: colors.primary.main,
    borderWidth: 2,
  },
  optionDisabled: {
    opacity: 0.8,
  },
  optionProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.border.light,
  },
  optionProgressSelected: {
    backgroundColor: colors.primary.light + '30',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkIcon: {
    marginRight: spacing.xs,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.primary.main,
  },
  optionPercentage: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  multipleVotesText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  anonymousText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  endsAtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  endsAtText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  closedBadge: {
    backgroundColor: colors.border.main,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  closedText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  viewMoreText: {
    ...typography.bodySmall,
    color: colors.primary.main,
    fontWeight: '500',
  },
});

export default PollCard;
