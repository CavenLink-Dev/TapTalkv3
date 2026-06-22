import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';
import { authFormStyles } from '../../src/styles/authFormStyles';

const nextRoute = '/registration/03-username' as Href;

export default function RegStep2Name() {
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [middle, setMiddle] = useState('');
  const [last, setLast] = useState('');

  const canContinue = first.trim().length > 0 && last.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 2 of 10</Text>
        <Text style={styles.title}>What's the legal name?</Text>

        <Card>
          <Text style={authFormStyles.label}>First Name</Text>
          <TextField accessibilityLabel="First name" placeholder="First" value={first} onChangeText={setFirst} style={authFormStyles.field} />
          <Text style={authFormStyles.label}>Middle Name (Optional)</Text>
          <TextField accessibilityLabel="Middle name" placeholder="Middle" value={middle} onChangeText={setMiddle} style={authFormStyles.field} />
          <Text style={authFormStyles.label}>Last Name</Text>
          <TextField accessibilityLabel="Last name" placeholder="Last" value={last} onChangeText={setLast} style={authFormStyles.field} />
        </Card>
      </View>

      <View style={styles.footer}>
        <PrimaryButton accessibilityLabel="Continue" label="Continue" disabled={!canContinue} onPress={() => router.push(nextRoute)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  step: { fontSize: typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  footer: { padding: spacing.xl },
});
