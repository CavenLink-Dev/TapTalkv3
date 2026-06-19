import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevSkip } from '../../src/components/DevSkip';
import { MascotImage } from '../../src/components/MascotImage';
import { SpeechBubble } from '../../src/components/SpeechBubble';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { DISPLAY_NAME_MAX, validateDisplayName } from '../../src/utils/displayName';
import { hapticSelection } from '../../src/utils/haptics';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';

const TOTAL_STEPS = 5;
const payRoute = '/pay' as Href;

type AppMode = 'simple' | 'guided' | 'advanced';

const THEMES = [
  { id: 'sunset', label: 'Tropical Sunset Theme', preview: '123 - ABC', color: '#FF7A18' },
  { id: 'ocean',  label: 'Ocean Breeze',          preview: '123 - ABC', color: '#0077B6' },
  { id: 'forest', label: 'Forest Green',           preview: '123 - ABC', color: '#2E7D32' },
];

const GOALS = [
  { id: 'family',    label: 'Talking with family',   emoji: '👨‍👩‍👧' },
  { id: 'friends',   label: 'Talking with friends',  emoji: '🤝' },
  { id: 'school',    label: 'School or work',         emoji: '📚' },
  { id: 'exploring', label: 'Just exploring',         emoji: '🔍' },
];

const NOTIF_OPTIONS = [
  { id: 'messages',  label: 'New messages',      defaultOn: true },
  { id: 'contacts',  label: 'Contact requests',  defaultOn: true },
  { id: 'reminders', label: 'Reminders',         defaultOn: false },
  { id: 'tips',      label: 'Tips and updates',  defaultOn: false },
];

