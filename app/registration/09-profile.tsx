import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import {
  toUserPayload,
  useRegistration,
} from '../../src/context/RegistrationContext';
import { useAppContext } from '../../src/hooks/useAppContext';
import { authFormStyles } from '../../src/styles/authFormStyles';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';

const talkRoute = '/(tabs)/talk' as Href;

export default function RegStep9Profile() {
  const router = useRouter();
  const { data, update } = useRegistration();
  const { dispatch } = useAppContext();
  const [submitting, setSubmitting] = useState(false);

  const initial =
    (data.displayName.trim() || data.firstName.trim() || 'T').charAt(0).toUpperCase();

  const commit = () => {
    setSubmitting(true);
    const payload = toUserPayload(data);
    dispatch({ type: 'SET_USER', payload });
    dispatch({
      type: 'SET_SECURE_METHOD',
      payload: {
        method: data.secureMethod ?? 'password',
        biometricsEnabled: data.biometricsEnabled,
      },
    });
    dispatch({ type: 'SET_PROFILE_PHOTO', payload: data.profilePhotoUri });
    dispatch({ type: 'SET_ACCESSIBILITY', payload: data.accessibility });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    dispatch({
      type: 'SIGN_IN',
      payload: {
        email: payload.email,
        displayName: payload.displayName,
        rememberLogin: true,
      },
    });
    hapticSuccess();
    setTimeout(() => router.replace(talkRoute), 80);
  };

  // Photo picker stub — see note in module header. The "Use initial" path is
  // the production-correct fallback when the user declines or the library
  // isn't accessible.
  const pickPhoto = () => {
    hapticSelection();
    Alert.alert(
      'Add a profile photo',
      'You can choose a photo now or add one any time from Settings → Profile. ' +
        'For this preview build the picker is disabled — your initial will be used.',
      [
        { text: 'OK', style: 'default' },
      ],
    );
  };

  const skip = () => {
    update({ profilePhotoUri: null });
    commit();
  };

  return (
    <RegistrationScaffold
      step={9}
      title="One last thing"
      subtitle="Set what TapTalk shows on the home screen. You can change this any time."
      scroll
      footer={
        <>
          <PrimaryButton
            accessibilityLabel="Enter TapTalk"
            label="Enter TapTalk"
            loading={submitting}
            onPress={commit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip profile setup for now"
            onPress={skip}
            hitSlop={8}
            style={styles.skipBtn}
          >
            <Text style={styles.skipLabel}>Skip for now</Text>
          </Pressable>
        </>
      }
    >
      <View style={styles.body}>
        {/* ── Avatar ── */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial} accessibilityElementsHidden>
              {initial}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a profile photo"
            onPress={pickPhoto}
            hitSlop={8}
            style={styles.photoBtn}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={styles.photoBtnLabel}>Add photo</Text>
          </Pressable>
        </View>

        {/* ── Display name ── */}
        <View>
          <Text style={authFormStyles.label}>Display name</Text>
          <TextField
            accessibilityLabel="Display name shown on the home screen"
            placeholder={data.firstName || 'Your name'}
            autoCapitalize="words"
            value={data.displayName}
            onChangeText={(t) => update({ displayName: t })}
            style={authFormStyles.field}
          />
        </View>
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.xl, alignItems: 'stretch' },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EAF5FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontFamily: fonts.displayBlack,
    fontSize: 48,
    color: colors.primaryDark,
    letterSpacing: -1,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  photoBtnLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    color: colors.primary,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
    color: colors.textMuted,
  },
});
