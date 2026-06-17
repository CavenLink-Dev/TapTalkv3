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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MascotImage, MascotKey } from '../../src/components/MascotImage';
import { SpeechBubble } from '../../src/components/SpeechBubble';
import { ProgressBar } from '../../src/components/native/ProgressBar';
import { PrimaryButton } from '../../src/components/native/PrimaryButton';
import { useAppContext } from '../../src/hooks/useAppContext';
import { DISPLAY_NAME_MAX, validateDisplayName } from '../../src/utils/displayName';
import { hapticSelection } from '../../src/utils/haptics';
import { hashPin } from '../../src/utils/pin';
import { EMAIL_PATTERN } from '../../src/utils/validation';
import { colors, radii, shadows, spacing, typography } from '../../src/theme/tokens';

const TOTAL_STEPS = 8;
const payRoute = '/pay' as Href;

type VerifyState = 'idle' | 'failed' | 'success';
type AppMode = 'simple' | 'guided' | 'advanced';

const THEMES = [
  { id: 'sunset', label: 'Tropical Sunset Theme', preview: '123 - ABC', color: '#FF7A18' },
  { id: 'ocean',  label: 'Ocean Breeze',          preview: '123 - ABC', color: '#0077B6' },
  { id: 'forest', label: 'Forest Green',           preview: '123 - ABC', color: '#2E7D32' },
];

