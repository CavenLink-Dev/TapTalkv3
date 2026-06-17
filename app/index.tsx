import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Href, Redirect } from 'expo-router';
import { useAppContext } from '../src/hooks/useAppContext';
import { colors } from '../src/theme/tokens';

const routes = {
  splash: '/onboarding/splash' as Href,
  pay: '/pay' as Href,
  login: '/auth/login' as Href,
  talk: '/(tabs)/talk' as Href,
};

export default function Index() {
  const { state, hydrated } = useAppContext();

  // Wait for AsyncStorage hydration before deciding where to send the user.
  // Without this gate, a user mid-app would briefly flash the splash screen
  // because the initial reducer state has every flag set to false.
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const route = !state.onboardingComplete
    ? routes.splash
    : !state.subscriptionComplete
      ? routes.pay
      : !state.signedIn
        ? routes.login
        : routes.talk;

  return <Redirect href={route} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