// ─── Simple single-segment progress bar ─────────────────────────────────────
function StepProgressBar({ step, total }: { step: number; total: number }) {
  const fill = useRef(new Animated.Value(step / total)).current;
  useEffect(() => {
    Animated.spring(fill, { toValue: step / total, useNativeDriver: false, tension: 45, friction: 11 }).start();
  }, [step, total, fill]);
  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { width }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { flex: 1, height: 16, borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.softBlue },
  fill:  { height: '100%', backgroundColor: colors.primary, borderRadius: radii.pill },
});

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdultOnboarding() {
  const router = useRouter();
  const { dispatch } = useAppContext();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);

  // Step 1 – Name
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const displayCheck = useMemo(() => validateDisplayName(displayName), [displayName]);

  // Step 2 – Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 3 – Theme & text size
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [textScale,     setTextScale]     = useState(1.0);

  // Step 4 – Notifications
  const [notifs, setNotifs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_OPTIONS.map((n) => [n.id, n.defaultOn]))
  );

  // Step 1: speech bubble drives card entrance
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => { if (step !== 1) setIntroDone(true); }, [step]);

  // Per-step slide + fade
  const previousStep = useRef(step);
  const enterAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const direction = step >= previousStep.current ? 1 : -1;
    previousStep.current = step;
    enterAnim.setValue(0);
    slideAnim.setValue(24 * direction);
    Animated.parallel([
      Animated.timing(enterAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 110, friction: 16 }),
    ]).start();
  }, [step, enterAnim, slideAnim]);

  // Card slide-up for step 1
  const cardAnim      = useRef(new Animated.Value(0)).current;
  const formScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (introDone) {
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
    } else {
      cardAnim.setValue(0);
    }
  }, [introDone, cardAnim]);

  const isStepValid = useMemo(() => {
    if (step === 1) return firstName.trim().length > 1 && lastName.trim().length > 1 && displayCheck.valid;
    if (step === 2) return selectedGoals.length > 0;
    return true;
  }, [step, firstName, lastName, displayCheck.valid, selectedGoals]);

  const next = async () => {
    if (step < TOTAL_STEPS) {
      hapticSelection();
      setStep((s) => s + 1);
      return;
    }
    const legalName = `${firstName.trim()} ${lastName.trim()}`.trim();
    dispatch({
      type: 'SET_USER',
      payload: {
        legalName,
        displayName: displayName.trim(),
        name: legalName,
        nickname: displayName.trim(),
        role: 'myself',
        useCases: selectedGoals,
      },
    });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace(payRoute);
  };

  const back = () => {
    hapticSelection();
    setStep((s) => Math.max(1, s - 1));
  };

  const skip = () => {
    hapticSelection();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const cardTranslate = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [160, 0] });

  const buttonLabel = () => {
    if (step === TOTAL_STEPS) return "LET'S TALK!";
    if (step === 2) return 'LOOKS GOOD';
    return 'CONTINUE';
  };

  const toggleGoal = (id: string) => {
    hapticSelection();
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header: back | progress | skip ── */}
      <View style={styles.header}>
        <View style={styles.headerSlot}>
          {step > 1 ? (
            <TouchableOpacity onPress={back} style={styles.backIconBtn} hitSlop={10} accessibilityLabel="Go back">
              <Text style={styles.iconText}>{'\u2190'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.progressWrap}>
          <StepProgressBar step={step} total={TOTAL_STEPS} />
        </View>

        <View style={styles.headerSlot}>
          {step === 2 ? (
            <TouchableOpacity onPress={skip} style={styles.backIconBtn} hitSlop={10} accessibilityLabel="Skip this step">
              <Text style={styles.skipText}>{'\u23ED'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kbFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.animWrap, { opacity: enterAnim, transform: [{ translateX: slideAnim }] }]}>

          {/* ── Top: mascot + bubble or title block ── */}
          <View style={styles.topSection}>
            {step === 1 ? (
              <>
                <SpeechBubble
                  animationKey="adult-step1"
                  text={"Welcome to TapTalk!\nI'm Clo. What's your name?"}
                  onDone={() => setIntroDone(true)}
                />
                <MascotImage mascot="happy_smile" size={180} style={styles.heroMascot} />
              </>
            ) : null}
            {step === 2 ? <TitleBlock mascot="neutral_curious"    title={'WHAT WILL YOU USE\nTAPTALK FOR?'}          desc="Pick everything that applies. You can change this later in settings." /> : null}
            {step === 3 ? <TitleBlock mascot="winking_smile"      title={'CUSTOMISE YOUR\nEXPERIENCE'}              desc="Choose a theme and adjust text size to suit you." /> : null}
            {step === 4 ? <TitleBlock mascot="thinking_puzzled"   title={'KEEP IN TOUCH'}                          desc="Choose how you'd like to be notified inside TapTalk." /> : null}
            {step === 5 ? <TitleBlock mascot="excited_sparkle"    title={`WELCOME,\n${displayName.trim() || firstName.trim() || 'FRIEND'}!`} desc="You're all set. Tap below to start chatting." /> : null}
          </View>

          {/* ── White card ── */}
          <Animated.View style={[styles.card, { opacity: cardAnim, transform: [{ translateY: cardTranslate }] }]}>
            <ScrollView
              ref={formScrollRef}
              bounces
              alwaysBounceVertical
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.cardScroll, step === 1 && styles.cardScrollName]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* ── STEP 1: Name ── */}
              {step === 1 ? (
                <>
                  <FieldGroup label="YOUR NAME" desc="Enter your full first and last legal name">
                    <View style={styles.rowInputs}>
                      <View style={styles.flexCol}>
                        <Text style={styles.miniLabel}>First name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Alex"
                          placeholderTextColor={colors.textTertiary}
                          value={firstName}
                          onChangeText={setFirstName}
                          accessibilityLabel="First name"
                          returnKeyType="next"
                        />
                      </View>
                      <View style={styles.flexCol}>
                        <Text style={styles.miniLabel}>Last name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Jones"
                          placeholderTextColor={colors.textTertiary}
                          value={lastName}
                          onChangeText={setLastName}
                          accessibilityLabel="Last name"
                          returnKeyType="next"
                        />
                      </View>
                    </View>
                  </FieldGroup>

                  <FieldGroup label="DISPLAY NAME" desc="This is the name shown inside the app!">
                    <TextInput
                      style={[styles.input, displayCheck.error ? styles.inputError : null]}
                      placeholder="e.g. DragonSlayer20"
                      placeholderTextColor={colors.textTertiary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      maxLength={DISPLAY_NAME_MAX + 4}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      accessibilityLabel="Display name"
                      onFocus={() => setTimeout(() => formScrollRef.current?.scrollToEnd({ animated: true }), 300)}
                    />
                    {displayCheck.error ? (
                      <View style={styles.errorRow}>
                        <View style={styles.errorCircle}>
                          <Text style={styles.errorBang}>!</Text>
                        </View>
                        <Text style={styles.errorText}>{displayCheck.error}</Text>
                        <Text style={styles.errorTag}>ERROR</Text>
                      </View>
                    ) : null}
                  </FieldGroup>

                  <PrimaryButton
                    accessibilityLabel="Continue"
                    label="CONTINUE"
                    disabled={!isStepValid}
                    onPress={next}
                  />
                  <Text style={styles.privacyText}>
                    Check out this <Text style={styles.privacyLink}>LINK</Text> to see how we store your data
                  </Text>
                </>
              ) : null}

              {/* ── STEP 2: Goals ── */}
              {step === 2 ? (
                <>
                  <Text style={styles.insetHeading}>PICK YOUR GOALS</Text>
                  <View style={styles.goalGrid}>
                    {GOALS.map((goal) => {
                      const active = selectedGoals.includes(goal.id);
                      return (
                        <Pressable
                          key={goal.id}
                          onPress={() => toggleGoal(goal.id)}
                          accessibilityLabel={`Select goal: ${goal.label}`}
                          style={({ pressed }) => [
                            styles.goalCard,
                            active && styles.goalCardActive,
                            pressed && styles.pressedScale,
                          ]}
                        >
                          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                          <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>{goal.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {/* ── STEP 3: Theme & text size ── */}
              {step === 3 ? (
                <>
                  <Text style={styles.insetHeading}>PICK YOUR THEME</Text>
                  {THEMES.map((theme) => (
                    <Pressable
                      key={theme.id}
                      onPress={() => { hapticSelection(); setSelectedTheme(theme.id); }}
                      accessibilityLabel={`Select ${theme.label} theme`}
                      style={({ pressed }) => [
                        styles.themeRow,
                        selectedTheme === theme.id && styles.themeRowSelected,
                        pressed && styles.pressedScale,
                      ]}
                    >
                      <View style={[styles.themeChip, { backgroundColor: theme.color }]}>
                        <Text style={styles.themeChipText}>{theme.preview}</Text>
                      </View>
                      <Text style={[styles.themeLabel, selectedTheme === theme.id && styles.themeLabelSelected]}>
                        {theme.label}
                      </Text>
                    </Pressable>
                  ))}

                  <Text style={[styles.insetHeading, { marginTop: spacing.xl }]}>CUSTOMISE TEXT SIZE</Text>
                  <View style={styles.textSizeRow}>
                    <TextSizeLabel label="0.25x" size={12} active={textScale === 0.25} />
                    <TextSizeLabel label="1.0x"  size={17} active={textScale === 1.0} />
                    <TextSizeLabel label="2.0x"  size={24} active={textScale === 2.0} />
                  </View>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${((textScale - 0.25) / 1.75) * 100}%` }]} />
                    {[0.25, 1.0, 2.0].map((val) => (
                      <TouchableOpacity
                        key={val}
                        onPress={() => { hapticSelection(); setTextScale(val); }}
                        hitSlop={12}
                        style={[
                          styles.sliderDot,
                          { left: `${((val - 0.25) / 1.75) * 100}%` },
                          Math.abs(textScale - val) < 0.01 && styles.sliderDotActive,
                        ]}
                        accessibilityLabel={`Text size ${val}x`}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {/* ── STEP 4: Notifications ── */}
              {step === 4 ? (
                <>
                  <Text style={styles.insetHeading}>NOTIFICATIONS</Text>
                  {NOTIF_OPTIONS.map((opt) => (
                    <View key={opt.id} style={styles.notifRow}>
                      <Text style={styles.notifLabel}>{opt.label}</Text>
                      <Switch
                        value={notifs[opt.id]}
                        onValueChange={(val) => {
                          hapticSelection();
                          setNotifs((prev) => ({ ...prev, [opt.id]: val }));
                        }}
                        trackColor={{ false: colors.softBlue, true: colors.primary }}
                        thumbColor={colors.surface}
                        accessibilityLabel={`Toggle ${opt.label}`}
                      />
                    </View>
                  ))}
                  <Text style={styles.privacyText}>You can update these anytime in Settings.</Text>
                </>
              ) : null}

              {/* ── STEP 5: Done ── */}
              {step === 5 ? (
                <View style={styles.centeredCard}>
                  <CelebrationCircle />
                  <Text style={styles.doneNote}>
                    TapTalk is ready for you. Tap the button below and start talking!
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer button (all steps except step 1 which is inline) */}
            {step !== 1 ? (
              <View style={[styles.cardFooter, { paddingBottom: spacing.lg + insets.bottom }]}>
                <PrimaryButton
                  accessibilityLabel={step === TOTAL_STEPS ? 'Finish setup' : 'Continue'}
                  label={buttonLabel()}
                  disabled={!isStepValid}
                  onPress={next}
                />
                {step === 2 ? (
                  <Text style={styles.privacyText}>Answer honestly to get the most accurate results</Text>
                ) : null}
              </View>
            ) : null}
          </Animated.View>

        </Animated.View>
      </KeyboardAvoidingView>
      <DevSkip next="/pay" />
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TitleBlock({ mascot, title, desc }: { mascot: import('../../src/components/MascotImage').MascotKey; title: string; desc: string }) {
  return (
    <View style={styles.titleBlock}>
      <View style={styles.titleRow}>
        <MascotImage mascot={mascot} size={96} />
        <View style={styles.titleTextWrap}>
          <Text style={styles.bigTitle}>{title}</Text>
        </View>
      </View>
      <Text style={styles.titleDesc}>{desc}</Text>
    </View>
  );
}

function CelebrationCircle() {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 90, friction: 7 }).start();
  }, []); // scale is a stable Animated.Value ref; this effect should run once on mount
  return (
    <Animated.View style={[styles.celebCircle, { transform: [{ scale }] }]}>
      <Text style={styles.celebIcon}>{'\u2713'}</Text>
    </Animated.View>
  );
}

function FieldGroup({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {desc ? <Text style={styles.fieldDesc}>{desc}</Text> : null}
      {children}
    </View>
  );
}

function TextSizeLabel({ label, size, active }: { label: string; size: number; active?: boolean }) {
  return (
    <View style={styles.textSizeItem}>
      <Text style={styles.textSizeCaption}>{label}</Text>
      <Text style={[styles.textSizeA, { fontSize: size }, active && styles.textSizeAActive]}>A</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  animWrap:    { flex: 1 },
  safeArea:    { flex: 1, backgroundColor: colors.background },
  kbFlex:      { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerSlot:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { flex: 1, marginHorizontal: spacing.sm, justifyContent: 'center' },
  iconText:    { color: colors.text, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  skipText:    { color: colors.text, fontSize: 18 },

  topSection:  { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  heroMascot:  { marginTop: spacing.lg },

  titleBlock:    { width: '100%', paddingHorizontal: spacing.lg },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  titleTextWrap: { flex: 1 },
  bigTitle:      { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3, lineHeight: 24 },
  titleDesc:     { color: colors.textMuted, fontSize: typography.callout, lineHeight: 20, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    flex: 1,
    ...shadows.card,
  },
  cardScroll:     { padding: spacing.xl, paddingBottom: spacing.sm },
  cardScrollName: { paddingBottom: 80, gap: spacing.md },
  cardFooter:     { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.md },

  fieldGroup:  { marginBottom: spacing.lg },
  fieldLabel:  { color: colors.primary, fontSize: typography.subheading, fontWeight: '900', marginBottom: 2 },
  fieldDesc:   { color: colors.textMuted, fontSize: typography.callout, marginBottom: spacing.sm },
  miniLabel:   { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', marginBottom: 4 },
  rowInputs:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flexCol:     { flex: 1 },

  input:       { minHeight: 48, backgroundColor: colors.input, borderColor: colors.borderBlue, borderRadius: radii.input, borderWidth: 1.5, color: colors.text, fontSize: typography.callout, paddingHorizontal: 12, paddingVertical: 10 },
  inputError:  { borderColor: colors.danger },
  errorRow:    { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  errorCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  errorBang:   { color: colors.surface, fontSize: 12, fontWeight: '900' },
  errorText:   { color: colors.danger, fontSize: typography.callout, fontWeight: '600', flexShrink: 1 },
  errorTag:    { marginLeft: 'auto', color: colors.danger, fontSize: typography.caption, fontWeight: '900', letterSpacing: 1 },

  insetHeading: { color: colors.text, fontSize: typography.body, fontWeight: '900', textAlign: 'center', marginBottom: spacing.sm },

  goalGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  goalCard:       { flex: 1, minWidth: '44%', borderRadius: radii.card, backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  goalCardActive: { backgroundColor: colors.primaryDark },
  goalEmoji:      { fontSize: 32 },
  goalLabel:      { color: colors.surface, fontSize: typography.callout, fontWeight: '700', textAlign: 'center' },
  goalLabelActive:{ color: colors.surface },
  pressedScale:   { backgroundColor: colors.mascot, transform: [{ scale: 0.97 }] },

  themeRow:         { flexDirection: 'row', alignItems: 'center', borderRadius: radii.card, backgroundColor: colors.primary, padding: spacing.md, marginBottom: spacing.sm },
  themeRowSelected: { backgroundColor: colors.primaryDark },
  themeChip:        { borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, minWidth: 90, alignItems: 'center', marginRight: spacing.md },
  themeChipText:    { color: colors.surface, fontWeight: '800', fontSize: typography.callout },
  themeLabel:       { flex: 1, color: colors.surface, fontSize: typography.callout, fontWeight: '700' },
  themeLabelSelected: { color: colors.surface },

  textSizeRow:     { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: spacing.sm },
  textSizeItem:    { alignItems: 'center', flex: 1 },
  textSizeCaption: { color: colors.textMuted, fontSize: typography.caption, marginBottom: 2 },
  textSizeA:       { fontWeight: '800', color: colors.text },
  textSizeAActive: { color: colors.primary },
  sliderTrack:     { height: 10, backgroundColor: colors.softBlue, borderRadius: 5, marginTop: spacing.lg, marginHorizontal: spacing.md, position: 'relative' },
  sliderFill:      { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  sliderDot:       { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.borderBlue, top: -4, marginLeft: -9 },
  sliderDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  notifRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.borderBlue, paddingVertical: spacing.sm },
  notifLabel: { color: colors.text, fontSize: typography.body, fontWeight: '600', flex: 1 },

  centeredCard: { alignItems: 'center', paddingVertical: spacing.sm },
  celebCircle:  { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
  celebIcon:    { color: colors.surface, fontSize: 40, fontWeight: '900' },
  doneNote:     { color: colors.textMuted, fontSize: typography.callout, textAlign: 'center', lineHeight: 22, maxWidth: 260 },

  privacyText:  { color: colors.textMuted, fontSize: typography.caption, textAlign: 'center', marginTop: spacing.sm },
  privacyLink:  { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
});
