import { useEffect } from 'react';
import { Href, useRouter } from 'expo-router';
import { useAppContext } from '../src/hooks/useAppContext';

const routes = {
  splash: '/onboarding/splash' as Href,
  pay: '/pay' as Href,
  login: '/auth/login' as Href,
  talk: '/(tabs)/talk' as Href,
};

export default function Index() {
  const router = useRouter();
  const { state } = useAppContext();

  useEffect(() => {
    if (!state.onboardingComplete) {
      router.replace(routes.splash);
    } else if (!state.subscriptionComplete) {
      router.replace(routes.pay);
    } else if (!state.signedIn) {
      router.replace(routes.login);
    } else {
      router.replace(routes.talk);
    }
  }, [router, state.onboardingComplete, state.signedIn, state.subscriptionComplete]);

  return null;
}
