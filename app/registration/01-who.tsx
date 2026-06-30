import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { RegistrationScaffold } from '../../src/components/registration/RegistrationScaffold';
import { SelectableCard } from '../../src/components/registration/SelectableCard';
import { useRegistration } from '../../src/context/RegistrationContext';
import { spacing, typography } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/fonts';
import { Text } from 'react-native';

const nextRoute = '/registration/02-aac-user' as Href;

export default function RegStep1Who() {
  const router = useRouter();
  const t = useTheme();
  const { data, update } = useRegistration();

  return (
    <RegistrationScaffold
      step={1}
      title="Who is setting up this account?"
      subtitle="This determines what we ask next and which safeguards apply."
      footer={
        <PrimaryButton
          accessibilityLabel="Continue to the next step"
          label="Continue"
          disabled={data.role === null}
          onPress={() => router.push(nextRoute)}
        />
      }
    >
      <View style={styles.choices}>
        <SelectableCard
          entranceIndex={0}
          label="For myself"
          description="I'll be the one using TapTalk to communicate."
          selected={data.role === 'myself'}
          onPress={() => update({ role: 'myself' })}
          accessibilityLabel="I am setting up TapTalk for myself"
        />
        <SelectableCard
          entranceIndex={1}
          label="For someone else"
          description="I'm setting this up for a person I support."
          selected={data.role === 'someone_else'}
          onPress={() => update({ role: 'someone_else' })}
          accessibilityLabel="I am setting up TapTalk for someone else"
        />
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={t.colors.textTertiary} />
        <Text style={[styles.noteText, { color: t.colors.textTertiary }]}>
          A guardian must set up the account for users under 15. You'll be
          asked for guardian details on the next screens if that applies.
        </Text>
      </View>
    </RegistrationScaffold>
  );
}

const styles = StyleSheet.create({
  choices: { gap: spacing.md },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
