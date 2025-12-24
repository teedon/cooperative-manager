import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, Heart, Pin } from 'lucide-react-native';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Avatar from '../common/Avatar';
import { Post } from '../../models';
import { formatDistanceToNow } from '../../utils/date';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onReact?: () => void;
  onComment?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPress, onReact, onComment }) => {
  const hasUserReacted = !!post.userReaction;
  const totalReactions = Object.values(post.reactionCounts || {}).reduce((sum, count) => sum + count, 0);
  const commentCount = post._count?.comments || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={post.authorAvatar ? { uri: post.authorAvatar } : undefined}
          name={post.authorName}
        />
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={styles.authorName}>{post.authorName || 'Unknown'}</Text>
            {post.isPinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={14} color={colors.primary.main} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(post.createdAt))}
            {post.postType === 'announcement' && ' • Announcement'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {post.title && <Text style={styles.title}>{post.title}</Text>}
      <Text style={styles.content} numberOfLines={4}>
        {post.content}
      </Text>

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onReact?.();
          }}
        >
          <Heart
            size={20}
            color={hasUserReacted ? colors.primary.main : colors.text.secondary}
            fill={hasUserReacted ? colors.primary.main : 'transparent'}
          />
          {totalReactions > 0 && (
            <Text style={[styles.actionText, hasUserReacted && styles.actionTextActive]}>
              {totalReactions}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onComment?.();
          }}
        >
          <MessageCircle size={20} color={colors.text.secondary} />
          {commentCount > 0 && (
            <Text style={styles.actionText}>{commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    ...typography.body.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timestamp: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pinnedText: {
    ...typography.body.small,
    color: colors.primary.main,
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  content: {
    ...typography.body.medium,
    color: colors.text.primary,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  actionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default PostCard;
