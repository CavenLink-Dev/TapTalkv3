import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/native/Card';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { TextField } from '../../src/components/native/TextField';
import { colors, spacing, typography } from '../../src/theme/tokens';

// Next route depends on age & "who" selection — handled in full implementation via context
const nextRoute = '/registration/05-guardian' as Href;

export default function RegStep4DOB() {
  const router = useRouter();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const canContinue = day.length > 0 && month.length > 0 && year.length === 4;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>Step 4 of 10</Text>
        <Text style={styles.title}>Date of Birth</Text>
        <Text style={styles.hint}>
          Age determines registration path. Under 15 (self) is blocked. Under 18 (someone else) requires guardian verification.
        </Text>

        <Card>
          <View style={styles.row}>
            <TextField accessibilityLabel="Day" placeholder="DD" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} style={styles.dateField} />
            <TextField accessibilityLabel="Month" placeholder="MM" value={month} onChangeText={setMonth} keyboardType="number-pad" maxLength={2} style={styles.dateField} />
            <TextField accessibilityLabel="Year" placeholder="YYYY" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={[styles.dateField, styles.yearField]} />
          </View>
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
  title: { fontSize: typography.heading, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hint: { fontSize: typography.callout, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  row: { flexDirection: 'row', gap: spacing.sm },
  dateField: { flex: 1 },
  yearField: { flex: 2 },
  footer: { padding: spacing.xl },
});
