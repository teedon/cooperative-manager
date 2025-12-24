import React, { useEffect, useState, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Heart, MessageCircle, Send, Reply, MoreVertical, Trash2 } from 'lucide-react-native';
import { CooperativeStackParamList, ReactionType, Comment } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPostById,
  fetchComments,
  addComment,
  addReaction,
  removeReaction,
  deleteComment,
  clearCurrentPost,
} from '../../store/slices/postsSlice';
import Avatar from '../../components/common/Avatar';
import ReactionPicker, { getReactionIcon, getReactionColor } from '../../components/posts/ReactionPicker';
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
  const { user } = useAppSelector((state) => state.auth);

  const { currentPost, comments, isLoading } = useAppSelector((state) => state.posts);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);

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

  const handleReactionPress = () => {
    setReactionPickerVisible(true);
  };

  const handleReactionSelect = async (reactionType: ReactionType) => {
    if (!currentPost) return;

    try {
      if (currentPost.userReaction === reactionType) {
        await dispatch(removeReaction(postId)).unwrap();
      } else {
        await dispatch(addReaction({ postId, reactionType })).unwrap();
      }
      loadPost();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const data: any = { content: commentText.trim() };
      if (replyingTo) {
        data.parentCommentId = replyingTo.id;
      }
      await dispatch(addComment({ postId, data })).unwrap();
      setCommentText('');
      setReplyingTo(null);
      loadPost();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteComment(commentId)).unwrap();
              loadPost();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ],
    );
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
          <TouchableOpacity style={styles.reactionButton} onPress={handleReactionPress}>
            {hasUserReacted && currentPost.userReaction ? (
              <>
                {getReactionIcon(currentPost.userReaction as ReactionType, 24)}
                <Text style={[styles.reactionCount, { color: getReactionColor(currentPost.userReaction as ReactionType) }]}>
                  {totalReactions}
                </Text>
              </>
            ) : (
              <>
                <Heart size={24} color={colors.text.secondary} />
                {totalReactions > 0 && (
                  <Text style={styles.reactionCount}>{totalReactions}</Text>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* Reaction counts by type */}
          {currentPost.reactionCounts && Object.keys(currentPost.reactionCounts).length > 0 && (
            <View style={styles.reactionSummary}>
              {Object.entries(currentPost.reactionCounts).map(([type, count]) => (
                <View key={type} style={styles.reactionSummaryItem}>
                  {getReactionIcon(type as ReactionType, 14)}
                  <Text style={styles.reactionSummaryCount}>{count as number}</Text>
                </View>
              ))}
            </View>
          )}
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
            comments.map((comment) => {
              const isOwnComment = comment.authorUserId === user?.id;
              const isParentComment = !comment.parentCommentId;
              const replies = comments.filter((c) => c.parentCommentId === comment.id);

              if (!isParentComment) return null; // Render replies under parent

              return (
                <View key={comment.id}>
                  {/* Parent Comment */}
                  <View style={styles.comment}>
                    <Avatar name={comment.authorName} size={36} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                        {isOwnComment && (
                          <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                            <Trash2 size={16} color={colors.error.main} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      <View style={styles.commentFooter}>
                        <Text style={styles.commentTime}>
                          {formatDistanceToNow(new Date(comment.createdAt))}
                        </Text>
                        <TouchableOpacity
                          style={styles.replyButton}
                          onPress={() => handleReplyToComment(comment)}
                        >
                          <Reply size={14} color={colors.primary.main} />
                          <Text style={styles.replyButtonText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Replies */}
                  {replies.map((reply) => {
                    const isOwnReply = reply.authorUserId === user?.id;
                    return (
                      <View key={reply.id} style={styles.replyContainer}>
                        <View style={styles.replyLine} />
                        <View style={styles.reply}>
                          <Avatar name={reply.authorName} size={28} />
                          <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.commentAuthor}>{reply.authorName}</Text>
                              {isOwnReply && (
                                <TouchableOpacity onPress={() => handleDeleteComment(reply.id)}>
                                  <Trash2 size={14} color={colors.error.main} />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={styles.commentText}>{reply.content}</Text>
                            <Text style={styles.commentTime}>
                              {formatDistanceToNow(new Date(reply.createdAt))}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyIndicatorText}>
            Replying to <Text style={styles.replyIndicatorName}>{replyingTo.authorName}</Text>
          </Text>
          <TouchableOpacity onPress={handleCancelReply}>
            <Text style={styles.cancelReplyText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : 'Write a comment...'}
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
      </KeyboardAvoidingView>

      {/* Reaction Picker */}
      <ReactionPicker
        visible={reactionPickerVisible}
        onClose={() => setReactionPickerVisible(false)}
        onSelect={handleReactionSelect}
        currentReaction={currentPost.userReaction as ReactionType || null}
      />
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
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  replyButtonText: {
    ...typography.body.small,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  replyContainer: {
    flexDirection: 'row',
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  replyLine: {
    width: 2,
    backgroundColor: colors.border.light,
    marginRight: spacing.sm,
    borderRadius: 1,
  },
  reply: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.light,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  replyIndicatorText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  replyIndicatorName: {
    fontWeight: '600',
    color: colors.primary.main,
  },
  cancelReplyText: {
    ...typography.body.small,
    color: colors.error.main,
    fontWeight: '600',
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.light,
  },
  reactionSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reactionSummaryCount: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginLeft: 2,
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
