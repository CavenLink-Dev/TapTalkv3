import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/04-dob' as Href;

export default function RegStep3Username() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const isValid = username.length === 0 || (username.length >= 8 && username.length <= 12 && /^[a-zA-Z0-9]+$/.test(username));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 3 of 10</Text>
        <Text style={styles.title}>What should we call you?</Text>
        <Text style={styles.hint}>Optional — 8–12 characters, letters and numbers only.</Text>

        <Card>
          <TextField
            accessibilityLabel="Username"
            placeholder="Username (optional)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={12}
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <PrimaryButton accessibilityLabel="Skip this step" label="Skip" variant="secondary" onPress={() => router.push(nextRoute)} style={styles.skip} />
        <PrimaryButton accessibilityLabel="Continue" label="Continue" disabled={username.length > 0 && !isValid} onPress={() => router.push(nextRoute)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: typography.callout, color: colors.textMuted, marginBottom: spacing.xl },
  footer: { padding: spacing.xl, gap: spacing.sm },
  skip: { width: '100%' },
});
