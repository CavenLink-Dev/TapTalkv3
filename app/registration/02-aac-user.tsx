import React, { useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { ageGate, useRegistration } from '../../src/context/RegistrationContext';
import { createAuthFormStyles } from '../../src/styles/authFormStyles';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';

const nextRoute = '/registration/03-contact' as Href;

export default function RegStep2AacUser() {
  const router = useRouter();
  const t = useTheme();
  const authFormStyles = useMemo(() => createAuthFormStyles(t), [t]);
  const { data, update } = useRegistration();
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const [showError, setShowError] = useState(false);

  const namesOk =
    data.firstName.trim().length > 0 &&
    data.lastName.trim().length > 0 &&
    data.displayName.trim().length > 0;
  const dobOk =
    data.dobDay.length > 0 && data.dobMonth.length > 0 && data.dobYear.length === 4;

  const gate = ageGate(data);
  const blocked = gate.kind === 'blocked_under_15';

  const canContinue = namesOk && dobOk && !blocked;

  const handleContinue = () => {
    setShowError(true);
    if (!canContinue) return;
    router.push(nextRoute);
  };

  // ── DOB auto-advance: month after 2 day digits, year after 2 month digits.
  // Backspace in an empty field jumps back to the previous one.
  const onDayChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, 2);
    update({ dobDay: clean });
    if (clean.length === 2) monthRef.current?.focus();
  };
  const onMonthChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, 2);
    update({ dobMonth: clean });
    if (clean.length === 2) yearRef.current?.focus();
  };
  const onYearChange = (t: string) => {
    update({ dobYear: t.replace(/\D/g, '').slice(0, 4) });
  };
  const onKey =
    (field: 'month' | 'year') =>
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key !== 'Backspace') return;
      if (field === 'month' && data.dobMonth.length === 0) dayRef.current?.focus();
      if (field === 'year' && data.dobYear.length === 0) monthRef.current?.focus();
    };

  return (
    <RegistrationScaffold
      step={2}
      title="The AAC user's details"
      subtitle="Fields about the person who will use TapTalk to communicate."
      scroll
      footer={
        <PrimaryButton
          accessibilityLabel="Continue to contact details"
          label="Continue"
          disabled={!canContinue}
          onPress={handleContinue}
        />
      }
    >
      <View style={styles.fields}>
        {/* ── Legal name ── */}
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={authFormStyles.label}>Legal first name</Text>
            <TextField
              accessibilityLabel="Legal first name"
              placeholder="e.g. Alex"
              autoCapitalize="words"
              value={data.firstName}
              onChangeText={(t) => update({ firstName: t })}
              style={authFormStyles.field}
            />
          </View>
          <View style={styles.flex}>
            <Text style={authFormStyles.label}>Legal last name</Text>
            <TextField
              accessibilityLabel="Legal last name"
              placeholder="e.g. Smith"
              autoCapitalize="words"
              value={data.lastName}
              onChangeText={(t) => update({ lastName: t })}
              style={authFormStyles.field}
            />
          </View>
        </View>

        {/* ── Display name ── */}
        <View>
          <Text style={authFormStyles.label}>Display name</Text>
          <TextField
            accessibilityLabel="Display name shown inside TapTalk"
            placeholder="e.g. Alex"
            autoCapitalize="words"
            value={data.displayName}
            onChangeText={(t) => update({ displayName: t })}
            style={authFormStyles.field}
            helper="This is what TapTalk shows on the home screen and to communication partners — it can be different to the legal name."
          />
        </View>

        {/* ── DOB ── */}
        <View>
          <Text style={authFormStyles.label}>Date of birth</Text>
          <View style={styles.dobRow}>
            <TextField
              accessibilityLabel="Day"
              placeholder="DD"
              keyboardType="number-pad"
              maxLength={2}
              ref={dayRef as React.Ref<TextInput>}
              value={data.dobDay}
              onChangeText={onDayChange}
              style={[authFormStyles.field, styles.dobField]}
            />
            <Text style={[styles.dobSep, { color: t.colors.textTertiary }]}>/</Text>
            <TextField
              accessibilityLabel="Month"
              placeholder="MM"
              keyboardType="number-pad"
              maxLength={2}
              ref={monthRef as React.Ref<TextInput>}
              value={data.dobMonth}
              onChangeText={onMonthChange}
              onKeyPress={onKey('month')}
              style={[authFormStyles.field, styles.dobField]}
            />
            <Text style={[styles.dobSep, { color: t.colors.textTertiary }]}>/</Text>
            <TextField
              accessibilityLabel="Year"
              placeholder="YYYY"
              keyboardType="number-pad"
              maxLength={4}
              ref={yearRef as React.Ref<TextInput>}
              value={data.dobYear}
              onChangeText={onYearChange}
              onKeyPress={onKey('year')}
              style={[authFormStyles.field, styles.dobField, styles.dobYear]}
            />
          </View>
        </View>

        {/* ── Block banner (under-15 + myself path) ── */}
        {blocked && showError ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.block}>
            <Ionicons
              name="alert-circle"
              size={22}
              color={t.colors.danger}
              accessibilityElementsHidden
            />
            <View style={styles.flex}>
              <Text style={[styles.blockTitle, { color: t.colors.danger }]}>A guardian is required</Text>
              <Text style={[styles.blockBody, { color: t.colors.text }]}>
                TapTalk needs a guardian to set up accounts for users under 15.
                Tap back and select <Text style={[styles.blockEm, { color: t.colors.danger }]}>For someone else</Text>.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back and change who is setting up"
                onPress={() => router.back()}
                hitSlop={6}
                style={[
                  styles.blockBtn,
                  { backgroundColor: t.colors.surface, borderColor: t.colors.danger },
                ]}
              >
                <Text style={[styles.blockBtnLabel, { color: t.colors.danger }]}>Go back</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  dobRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  dobField: { flex: 1, marginTop: 0, marginBottom: 0 },
  dobYear: { flex: 1.6 },
  dobSep: {
    fontFamily: fonts.displayBold,
    fontSize: typography.title,
  },
  block: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F8C5C2',
  },
  blockTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
  },
  blockBody: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },
  blockEm: { fontFamily: fonts.displayBold },
  blockBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
  },
  blockBtnLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
});
