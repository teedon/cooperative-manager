import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '../../store/hooks';
import Icon from './Icon';
import { colors, spacing } from '../../theme';
import { HomeStackParamList } from '../../navigation/MainNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface NotificationBellProps {
  color?: string;
  size?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  color = colors.text.primary,
  size = 24,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { unreadCount } = useAppSelector((state) => state.notification);

  const handlePress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Icon name="Bell" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.paper,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationBell;
