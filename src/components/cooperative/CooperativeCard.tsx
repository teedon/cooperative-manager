import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Cooperative } from '../../models';
import Badge from '../common/Badge';

export interface CooperativeCardProps {
  cooperative: Cooperative;
  onPress?: () => void;
  testID?: string;
}

const CooperativeCard: React.FC<CooperativeCardProps> = ({ cooperative, onPress, testID }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} testID={testID}>
      <Image
        source={{ uri: cooperative.imageUrl || 'https://picsum.photos/400/200' }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {cooperative.name}
          </Text>
          <Badge
            text={cooperative.status}
            variant={cooperative.status === 'active' ? 'success' : 'default'}
          />
        </View>
        {cooperative.description && (
          <Text style={styles.description} numberOfLines={2}>
            {cooperative.description}
          </Text>
        )}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cooperative.memberCount}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${cooperative.totalContributions.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Contributions</Text>
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
    height: 120,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
});

export default CooperativeCard;
