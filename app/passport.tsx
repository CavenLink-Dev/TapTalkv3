/**
 * My Communication Passport — a plain-language profile page.
 *
 * "I communicate like this. This helps. This overwhelms me. These are my
 * access needs. Call these people." Support workers, teachers, and hospital
 * staff can read (or be shown) this page to help the user faster.
 *
 * Every field saves to AppContext as you type (debounced persistence handles
 * the disk write), and the whole passport can be shared as plain text.
 * Reached from Profile → User Profile → Communication Passport.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../src/components/native/Card';
import { PrimaryButton } from '../src/components/native/PrimaryButton';
import { TextField } from '../src/components/native/TextField';
import { useAppContext } from '../src/hooks/useAppContext';
import { useTheme } from '../src/theme/useTheme';
import { radii, spacing, typography } from '../src/theme/tokens';
import { fonts } from '../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../src/utils/haptics';
import type { CommunicationPassport, PassportContact } from '../src/context/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type PassportTextKey = Exclude<keyof CommunicationPassport, 'trustedContacts'>;

const SECTIONS: {
  key: PassportTextKey;
  icon: IoniconName;
  title: string;
  placeholder: string;
}[] = [
  {
    key: 'howICommunicate',
    icon: 'chatbubbles-outline',
    title: 'How I communicate',
    placeholder: 'e.g. I use this app to speak. Please give me time to build my sentence.',
  },
  {
    key: 'whatHelps',
    icon: 'sunny-outline',
    title: 'What helps me',
    placeholder: 'e.g. Short sentences. One question at a time. Show me, don’t just tell me.',
  },
  {
    key: 'whatOverwhelms',
    icon: 'thunderstorm-outline',
    title: 'What overwhelms me',
    placeholder: 'e.g. Loud rooms, bright lights, being rushed, too many people talking.',
  },
  {
    key: 'accessNeeds',
    icon: 'accessibility-outline',
    title: 'My access needs',
    placeholder: 'e.g. I need my iPad within reach at all times. I may need help with stairs.',
  },
  {
    key: 'importantInfo',
    icon: 'medkit-outline',
    title: 'Important to know',
    placeholder: 'e.g. Medication, allergies, routines, comfort items, or anything else that matters.',
  },
];

function buildPassportText(
  name: string,
  passport: CommunicationPassport,
): string {
  const lines: string[] = [`Communication Passport${name ? ` — ${name}` : ''}`, ''];
  SECTIONS.forEach((s) => {
    const value = passport[s.key].trim();
    if (value) {
      lines.push(`${s.title}:`, value, '');
    }
  });
  if (passport.trustedContacts.length > 0) {
    lines.push('Trusted contacts:');
    passport.trustedContacts.forEach((c) => {
      lines.push(`  ${c.name}${c.relationship ? ` (${c.relationship})` : ''}${c.phone ? ` — ${c.phone}` : ''}`);
    });
    lines.push('');
  }
  lines.push('Made with TapTalk.');
  return lines.join('\n');
}

export default function CommunicationPassportScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const t = useTheme();
  const passport = state.passport;

  // Add-contact draft
  const [contactName, setContactName] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const setField = useCallback(
    (key: PassportTextKey, value: string) => {
      dispatch({ type: 'SET_PASSPORT', payload: { [key]: value } });
    },
    [dispatch],
  );

  const addContact = useCallback(() => {
    const name = contactName.trim();
    if (!name) return;
    hapticSuccess();
    const contact: PassportContact = {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      relationship: contactRelationship.trim(),
      phone: contactPhone.trim(),
    };
    dispatch({
      type: 'SET_PASSPORT',
      payload: { trustedContacts: [...passport.trustedContacts, contact] },
    });
    setContactName('');
    setContactRelationship('');
    setContactPhone('');
    setAddingContact(false);
  }, [contactName, contactRelationship, contactPhone, dispatch, passport.trustedContacts]);

  const removeContact = useCallback(
    (id: string) => {
      const contact = passport.trustedContacts.find((c) => c.id === id);
      Alert.alert(
        'Remove contact?',
        contact ? `${contact.name} will be removed from your passport.` : 'This contact will be removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              hapticSelection();
              dispatch({
                type: 'SET_PASSPORT',
                payload: { trustedContacts: passport.trustedContacts.filter((c) => c.id !== id) },
              });
            },
          },
        ],
      );
    },
    [dispatch, passport.trustedContacts],
  );

  const sharePassport = useCallback(async () => {
    hapticSelection();
    const name = state.user.displayName || state.user.nickname || state.user.name;
    try {
      await Share.share({
        title: 'Communication Passport',
        message: buildPassportText(name, passport),
      });
    } catch {
      Alert.alert('Share not available', 'Sharing could not start on this device.', [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [passport, state.user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => { hapticSelection(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: t.colors.text }]}>
          Communication Passport
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          <Text style={[styles.pageIntro, { color: t.colors.textMuted }]}>
            A page you (or a caregiver) can show to support workers, teachers, or
            hospital staff so they can help faster. Everything saves automatically
            and stays on this device until you share it.
          </Text>

          {SECTIONS.map((section) => (
            <Card key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: t.colors.selectionBg }]}>
                  <Ionicons name={section.icon} size={20} color={t.colors.primary} />
                </View>
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, { color: t.colors.text }]}
                >
                  {section.title}
                </Text>
              </View>
              <TextInput
                accessibilityLabel={section.title}
                accessibilityHint="Free text. Everything you type saves automatically."
                multiline
                value={passport[section.key]}
                onChangeText={(text) => setField(section.key, text)}
                placeholder={section.placeholder}
                placeholderTextColor={t.colors.textTertiary}
                style={[
                  styles.textArea,
                  {
                    color: t.colors.text,
                    backgroundColor: t.colors.input,
                    borderColor: t.colors.border,
                  },
                ]}
                textAlignVertical="top"
              />
            </Card>
          ))}

          {/* ── Trusted contacts ── */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.colors.selectionBg }]}>
                <Ionicons name="people-outline" size={20} color={t.colors.primary} />
              </View>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: t.colors.text }]}>
                Trusted contacts
              </Text>
            </View>

            {passport.trustedContacts.length === 0 && !addingContact ? (
              <Text style={[styles.emptyContacts, { color: t.colors.textMuted }]}>
                Add the people who know you best — family, carers, or your therapist.
              </Text>
            ) : null}

            {passport.trustedContacts.map((contact, i) => (
              <View
                key={contact.id}
                style={[
                  styles.contactRow,
                  i > 0 && [styles.contactRowDivider, { borderTopColor: t.colors.border }],
                ]}
              >
                <View style={[styles.contactAvatar, { backgroundColor: t.colors.input }]}>
                  <Text style={[styles.contactInitial, { color: t.colors.primary }]}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactCopy}>
                  <Text style={[styles.contactName, { color: t.colors.text }]} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactMeta, { color: t.colors.textMuted }]} numberOfLines={1}>
                    {[contact.relationship, contact.phone].filter(Boolean).join(' · ') || 'No details'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${contact.name}`}
                  onPress={() => removeContact(contact.id)}
                  style={({ pressed }) => [styles.contactRemove, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="trash-outline" size={20} color={t.colors.danger} />
                </Pressable>
              </View>
            ))}

            {addingContact ? (
              <View style={styles.addForm}>
                <TextField
                  accessibilityLabel="Contact name"
                  placeholder="Name"
                  value={contactName}
                  onChangeText={setContactName}
                  autoFocus
                />
                <TextField
                  accessibilityLabel="Relationship, like Mum or Support worker"
                  placeholder="Relationship (e.g. Mum, Support worker)"
                  value={contactRelationship}
                  onChangeText={setContactRelationship}
                />
                <TextField
                  accessibilityLabel="Phone number"
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />
                <View style={styles.addFormActions}>
                  <PrimaryButton
                    accessibilityLabel="Save contact"
                    label="Save Contact"
                    disabled={contactName.trim().length === 0}
                    onPress={addContact}
                    style={styles.addFormButton}
                  />
                  <PrimaryButton
                    accessibilityLabel="Cancel adding contact"
                    label="Cancel"
                    variant="secondary"
                    onPress={() => {
                      hapticSelection();
                      setAddingContact(false);
                    }}
                    style={styles.addFormButton}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a trusted contact"
                onPress={() => {
                  hapticSelection();
                  setAddingContact(true);
                }}
                style={({ pressed }) => [
                  styles.addContactBtn,
                  { borderColor: t.colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="add" size={20} color={t.colors.primary} />
                <Text style={[styles.addContactText, { color: t.colors.primary }]}>Add Contact</Text>
              </Pressable>
            )}
          </Card>

          {/* ── Share ── */}
          <PrimaryButton
            accessibilityLabel="Share my Communication Passport"
            accessibilityHint="Opens the share sheet with your passport as plain text"
            label="Share Passport"
            onPress={sharePassport}
            style={styles.shareButton}
          />
          <Text style={[styles.shareCaption, { color: t.colors.textTertiary }]}>
            Shares a plain-text copy. Nothing is uploaded by TapTalk.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: { width: 44 },

  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 48,
  },
  pageIntro: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },

  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.displayHeavy,
    fontSize: typography.callout,
  },
  textArea: {
    minHeight: 88,
    borderRadius: radii.card,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 22,
  },

  emptyContacts: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  contactRowDivider: {
    borderTopWidth: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
  },
  contactCopy: { flex: 1 },
  contactName: {
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  contactMeta: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    marginTop: 2,
  },
  contactRemove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: radii.button,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addContactText: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  addForm: {
    gap: spacing.sm,
  },
  addFormActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addFormButton: { flex: 1 },

  shareButton: {
    marginTop: spacing.xs,
  },
  shareCaption: {
    fontFamily: fonts.body,
    fontSize: typography.caption,
    textAlign: 'center',
  },
});
