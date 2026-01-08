import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { esusuApi, Esusu, EsusuMember } from '../../api/esusuApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'SetEsusuOrder'>;

interface OrderItem {
  memberId: string;
  memberName: string;
  memberEmail: string;
  order: number;
}

const SetEsusuOrderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { esusuId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [esusu, setEsusu] = useState<Esusu | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadEsusu();
  }, []);

  const loadEsusu = async () => {
    try {
      setLoading(true);
      const response = await esusuApi.findOne(esusuId);
      setEsusu(response);

      // Get accepted members and create order items
      const acceptedMembers = response.members?.filter(m => m.status === 'accepted') || [];
      
      const items: OrderItem[] = acceptedMembers.map((member, index) => ({
        memberId: member.memberId,
        memberName: member.member?.user 
          ? `${member.member.user.firstName} ${member.member.user.lastName}`
          : `${member.member?.firstName || ''} ${member.member?.lastName || ''}`.trim() || 'Unknown',
        memberEmail: member.member?.user?.email || member.member?.email || '',
        order: index + 1,
      }));

      setOrderItems(items);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load Esusu details'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!esusu) return;

    Alert.alert(
      'Confirm Order',
      'Are you sure you want to set this collection order? This cannot be changed later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              setSaving(true);
              const memberOrders = orderItems.map(item => ({
                memberId: item.memberId,
                order: item.order,
              }));

              await esusuApi.setOrder(esusuId, memberOrders);
              
              Alert.alert(
                'Success',
                'Collection order has been set successfully. The Esusu is now active.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to set order'));
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newItems = [...orderItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    // Update order numbers
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    
    setOrderItems(updatedItems);
  };

  const moveDown = (index: number) => {
    if (index === orderItems.length - 1) return;
    
    const newItems = [...orderItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    // Update order numbers
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    
    setOrderItems(updatedItems);
  };

  const renderItem = ({ item, index }: { item: OrderItem; index: number }) => {
    return (
      <View style={styles.memberCard}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderNumber}>{item.order}</Text>
        </View>

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.memberName}</Text>
          <Text style={styles.memberEmail}>{item.memberEmail}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, index === 0 && styles.controlButtonDisabled]}
            onPress={() => moveUp(index)}
            disabled={index === 0 || saving}
          >
            <Icon name="chevron-up" size={20} color={index === 0 ? colors.text.disabled : colors.primary.main} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, index === orderItems.length - 1 && styles.controlButtonDisabled]}
            onPress={() => moveDown(index)}
            disabled={index === orderItems.length - 1 || saving}
          >
            <Icon name="chevron-down" size={20} color={index === orderItems.length - 1 ? colors.text.disabled : colors.primary.main} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading Esusu details...</Text>
      </View>
    );
  }

  if (!esusu) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load Esusu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Set Collection Order</Text>
          <Text style={styles.headerSubtitle}>{esusu.title}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Icon name="information-circle" size={20} color={colors.info.main} />
          <Text style={styles.infoText}>
            Use the arrows to reorder members. The order determines who collects the pool in each cycle.
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Collection Order ({orderItems.length} members)</Text>
        
        <FlatList
          data={orderItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.memberId}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveOrder}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary.contrast} />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color={colors.primary.contrast} />
              <Text style={styles.saveButtonText}>Confirm Order</Text>
            </>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.info.light,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info.main,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.info.dark,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.contrast,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  controls: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  controlButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.contrast,
  },
});

export default SetEsusuOrderScreen;
