import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { seedSymbolBrainDatabase } from '../data/sqlite/seedSymbolBrain';
import { attributionService } from '../features/symbol-brain/attributionService';
import { AttributionRecord } from '../features/symbol-brain/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

export function SymbolAttributionScreen() {
  const [rows, setRows] = useState<AttributionRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await seedSymbolBrainDatabase();
      const next = await attributionService.getSummary();
      if (!cancelled) setRows(next);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Symbol Licences</Text>
      <Text style={styles.intro}>
        TapTalk stores symbol source, author, licence, and attribution records locally.
      </Text>
      {rows.map(row => (
        <View key={row.id} style={styles.card}>
          <Text style={styles.source}>{row.source}</Text>
          <Text style={styles.body}>{row.attribution_text}</Text>
          <Text style={styles.meta}>Author: {row.author}</Text>
          <Text style={styles.meta}>Licence: {row.license}</Text>
          {row.source_url ? <Text style={styles.link}>{row.source_url}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '900',
    color: colors.text,
  },
  intro: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    fontSize: typography.callout,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  source: {
    fontSize: typography.subheading,
    fontWeight: '900',
    color: colors.text,
  },
  body: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.callout,
  },
  link: {
    marginTop: spacing.sm,
    color: colors.primaryDark,
    fontSize: typography.caption,
  },
});
