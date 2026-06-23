import { Href, Redirect } from 'expo-router';

/**
 * Root router.
 *
 * Per the splash spec the splash screen MUST play on every cold start, so we
 * unconditionally hand control to `/onboarding/splash` here. The splash holds
 * the animation for ~5.8s while AsyncStorage hydration runs in parallel, then
 * decides where to send the user (Talk, Login, or Get Started) based on the
 * resolved app state.
 */
export default function Index() {
  const splash = '/onboarding/splash' as Href;
  return <Redirect href={splash} />;
}
