import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { colors, radii, spacing, typography } from '../../src/theme/tokens';

const nextRoute = '/registration/02-name' as Href;

type Selection = 'myself' | 'someone_else' | null;

export default function RegStep1Who() {
  const router = useRouter();
  const [selected, setSelected] = useState<Selection>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 1 of 10</Text>
        <Text style={styles.title}>Who is this app for?</Text>

        <View style={styles.choices}>
          <PrimaryButton
            accessibilityLabel="This app is for myself"
            label="Myself"
            variant={selected === 'myself' ? 'primary' : 'secondary'}
            onPress={() => setSelected('myself')}
            style={styles.choice}
          />
          <PrimaryButton
            accessibilityLabel="This app is for someone else"
            label="Someone Else"
            variant={selected === 'someone_else' ? 'primary' : 'secondary'}
            onPress={() => setSelected('someone_else')}
            style={styles.choice}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          accessibilityLabel="Continue to next step"
          label="Continue"
          disabled={selected === null}
          onPress={() => router.push(nextRoute)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  choices: { gap: spacing.md },
  choice: { width: '100%' },
  footer: { padding: spacing.xl },
});
