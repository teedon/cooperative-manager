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
import { Plus, Search } from 'lucide-react-native';
import { CooperativeStackParamList } from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPosts, clearError } from '../../store/slices/postsSlice';
import PostCard from '../../components/posts/PostCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
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

const MessageWallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cooperativeId } = route.params;
  const dispatch = useAppDispatch();
  
  const { posts, isLoading, error, pagination } = useAppSelector((state) => state.posts);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [cooperativeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error]);

  const loadPosts = useCallback(() => {
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
  }, [cooperativeId, searchQuery, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const handlePostPress = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { postId });
    },
    [navigation],
  );

  const handleCreatePost = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleSearch = useCallback(() => {
    loadPosts();
  }, [loadPosts]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Message Wall</Text>
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

  const renderPost = useCallback(
    ({ item }: { item: any }) => (
      <PostCard
        post={item}
        onPress={() => handlePostPress(item.id)}
        onReact={() => {
          // TODO: Implement reaction modal
          Alert.alert('React', 'Reaction feature coming soon');
        }}
        onComment={() => handlePostPress(item.id)}
      />
    ),
    [handlePostPress],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts yet</Text>
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
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.common.white} />
      </TouchableOpacity>

      {/* Create Post Modal - TODO: Implement full create post component */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Post"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Create post functionality will be implemented in the next step
          </Text>
          <Button
            title="Close"
            onPress={() => setShowCreateModal(false)}
            variant="secondary"
          />
        </View>
      </Modal>
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
    paddingBottom: 80,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
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
    ...typography.body.medium,
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
    ...typography.body.medium,
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
  modalContent: {
    padding: spacing.md,
  },
  modalText: {
    ...typography.body.medium,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});

export default MessageWallScreen;
