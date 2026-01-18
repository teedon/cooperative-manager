import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { collectionsApi, DailyCollection } from '../../api';
import { Card, Badge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';
import { List, Plus, User, Wallet, ChevronRight, FolderOpen } from 'lucide-react-native';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<any, 'CollectionsList'>;

const CollectionsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { organizationId } = route.params as { organizationId: string };
  const [collections, setCollections] = useState<DailyCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadCollections();
  }, [organizationId, filter]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const response = await collectionsApi.getAll(organizationId, {
        status: filter === 'all' ? undefined : filter,
      });
      
      if (response.success && response.data) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error('Failed to load collections:', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  }, [organizationId, filter]);

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderFilterButton = (filterValue: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCollection = ({ item }: { item: DailyCollection }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('CollectionDetails', {
          organizationId,
          collectionId: item.id,
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>
              {formatDate(item.collectionDate)}
            </Text>
          </View>
          <Badge
            text={item.status.toUpperCase()}
            variant={getStatusVariant(item.status)}
          />
        </View>

        <View style={styles.cardContent}>
          {item.staff?.user && (
            <View style={styles.infoRow}>
              <User size={16} color="#666" />
              <Text style={styles.infoText}>
                {item.staff.user.firstName} {item.staff.user.lastName}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Wallet size={16} color="#666" />
            <Text style={styles.infoText}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <List size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {item.status === 'draft' && (
          <View style={styles.cardFooter}>
            <Text style={styles.draftHint}>Tap to continue editing</Text>
            <ChevronRight size={16} color="#3498db" />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FolderOpen size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>No collections found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'all'
          ? 'Create a new collection to get started'
          : `No ${filter} collections`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('draft', 'Draft')}
        {renderFilterButton('submitted', 'Pending')}
        {renderFilterButton('approved', 'Approved')}
        {renderFilterButton('rejected', 'Rejected')}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={collections}
          renderItem={renderCollection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('CreateCollection', { organizationId })
        }
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  draftHint: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#95a5a6',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default CollectionsListScreen;
