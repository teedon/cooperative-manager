import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { CooperativeStackParamList, ReactionType } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPostById,
  fetchComments,
  addComment,
  addReaction,
  removeReaction,
  clearCurrentPost,
} from '../../store/slices/postsSlice';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatDistanceToNow } from '../../utils/date';

type PostDetailScreenNavigationProp = NativeStackNavigationProp<
  CooperativeStackParamList,
  'PostDetail'
>;
type PostDetailScreenRouteProp = RouteProp<CooperativeStackParamList, 'PostDetail'>;

interface Props {
  navigation: PostDetailScreenNavigationProp;
  route: PostDetailScreenRouteProp;
}

const PostDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { postId } = route.params;
  const dispatch = useAppDispatch();

  const { currentPost, comments, isLoading } = useAppSelector((state) => state.posts);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPost();
    return () => {
      dispatch(clearCurrentPost());
    };
  }, [postId]);

  const loadPost = async () => {
    await dispatch(fetchPostById(postId));
    await dispatch(fetchComments(postId));
  };

  const handleReaction = async () => {
    if (!currentPost) return;

    if (currentPost.userReaction) {
      await dispatch(removeReaction(postId));
    } else {
      await dispatch(addReaction({ postId, reactionType: 'like' as ReactionType }));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(addComment({ postId, data: { content: commentText } }));
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !currentPost) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  const hasUserReacted = !!currentPost.userReaction;
  const totalReactions = Object.values(currentPost.reactionCounts || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Avatar
            source={currentPost.authorAvatar ? { uri: currentPost.authorAvatar } : undefined}
            name={currentPost.authorName}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.authorName}>{currentPost.authorName || 'Unknown'}</Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(currentPost.createdAt))}
              {currentPost.postType === 'announcement' && ' • Announcement'}
            </Text>
          </View>
        </View>

        {/* Post Content */}
        {currentPost.title && <Text style={styles.title}>{currentPost.title}</Text>}
        <Text style={styles.content}>{currentPost.content}</Text>

        {/* Post Image */}
        {currentPost.imageUrl && (
          <Image
            source={{ uri: currentPost.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Reactions */}
        <View style={styles.reactions}>
          <TouchableOpacity style={styles.reactionButton} onPress={handleReaction}>
            <Heart
              size={24}
              color={hasUserReacted ? colors.primary.main : colors.text.secondary}
              fill={hasUserReacted ? colors.primary.main : 'transparent'}
            />
            {totalReactions > 0 && (
              <Text
                style={[styles.reactionCount, hasUserReacted && styles.reactionCountActive]}
              >
                {totalReactions}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Avatar name={comment.authorName} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <Text style={styles.commentTime}>
                    {formatDistanceToNow(new Date(comment.createdAt))}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write a comment..."
          placeholderTextColor={colors.text.disabled}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.common.white} />
          ) : (
            <Send size={20} color={colors.common.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
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
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  content: {
    ...typography.body.medium,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },
  reactionCount: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  reactionCountActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: spacing.md,
  },
  commentsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyCommentsText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  emptyCommentsSubtext: {
    ...typography.body.small,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentAuthor: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  commentText: {
    ...typography.body.medium,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentTime: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.md,
  },
  commentInput: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
});

export default PostDetailScreen;
