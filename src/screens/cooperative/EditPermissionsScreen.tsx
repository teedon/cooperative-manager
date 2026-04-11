import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  Permission,
} from '../../models';
import { cooperativeApi } from '../../api/cooperativeApi';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminEditPermissions'>;

const EditPermissionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, memberId, memberName, currentPermissions } = route.params;
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissions);
  const [isSaving, setIsSaving] = useState(false);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  const handleSave = async () => {
    if (selectedPermissions.length === 0) {
      Alert.alert('No Permissions', 'Please select at least one permission.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await cooperativeApi.updateMemberPermissions(
        cooperativeId,
        memberId,
        selectedPermissions
      );
      if (response.success) {
        Alert.alert('Success', 'Permissions updated successfully');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update permissions'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderPermissionGroup = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    const groupPermissions = group.permissions;
    const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length;
    const allSelected = selectedCount === groupPermissions.length;

    return (
      <View key={groupKey} style={styles.permissionGroup}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleGroup(groupPermissions)}
        >
          <View style={styles.groupCheckbox}>
            {allSelected ? (
              <Icon name="CheckSquare" size={20} color={colors.primary.main} />
            ) : selectedCount > 0 ? (
              <Icon name="MinusSquare" size={20} color={colors.primary.main} />
            ) : (
              <Icon name="Square" size={20} color={colors.text.secondary} />
            )}
          </View>
          <Text style={styles.groupTitle}>{group.label}</Text>
          <Text style={styles.groupCount}>
            {selectedCount}/{groupPermissions.length}
          </Text>
        </TouchableOpacity>

        <View style={styles.permissionList}>
          {groupPermissions.map((permission) => (
            <TouchableOpacity
              key={permission}
              style={styles.permissionItem}
              onPress={() => togglePermission(permission)}
            >
              <View style={[
                styles.permissionCheckbox,
                selectedPermissions.includes(permission) && styles.permissionCheckboxChecked,
              ]}>
                {selectedPermissions.includes(permission) && (
                  <Icon name="Check" size={14} color={colors.primary.contrast} />
                )}
              </View>
              <Text style={styles.permissionLabel}>
                {PERMISSION_LABELS[permission as Permission]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Info banner */}
      <View style={styles.infoBanner}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {memberName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoName}>{memberName}</Text>
          <Text style={styles.infoSubtext}>
            {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {Object.keys(PERMISSION_GROUPS).map(renderPermissionGroup)}
      </ScrollView>

      {/* Fixed footer buttons */}
      <View style={styles.footer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.footerButton}
        />
        <Button
          title={isSaving ? 'Saving...' : 'Save Permissions'}
          onPress={handleSave}
          disabled={isSaving || selectedPermissions.length === 0}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  infoText: {
    flex: 1,
  },
  infoName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  permissionGroup: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.secondary.main,
  },
  groupCheckbox: {
    marginRight: spacing.sm,
  },
  groupTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  groupCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  permissionList: {
    padding: spacing.sm,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  permissionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  permissionCheckboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  permissionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.sm,
  },
  footerButton: {
    flex: 1,
  },
});

export default EditPermissionsScreen;
