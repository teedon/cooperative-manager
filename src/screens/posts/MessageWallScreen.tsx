import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Plus, Search, FileText, BarChart2 } from 'lucide-react-native';
import { CooperativeStackParamList, ReactionType, Post } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPosts, clearError as clearPostsError, addReaction, removeReaction } from '../../store/slices/postsSlice';
import { fetchPolls, clearError as clearPollsError, votePoll } from '../../store/slices/pollsSlice';
import { Poll } from '../../api/pollsApi';
import PostCard from '../../components/posts/PostCard';
import PollCard from '../../components/polls/PollCard';
import ReactionPicker from '../../components/posts/ReactionPicker';
import colors from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type MessageWallScreenNavigationProp = NativeStackNavigationProp<
  CooperativeStackParamList,
  'MessageWall'
>;
type MessageWallScreenRouteProp = RouteProp<CooperativeStackParamList, 'MessageWall'>;

interface Props {
  navigation: MessageWallScreenNavigationProp;
  route: MessageWallScreenRouteProp;
}

type WallItem = 
  | { type: 'post'; data: Post }
  | { type: 'poll'; data: Poll };

const MessageWallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();

  // Get cooperative name from store
  const { currentCooperative } = useAppSelector((state) => state.cooperative);
  const { posts, isLoading: postsLoading, error: postsError } = useAppSelector((state) => state.posts);
  const { polls, isLoading: pollsLoading, error: pollsError } = useAppSelector((state) => state.polls);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostReaction, setSelectedPostReaction] = useState<ReactionType | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const isLoading = postsLoading || pollsLoading;

  // Combine and sort posts and polls by date
  const wallItems: WallItem[] = React.useMemo(() => {
    const items: WallItem[] = [
      ...posts.map((post) => ({ type: 'post' as const, data: post })),
      ...polls.map((poll) => ({ type: 'poll' as const, data: poll })),
    ];

    // Sort by pinned first, then by date
    return items.sort((a, b) => {
      // Pinned items first
      const aPinned = a.type === 'post' ? a.data.isPinned : a.data.isPinned;
      const bPinned = b.type === 'post' ? b.data.isPinned : b.data.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Then by date
      const aDate = new Date(a.data.createdAt).getTime();
      const bDate = new Date(b.data.createdAt).getTime();
      return bDate - aDate;
    });
  }, [posts, polls]);

  useEffect(() => {
    loadData();
  }, [cooperativeId]);

  useEffect(() => {
    if (postsError) {
      Alert.alert('Error', postsError);
      dispatch(clearPostsError());
    }
    if (pollsError) {
      Alert.alert('Error', pollsError);
      dispatch(clearPollsError());
    }
  }, [postsError, pollsError]);

  // Refresh when coming back
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = useCallback(() => {
    dispatch(
      fetchPosts({
        cooperativeId,
        query: {
          page: 1,
          limit: 20,
          search: searchQuery || undefined,
        },
      }),
    );
    dispatch(
      fetchPolls({
        cooperativeId,
        query: {
          page: 1,
          limit: 20,
          activeOnly: false,
        },
      }),
    );
  }, [cooperativeId, searchQuery, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePostPress = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { postId });
    },
    [navigation],
  );

  const handleCreatePost = useCallback(() => {
    setShowFabMenu(false);
    navigation.navigate('CreatePost', { cooperativeId });
  }, [navigation, cooperativeId]);

  const handleCreatePoll = useCallback(() => {
    setShowFabMenu(false);
    navigation.navigate('CreatePoll', { cooperativeId });
  }, [navigation, cooperativeId]);

  const handleSearch = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleReactPress = useCallback((post: Post) => {
    setSelectedPostId(post.id);
    setSelectedPostReaction(post.userReaction as ReactionType || null);
    setReactionPickerVisible(true);
  }, []);

  const handleReactionSelect = useCallback(
    async (reactionType: ReactionType) => {
      if (!selectedPostId) return;

      const post = posts.find((p) => p.id === selectedPostId);
      if (!post) return;

      try {
        if (post.userReaction === reactionType) {
          await dispatch(removeReaction(selectedPostId)).unwrap();
        } else {
          await dispatch(addReaction({ postId: selectedPostId, reactionType })).unwrap();
        }
        loadData();
      } catch (error) {
        Alert.alert('Error', 'Failed to update reaction');
      }
    },
    [selectedPostId, posts, dispatch, loadData],
  );

  const handlePollVote = useCallback(
    async (pollId: string, optionId: string) => {
      try {
        await dispatch(votePoll({ pollId, optionId })).unwrap();
      } catch (error) {
        Alert.alert('Error', (error as Error).message || 'Failed to cast vote');
      }
    },
    [dispatch],
  );

  const cooperativeName = currentCooperative?.name || 'Message Wall';

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{cooperativeName}</Text>
      <Text style={styles.subtitle}>Community Wall</Text>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: WallItem }) => {
      if (item.type === 'post') {
        return (
          <PostCard
            post={item.data}
            onPress={() => handlePostPress(item.data.id)}
            onReact={() => handleReactPress(item.data)}
            onComment={() => handlePostPress(item.data.id)}
          />
        );
      } else {
        return (
          <PollCard
            poll={item.data}
            onVote={handlePollVote}
          />
        );
      }
    },
    [handlePostPress, handleReactPress, handlePollVote],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts or polls yet</Text>
      <Text style={styles.emptySubtext}>Be the first to share something!</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || refreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary.main} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={wallItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB Menu */}
      {showFabMenu && (
        <View style={styles.fabMenuOverlay}>
          <TouchableOpacity
            style={styles.fabMenuBackdrop}
            onPress={() => setShowFabMenu(false)}
            activeOpacity={1}
          />
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={handleCreatePoll}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.secondary.light + '30' }]}>
                <BarChart2 size={20} color={colors.secondary.main} />
              </View>
              <Text style={styles.fabMenuText}>Create Poll</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={handleCreatePost}
            >
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primary.light + '30' }]}>
                <FileText size={20} color={colors.primary.main} />
              </View>
              <Text style={styles.fabMenuText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, showFabMenu && styles.fabActive]}
        onPress={() => setShowFabMenu(!showFabMenu)}
        activeOpacity={0.8}
      >
        <Plus
          size={24}
          color={colors.common.white}
          style={showFabMenu ? { transform: [{ rotate: '45deg' }] } : undefined}
        />
      </TouchableOpacity>

      {/* Reaction Picker Modal */}
      <ReactionPicker
        visible={reactionPickerVisible}
        onClose={() => setReactionPickerVisible(false)}
        onSelect={handleReactionSelect}
        currentReaction={selectedPostReaction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.disabled,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabActive: {
    backgroundColor: colors.text.secondary,
  },
  fabMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fabMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fabMenu: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg + 70,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.common.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  fabMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  fabMenuText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.primary,
  },
});

export default MessageWallScreen;
