import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface TabIconProps {
  name: 'Home' | 'Users' | 'User';
  focused: boolean;
  size?: number;
}

// Custom SVG Icons for a cleaner look
const TabIcon: React.FC<TabIconProps> = ({ name, focused, size = 24 }) => {
  const color = focused ? colors.primary.main : colors.text.secondary;
  const strokeWidth = focused ? 2.5 : 2;

  switch (name) {
    case 'Home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={focused ? `${colors.primary.main}20` : 'none'}
          />
          <Path
            d="M9 22V12h6v10"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'Users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="9"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={focused ? `${colors.primary.main}20` : 'none'}
          />
          <Path
            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'User':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="12"
            cy="7"
            r="4"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={focused ? `${colors.primary.main}20` : 'none'}
          />
        </Svg>
      );
    default:
      return null;
  }
};

interface TabItemProps {
  label: string;
  icon: 'Home' | 'Users' | 'User';
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ label, icon, focused, onPress, onLongPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: -4,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scaleAnim, translateYAnim]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.tabItemContent,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        {/* Active indicator dot */}
        {focused && <View style={styles.activeIndicator} />}
        
        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
          <TabIcon name={icon} focused={focused} size={22} />
        </View>
        
        <Text
          style={[
            styles.tabLabel,
            focused && styles.tabLabelFocused,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const tabs: Array<{ key: string; label: string; icon: 'Home' | 'Users' | 'User' }> = [
    { key: 'HomeTab', label: 'Home', icon: 'Home' },
    { key: 'CoopsTab', label: 'Cooperatives', icon: 'Users' },
    { key: 'ProfileTab', label: 'Profile', icon: 'User' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {/* Decorative top border with gradient effect */}
      <View style={styles.topBorder}>
        <View style={styles.topBorderGradient} />
      </View>
      
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = tabs.find((t) => t.key === route.name) || tabs[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              label={tab.label}
              icon={tab.icon}
              focused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  topBorderGradient: {
    flex: 1,
    backgroundColor: colors.primary.main,
    opacity: 0.15,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerFocused: {
    backgroundColor: `${colors.primary.main}15`,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default CustomTabBar;
