// Role Switcher Component - Allows users with both roles to switch between organization and cooperative mode

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './common/Icon';
import { colors, spacing, borderRadius } from '../theme';
import { useUserType } from '../contexts/UserTypeContext';
import { AppMode } from '../models/UserProfile';

interface Props {
  style?: any;
  compact?: boolean;
}

const RoleSwitcher: React.FC<Props> = ({ style, compact = false }) => {
  const { userType, currentMode, switchMode, canAccessOrganization, canAccessCooperative } = useUserType();

  // Only show if user has both roles
  if (userType !== 'both') {
    return null;
  }

  const handleSwitch = (mode: AppMode) => {
    if (mode !== currentMode) {
      switchMode(mode);
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity
          style={[
            styles.compactButton,
            currentMode === 'cooperative' && styles.compactButtonActive,
          ]}
          onPress={() => handleSwitch('cooperative')}
          disabled={!canAccessCooperative}
        >
          <Icon
            name="people"
            size={16}
            color={currentMode === 'cooperative' ? colors.primary.main : colors.text.secondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.compactButton,
            currentMode === 'organization' && styles.compactButtonActive,
          ]}
          onPress={() => handleSwitch('organization')}
          disabled={!canAccessOrganization}
        >
          <Icon
            name="business"
            size={16}
            color={currentMode === 'organization' ? colors.primary.main : colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          styles.leftButton,
          currentMode === 'cooperative' && styles.activeButton,
        ]}
        onPress={() => handleSwitch('cooperative')}
        disabled={!canAccessCooperative}
      >
        <Icon
          name="people"
          size={20}
          color={currentMode === 'cooperative' ? '#fff' : colors.text.secondary}
        />
        <Text
          style={[
            styles.modeText,
            currentMode === 'cooperative' && styles.activeModeText,
          ]}
        >
          Cooperative
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          styles.rightButton,
          currentMode === 'organization' && styles.activeButton,
        ]}
        onPress={() => handleSwitch('organization')}
        disabled={!canAccessOrganization}
      >
        <Icon
          name="business"
          size={20}
          color={currentMode === 'organization' ? '#fff' : colors.text.secondary}
        />
        <Text
          style={[
            styles.modeText,
            currentMode === 'organization' && styles.activeModeText,
          ]}
        >
          Organization
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  leftButton: {
    marginRight: 2,
  },
  rightButton: {
    marginLeft: 2,
  },
  activeButton: {
    backgroundColor: colors.primary.main,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeModeText: {
    color: '#fff',
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactButtonActive: {
    backgroundColor: colors.primary.light,
  },
});

export default RoleSwitcher;
