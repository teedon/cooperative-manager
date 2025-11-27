import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GroupBuy } from '../../models';
import Badge from '../common/Badge';

export interface ListingCardProps {
  groupBuy: GroupBuy;
  onPress?: () => void;
  testID?: string;
}

const ListingCard: React.FC<ListingCardProps> = ({ groupBuy, onPress, testID }) => {
  const getStatusVariant = () => {
    switch (groupBuy.status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'warning';
      case 'finalized':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const availabilityPercent =
    groupBuy.totalUnits > 0 ? Math.round((groupBuy.availableUnits / groupBuy.totalUnits) * 100) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} testID={testID}>
      <Image
        source={{ uri: groupBuy.imageUrl || 'https://picsum.photos/400/300' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {groupBuy.title}
          </Text>
          <Badge text={groupBuy.status} variant={getStatusVariant()} />
        </View>

        {groupBuy.description && (
          <Text style={styles.description} numberOfLines={2}>
            {groupBuy.description}
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>${groupBuy.unitPrice.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>per unit</Text>
        </View>

        <View style={styles.availabilityRow}>
          <View style={styles.availabilityBar}>
            <View style={[styles.availabilityFill, { width: `${availabilityPercent}%` }]} />
          </View>
          <Text style={styles.availabilityText}>
            {groupBuy.availableUnits} of {groupBuy.totalUnits} available
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Interest</Text>
            <Text style={styles.footerValue}>{groupBuy.interestRate}%</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Deadline</Text>
            <Text style={styles.footerValue}>
              {new Date(groupBuy.deadline).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#e2e8f0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  priceUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  availabilityRow: {
    marginBottom: 16,
  },
  availabilityBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 12,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
});

export default ListingCard;
