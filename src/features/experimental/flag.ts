/**
 * Experimental-feature flag.
 *
 * Hides Activities / Visual Timer / First-Then / Calendar behind a single
 * switch until the core board is solid. Set once in `app.json`:
 *
 *   { "expo": { "extra": { "experimentalFeatures": true } } }
 *
 * or via EAS env → `EXPO_PUBLIC_EXPERIMENTAL=1` on a build channel.
 */
import Constants from 'expo-constants';

export function experimentalFeaturesEnabled(): boolean {
  const fromConfig = Constants.expoConfig?.extra?.experimentalFeatures === true;
  const fromEnv = process.env.EXPO_PUBLIC_EXPERIMENTAL === '1';
  return fromConfig || fromEnv;
}
