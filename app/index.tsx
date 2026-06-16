import { Href, Redirect } from 'expo-router';
import { useAppContext } from '../src/hooks/useAppContext';

const routes = {
  splash: '/onboarding/splash' as Href,
  pay: '/pay' as Href,
  login: '/auth/login' as Href,
  talk: '/(tabs)/talk' as Href,
};

export default function Index() {
  const { state } = useAppContext();

  const route = !state.onboardingComplete
    ? routes.splash
    : !state.subscriptionComplete
      ? routes.pay
      : !state.signedIn
        ? routes.login
        : routes.talk;

  return <Redirect href={route} />;
}
