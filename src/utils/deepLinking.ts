import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';

export const linking = {
  prefixes: ['coopmanager://', 'https://coopmanager.app', 'https://www.coopmanager.app'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: {
                path: 'join/:code?',
                parse: {
                  code: (code: string) => code,
                },
              },
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};

export const handleDeepLink = (
  url: string,
  navigation: NavigationContainerRef<any> | null,
  isAuthenticated: boolean
) => {
  if (!url) return;

  // Parse the URL
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const params = Object.fromEntries(urlObj.searchParams);

  // Handle /join/:code links
  if (path.startsWith('/join')) {
    const code = path.split('/join/')[1] || params.code;
    
    if (!isAuthenticated) {
      // Redirect to register with cooperative code
      navigation?.navigate('Auth', { 
        screen: 'Signup', 
        params: { cooperativeCode: code } 
      });
    } else {
      // Navigate to home with join modal
      navigation?.navigate('Main', {
        screen: 'HomeTab',
        params: {
          screen: 'Home',
          params: { openModal: 'join', cooperativeCode: code },
        },
      });
    }
  }
};

export const setupDeepLinking = (
  navigation: NavigationContainerRef<any> | null,
  isAuthenticated: boolean
) => {
  // Handle initial URL (app opened from deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url, navigation, isAuthenticated);
    }
  });

  // Handle URL when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url, navigation, isAuthenticated);
  });

  return () => {
    subscription.remove();
  };
};