export default function Onboarding() {
  const router = useRouter();
  const { dispatch } = useAppContext();

  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName]     = useState('');
  const [lastName,  setLastName]      = useState('');
  const [displayName, setDisplayName] = useState('');

  // Step 3
  const [lockEnabled, setLockEnabled] = useState(true);
  const [pin, setPin]               = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emailCode, setEmailCode]     = useState('');

  // Step 4
  const [timeoutHours, setTimeoutHours] = useState('');

  // Step 5
  const [verifyCode, setVerifyCode]   = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');

  // Steps 7-8
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [textScale, setTextScale]         = useState(1.0);
  const [appMode, setAppMode]             = useState<AppMode | null>(null);

  const displayCheck = useMemo(() => validateDisplayName(displayName), [displayName]);

  // Step 1: form only appears after Clo finishes speaking
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    if (step !== 1) setIntroDone(true);
  }, [step]);

  // Per-step entrance animation: subtle right-to-left slide + fade.
  // Forward (step grows)  → enter from the right (+24).
  // Back   (step shrinks) → enter from the left  (-24).
  const previousStep = useRef(step);
  const enterAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const direction = step >= previousStep.current ? 1 : -1;
    previousStep.current = step;

    enterAnim.setValue(0);
    slideAnim.setValue(24 * direction);

    Animated.parallel([
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 110,
        friction: 16,
      }),
    ]).start();
  }, [step, enterAnim, slideAnim]);

  // Card slides up from below after Clo finishes typing (step 1 only)
  const cardAnim = useRef(new Animated.Value(0)).current;
  const formScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (introDone) {
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }).start();
    } else {
      cardAnim.setValue(0);
    }
  }, [introDone, cardAnim]);

  const isStepValid = useMemo(() => {
    if (step === 1) {
      return firstName.trim().length > 1 && lastName.trim().length > 1 && displayCheck.valid;
    }
    if (step === 3) {
      const pinOk = !lockEnabled || (pin.length === 6 && pin === confirmPin);
      return pinOk && EMAIL_PATTERN.test(parentEmail.trim()) && emailCode.length === 6;
    }
    if (step === 4) return Number(timeoutHours) > 0;
    if (step === 5) return false; // verify happens via the in-card VERIFY button
    if (step === 8) return appMode !== null;
    return true;
  }, [
    step, firstName, lastName, displayCheck.valid, lockEnabled, pin, confirmPin,
    parentEmail, emailCode, timeoutHours, verifyState, appMode,
  ]);

  // On a successful verify, skip the redundant "VERIFICATION SUCCESS" banner
  // and advance straight into the canonical Setup-Complete screen (step 6).
  const handleVerify = () => {
    if (verifyCode.length === 6) {
      setVerifyState('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setTimeout(() => setStep(6), 220);
    } else {
      setVerifyState('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    }
  };

  const next = async () => {
    if (step < TOTAL_STEPS) {
      hapticSelection();
      setStep((s) => s + 1);
      return;
    }
    const legalName = `${firstName.trim()} ${lastName.trim()}`.trim();
    dispatch({ type: 'SET_USER', payload: { legalName, displayName: displayName.trim(), name: legalName, nickname: displayName.trim(), role: 'guardian', useCases: [] } });
    const hashedPin = lockEnabled ? await hashPin(pin) : '';
    dispatch({ type: 'SET_PARENT', payload: { lockEnabled, pin: hashedPin, email: parentEmail.trim(), timeoutHours: Number(timeoutHours) || 0 } });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    router.replace(payRoute);
  };

  const back = () => {
    hapticSelection();
    setStep((s) => Math.max(1, s - 1));
  };
  const skip = () => {
    hapticSelection();
    setStep((s) => s + 1);
  };

  const cardTranslate = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [160, 0] });

  const buttonLabel = () => {
    if (step === 2) return 'GET STARTED';
    if (step === TOTAL_STEPS) return "LET'S GO!";
    return 'CONTINUE';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ── Progress header (single flex row: back | progress | skip).
          Both icons and the pill bar share the same centered baseline. ── */}
      <View style={styles.header}>
        <View style={styles.headerSlot}>
          {step > 1 ? (
            <TouchableOpacity onPress={back} style={styles.backIconBtn} hitSlop={10} accessibilityLabel="Go back">
              <Text style={styles.iconText}>{'\u2190'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.progressWrap}>
          <ProgressBar currentStep={step} />
        </View>

        <View style={styles.headerSlot}>
          {step === 4 ? (
            <TouchableOpacity onPress={skip} style={styles.backIconBtn} hitSlop={10} accessibilityLabel="Skip this step">
              <Text style={styles.skipText}>{'\u23ED'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Main content. KeyboardAvoidingView owns vertical resizing while the
          card ScrollView owns form scrolling. Keeping one strategy avoids
          iOS 16 inset conflicts on iPhone 13 Pro Max. ── */}
      <KeyboardAvoidingView
        style={styles.kbFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.animWrap, { opacity: enterAnim, transform: [{ translateX: slideAnim }] }]}>

          {/* Top section – mascot + speech bubble */}
          <View style={styles.topSection}>
            {step === 1 ? (
              <>
                <SpeechBubble
                  animationKey="step1"
                  text={"Welcome to TapTalk! I'm Clo.\nBefore we get started, what would\nyou like me to call you?"}
                  onDone={() => setIntroDone(true)}
                />
                <MascotImage mascot="happy_smile" size={180} style={styles.heroMascot} />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <SpeechBubble
                  animationKey="step2"
                  text={`Please give a parent or guardian your device so they can answer the following few questions. Don't worry, it won't take long!`}
                />
                <MascotImage mascot="happy_grin" size={228} style={styles.heroMascot} />
              </>
            ) : null}

            {step === 3 ? <TitleBlock mascot="sleeping"           title={'PARENT/GUARDIAN\nCONTROL'}                   desc="This next part you'll need a trusted adult to help. When completed please ask an adult to help verify the information by using their email!" /> : null}
            {step === 4 ? <TitleBlock mascot="thinking_puzzled"   title={'SET PARENTAL\nLOCK AND TIMEOUT'}            desc="Choose how long TapTalk should wait before automatically locking due to inactivity. This can be changed in settings later." /> : null}
            {step === 5 ? (
              <TitleBlock
                mascot={verifyState === 'failed' ? 'sad_worried' : 'neutral_curious'}
                title={'ENTER YOUR\nVERIFICATION CODE'}
                desc="Check your junk folder for a 6 digit combination"
              />
            ) : null}
            {step === 6 ? <TitleBlock mascot="happy_looking_up"   title={'SETUP COMPLETE\nDEVICE IS READY!'}          desc="We have completed the boring part. Now I will personalize your TapTalk suited just for you!" /> : null}
            {step === 7 ? <TitleBlock mascot="winking_smile"      title={'CUSTOMIZING YOUR\nAPP FEATURES!'}           desc="Change themes, choose your favourite colors, and adjust text and button sizes." /> : null}
            {step === 8 ? <TitleBlock mascot="happy_grin"         title={'APPS SIMPLICITY\nCUSTOMIZATIONS!'}          desc="Choose how you'd like to use TapTalk: simple, guided, or advanced." /> : null}
          </View>

          {/* White bottom card */}
          <Animated.View style={[styles.card, { opacity: cardAnim, transform: [{ translateY: cardTranslate }] }]}>
            <ScrollView
              ref={formScrollRef}
              bounces
              alwaysBounceVertical
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.cardScroll, step === 1 && styles.cardScrollName]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentInsetAdjustmentBehavior="always"
            >
              {/* ── STEP 1: Name entry ── */}
              {step === 1 ? (
                <>
                  <FieldGroup label="NAME" desc="Enter your full first and last legal name">
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

                  <FieldGroup label="DISPLAY NAME" desc="This is the name that will be displayed on the app!">
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
                      onFocus={() => {
                        setTimeout(() => formScrollRef.current?.scrollToEnd({ animated: true }), 300);
                      }}
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

                  {/* Inline footer for step 1: keeps Continue scrollable above
                      the keyboard so the fields are never hidden on iOS 16+. */}
                  <PrimaryButton
                    accessibilityLabel="Continue"
                    label="CONTINUE"
                    disabled={!isStepValid}
                    onPress={next}
                  />
                  <Text style={styles.privacyText}>
                    Check out this <Text style={styles.privacyLink}>LINK</Text> to see how we store confidential data
                  </Text>
                </>
              ) : null}

              {/* ── STEP 2: Heads Up ── */}
              {step === 2 ? (
                <View style={styles.headsUpWrap}>
                  <Text style={styles.headsUpTitle}>Heads Up!</Text>
                  <Text style={styles.headsUpBody}>
                    You will <Text style={styles.underline}>need</Text> a grown up or parent for this next page
                  </Text>
                </View>
              ) : null}

              {/* ── STEP 3: Parental control ── */}
              {step === 3 ? (
                <>
                  <FieldGroup label="PARENTAL LOCK" desc="Would you like to enable parental lock?">
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>Unlock TapTalk with your 6-digit PIN</Text>
                      <Switch value={lockEnabled} onValueChange={setLockEnabled} trackColor={{ false: colors.softBlue, true: colors.primary }} thumbColor={colors.surface} />
                    </View>
                  </FieldGroup>

                  {lockEnabled ? (
                    <FieldGroup label="ENTER 6-DIGIT LOCK" desc="Always make sure to remember this!">
                      <View style={styles.rowInputs}>
                        <TextInput style={[styles.input, styles.flexInput]} placeholder="6-Digit Numbers (0-9)" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={6} secureTextEntry value={pin} onChangeText={setPin} accessibilityLabel="6-digit PIN" />
                        <TextInput style={[styles.input, styles.flexInput]} placeholder="Re-Enter" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={6} secureTextEntry value={confirmPin} onChangeText={setConfirmPin} accessibilityLabel="Confirm PIN" />
                        <CheckCircle active={pin.length === 6 && pin === confirmPin} />
                      </View>
                    </FieldGroup>
                  ) : null}

                  <FieldGroup label="PARENTAL EMAIL" desc="Please enter your email to receive a verification code!">
                    <View style={styles.rowInputs}>
                      <TextInput style={[styles.input, styles.flexInput]} placeholder="Enter Email" placeholderTextColor={colors.textTertiary} keyboardType="email-address" autoCapitalize="none" value={parentEmail} onChangeText={setParentEmail} accessibilityLabel="Parent email" />
                      <TextInput style={[styles.input, styles.flexInput]} placeholder="Code Here" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={6} value={emailCode} onChangeText={setEmailCode} accessibilityLabel="Email code" />
                      <CheckCircle active={EMAIL_PATTERN.test(parentEmail) && emailCode.length === 6} />
                    </View>
                    <TouchableOpacity hitSlop={8}>
                      <Text style={styles.resendText}>Resend Email</Text>
                    </TouchableOpacity>
                  </FieldGroup>
                </>
              ) : null}

              {/* ── STEP 4: Timeout ── */}
              {step === 4 ? (
                <View>
                  <Text style={styles.insetHeading}>INACTIVITY TIMEOUT</Text>
                  <Text style={styles.insetBody}>When should TapTalk consider your child inactive?</Text>
                  <TextInput style={[styles.input, styles.centeredInput]} placeholder="Hours" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" value={timeoutHours} onChangeText={setTimeoutHours} accessibilityLabel="Timeout hours" />
                  <Text style={[styles.insetBody, { marginTop: spacing.md }]}>Is The Hours Below Correct?</Text>
                  <TextInput style={[styles.input, styles.centeredInput]} placeholder="Time Set" placeholderTextColor={colors.textTertiary} value={timeoutHours ? `${timeoutHours} Hour${Number(timeoutHours) !== 1 ? 's' : ''}` : ''} editable={false} accessibilityLabel="Confirmed timeout" />
                </View>
              ) : null}

              {/* ── STEP 5: Verification ── */}
              {step === 5 ? (
                <View style={styles.centeredCard}>
                  {verifyState === 'failed' ? (
                    <>
                      <Text style={[styles.insetHeading, { color: colors.danger }]}>VERIFICATION FAILED</Text>
                      <BounceCircle color={colors.danger} icon={'\u2715'} />
                      <Text style={styles.resultNote}>The process was incorrect, please try again</Text>
                      <PrimaryButton accessibilityLabel="Retry" label="REDO" onPress={() => { setVerifyCode(''); setVerifyState('idle'); }} style={styles.resultBtn} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.insetBody}>Enter the 6-digit code sent to the parent's email</Text>
                      <TextInput style={[styles.input, styles.centeredInput, { marginTop: spacing.md, alignSelf: 'stretch' }]} placeholder="6-Digit Code" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={6} value={verifyCode} onChangeText={setVerifyCode} accessibilityLabel="Verification code" />
                      <PrimaryButton accessibilityLabel="Submit code" label="VERIFY" disabled={verifyCode.length < 6} onPress={handleVerify} style={{ marginTop: spacing.lg, alignSelf: 'stretch' }} />
                    </>
                  )}
                </View>
              ) : null}

              {/* ── STEP 6: Setup complete ── */}
              {step === 6 ? (
                <View style={styles.centeredCard}>
                  <Text style={[styles.insetHeading, { color: colors.success }]}>VERIFICATION SUCCESS</Text>
                  <BounceCircle color={colors.success} icon={'\u2713'} />
                  <Text style={styles.resultNote}>Please answer the following questions as best you can</Text>
                </View>
              ) : null}

              {/* ── STEP 7: Theme & text size ── */}
              {step === 7 ? (
                <>
                  <Text style={styles.insetHeading}>PICK YOUR THEME</Text>
                  {THEMES.map((theme) => (
                    <Pressable key={theme.id} onPress={() => { hapticSelection(); setSelectedTheme(theme.id); }} style={({ pressed }) => [styles.themeRow, selectedTheme === theme.id && styles.themeRowSelected, pressed && styles.pressedScale]} accessibilityLabel={`Select ${theme.label} theme`}>
                      <View style={[styles.themeChip, { backgroundColor: theme.color }]}>
                        <Text style={styles.themeChipText}>{theme.preview}</Text>
                      </View>
                      <Text style={[styles.themeLabel, selectedTheme === theme.id && styles.themeLabelSelected]}>{theme.label}</Text>
                    </Pressable>
                  ))}
                  <Text style={[styles.insetHeading, { marginTop: spacing.xl }]}>CUSTOMIZE TEXT SIZE</Text>
                  <View style={styles.textSizeRow}>
                    <TextSizeLabel label="0.25x" size={12} active={textScale === 0.25} />
                    <TextSizeLabel label="1.0x"  size={17} active={textScale === 1.0} />
                    <TextSizeLabel label="2.0x"  size={24} active={textScale === 2.0} />
                  </View>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${((textScale - 0.25) / 1.75) * 100}%` }]} />
                    {[0.25, 1.0, 2.0].map((val) => (
                      <TouchableOpacity key={val} onPress={() => { hapticSelection(); setTextScale(val); }} hitSlop={12}
                        style={[styles.sliderDot, { left: `${((val - 0.25) / 1.75) * 100}%` }, Math.abs(textScale - val) < 0.01 && styles.sliderDotActive]}
                        accessibilityLabel={`Text size ${val}x`}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {/* ── STEP 8: Simplicity mode ── */}
              {step === 8 ? (
                <>
                  <Text style={styles.insetHeading}>PICK YOUR FUNCTIONS</Text>
                  {([
                    { id: 'simple',   label: 'Simple',   bars: 1, desc: 'Less buttons, easier to navigate, straight forward selections' },
                    { id: 'guided',   label: 'Guided',   bars: 2, desc: 'More buttons, harder to navigate, more options/selections' },
                    { id: 'advanced', label: 'Advanced', bars: 3, desc: 'Most buttons, complex to navigate, more advanced options/selections/settings' },
                  ] as const).map((opt) => (
                    <Pressable key={opt.id} onPress={() => { hapticSelection(); setAppMode(opt.id); }} style={({ pressed }) => [styles.modeCard, appMode === opt.id && styles.modeCardSelected, pressed && styles.pressedScale]} accessibilityLabel={`Select ${opt.label} mode`}>
                      <View style={styles.modeCardInner}>
                        <Text style={[styles.modeLabel, appMode === opt.id && styles.modeLabelSelected]}>{opt.label}</Text>
                        <BarChart bars={opt.bars} active={appMode === opt.id} />
                      </View>
                      <Text style={[styles.modeDesc, appMode === opt.id && styles.modeDescSelected]}>{opt.desc}</Text>
                    </Pressable>
                  ))}
                </>
              ) : null}
            </ScrollView>

            {/* Footer (hidden on steps that own their button inline) */}
            {step !== 1 && step !== 5 ? (
              <View style={styles.cardFooter}>
                <PrimaryButton
                  accessibilityLabel={step === TOTAL_STEPS ? 'Finish onboarding' : 'Continue'}
                  label={buttonLabel()}
                  disabled={!isStepValid}
                  onPress={next}
                />
                {step === 3 ? (
                  <Text style={styles.privacyText}>
                    Check out this <Text style={styles.privacyLink}>LINK</Text> to see how we store confidential data
                  </Text>
                ) : null}
                {step === 2 ? <Text style={styles.privacyText}>Answer honestly to get the most accurate results</Text> : null}
              </View>
            ) : null}
          </Animated.View>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TitleBlock({ mascot, title, desc }: { mascot: MascotKey; title: string; desc: string }) {
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

function BounceCircle({ color, icon }: { color: string; icon: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 90, friction: 7 }).start();
  }, [scale, color]);
  return (
    <Animated.View style={[styles.resultCircle, { backgroundColor: color, transform: [{ scale }] }]}>
      <Text style={styles.resultIcon}>{icon}</Text>
    </Animated.View>
  );
}

function CheckCircle({ active }: { active: boolean }) {
  return (
    <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
      <Text style={styles.checkMark}>{'\u2713'}</Text>
    </View>
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

function BarChart({ bars, active }: { bars: number; active: boolean }) {
  return (
    <View style={styles.barChart}>
      {[1, 2, 3].map((b) => (
        <View key={b} style={[styles.bar, { height: b === 1 ? 10 : b === 2 ? 16 : 22 }, b <= bars && (active ? styles.barActive : styles.barFilled)]} />
      ))}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  animWrap: { flex: 1 },
  bar: { width: 8, borderRadius: 3, backgroundColor: colors.softBlue, marginLeft: 2, alignSelf: 'flex-end' },
  barActive: { backgroundColor: colors.primary },
  barChart: { flexDirection: 'row', alignItems: 'flex-end' },
  barFilled: { backgroundColor: colors.textMuted },
  bigTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3, lineHeight: 24 },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,   // 44 px — matches spec
    borderTopRightRadius: radii.sheet,
    flex: 1,
    ...shadows.card,
  },
  cardFooter: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.md },
  cardScroll: { padding: spacing.xl, paddingBottom: spacing.sm },
  cardScrollName: { paddingBottom: 60, gap: spacing.md },
  centeredCard: { alignItems: 'center', paddingVertical: spacing.sm },
  centeredInput: { textAlign: 'center', fontSize: typography.subheading, fontWeight: '700' },
  checkCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.softBlue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  checkCircleActive: { backgroundColor: colors.success },
  checkMark: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  errorBang: { color: colors.surface, fontSize: 12, fontWeight: '900' },
  errorCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  errorTag: { marginLeft: 'auto', color: colors.danger, fontSize: typography.caption, fontWeight: '900', letterSpacing: 1 },
  errorText: { color: colors.danger, fontSize: typography.callout, fontWeight: '600', flexShrink: 1 },
  fieldDesc: { color: colors.textMuted, fontSize: typography.callout, marginBottom: spacing.sm },
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { color: colors.primary, fontSize: typography.subheading, fontWeight: '900', marginBottom: 2 },
  flexCol: { flex: 1 },
  flexInput: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg, // 16
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerSlot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headsUpBody: { color: colors.text, fontSize: 20, lineHeight: 30, textAlign: 'center', marginTop: spacing.lg },
  headsUpTitle: { color: colors.text, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  headsUpWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 220, paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  heroMascot: { marginTop: spacing.lg },
  iconText: { color: colors.text, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  insetBody: { color: colors.textMuted, fontSize: typography.callout, textAlign: 'center', marginBottom: spacing.sm },
  insetHeading: { color: colors.text, fontSize: typography.body, fontWeight: '900', textAlign: 'center', marginBottom: spacing.sm },
  input: { minHeight: 48, backgroundColor: colors.input, borderColor: colors.borderBlue, borderRadius: radii.input, borderWidth: 1.5, color: colors.text, fontSize: typography.callout, paddingHorizontal: 12, paddingVertical: 10 },
  inputError: { borderColor: colors.danger },
  kbFlex: { flex: 1 },
  miniLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700', marginBottom: 4 },
  modeCard: { borderRadius: radii.card, borderWidth: 2, borderColor: colors.borderBlue, backgroundColor: colors.surface, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  modeCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modeCardSelected: { borderColor: colors.primary, backgroundColor: colors.softBlue },
  modeDesc: { color: colors.textMuted, fontSize: typography.callout, lineHeight: 20 },
  modeDescSelected: { color: colors.primaryDark },
  modeLabel: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  modeLabelSelected: { color: colors.primary },
  pressedScale: { transform: [{ scale: 0.97 }] },
  privacyLink: { color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  privacyText: { color: colors.textMuted, fontSize: typography.caption, textAlign: 'center', marginTop: spacing.sm },
  progressWrap: { flex: 1, marginHorizontal: spacing.sm, justifyContent: 'center' },
  resendText: { color: colors.primary, fontSize: typography.callout, fontWeight: '700', marginTop: spacing.xs },
  resultBtn: { marginTop: spacing.lg, minWidth: 160 },
  resultCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
  resultIcon: { color: colors.surface, fontSize: 36, fontWeight: '900' },
  resultNote: { color: colors.textMuted, fontSize: typography.callout, textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  rowInputs: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  safeArea: { flex: 1, backgroundColor: colors.background },
  skipText: { color: colors.text, fontSize: 18 },
  sliderDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.borderBlue, top: -4, marginLeft: -9 },
  sliderDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sliderFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  sliderTrack: { height: 10, backgroundColor: colors.softBlue, borderRadius: 5, marginTop: spacing.lg, marginHorizontal: spacing.md, position: 'relative' },
  textSizeA: { fontWeight: '800', color: colors.text },
  textSizeAActive: { color: colors.primary },
  textSizeCaption: { color: colors.textMuted, fontSize: typography.caption, marginBottom: 2 },
  textSizeItem: { alignItems: 'center', flex: 1 },
  textSizeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: spacing.sm },
  themeChip: { borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, minWidth: 90, alignItems: 'center', marginRight: spacing.md },
  themeChipText: { color: colors.surface, fontWeight: '800', fontSize: typography.callout },
  themeLabel: { flex: 1, color: colors.text, fontSize: typography.callout, fontWeight: '700' },
  themeLabelSelected: { color: colors.primary },
  themeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.card, borderWidth: 2, borderColor: colors.borderBlue, backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  themeRowSelected: { borderColor: colors.primary, backgroundColor: colors.softBlue },
  titleBlock: { width: '100%' },
  titleDesc: { color: colors.textMuted, fontSize: typography.callout, lineHeight: 20, marginTop: spacing.sm, paddingHorizontal: spacing.md, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg },
  titleTextWrap: { flex: 1, marginLeft: spacing.md },
  toggleLabel: { flex: 1, color: colors.text, fontSize: typography.callout, fontWeight: '600', marginRight: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderRadius: radii.input, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  topSection: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline', fontWeight: '800' },
});
