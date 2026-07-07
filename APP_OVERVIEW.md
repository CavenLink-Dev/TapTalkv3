# TapTalk — App Overview

> **What this is:** A short, ground-truth summary of what TapTalk is, who it's for, and where it's going. No aspirational features — only what exists and what's next.

---

## What Is TapTalk?

TapTalk is an **iOS AAC (Augmentative and Alternative Communication) app** built with **React Native** and **Expo**. It's designed for people with disabilities — including autism, ADHD, speech differences, and other conditions where spoken communication may be difficult — as well as their families, caregivers, and therapists.

The app gives users a **tap-to-speak word board** (AAC grid) where tapping symbols builds sentences that are spoken aloud via the device's text-to-speech engine. Beyond communication, it includes daily planning tools (calendar, tasks, First-Then boards), activities, progress tracking, and caregiver controls.

---

## Core Principles

1. **Accessibility is number one.** Every change must keep the app usable by people with the most severe communication and motor impairments. VoiceOver, switch access, scanning mode, Reduce Motion, and Dynamic Type are not optional.

2. **iOS compatibility.** The app targets iOS 16+ and runs on iPhone. It uses iOS-native components (Alert.alert, DateTimePicker, ActionSheetIOS, etc.) — no custom replacements.

3. **React Native + Expo.** The codebase uses Expo Router for navigation, React Native for UI, and Expo SDK for device features (speech, haptics, notifications).

4. **NDIS Australia compliance.** The app follows legal and regulatory requirements for assistive technology in Australia, including NDIS guidelines, privacy standards, and App Store review guidelines. All data handling must comply with Australian privacy law.

5. **Simple, calm, predictable.** The app must feel clean, stable, low-effort, and easy to understand. No surprise interactions, overloaded screens, or unnecessary visual noise.

---

## What's Next

**iPad support is the next major milestone.** The app currently targets iPhone. The next device target is iPad — many AAC users rely on iPads mounted on wheelchairs or tables. This means:

- Layouts must adapt to larger screen sizes.
- `supportsTablet: true` and split-view support are planned.
- Board grid columns and tile sizing must scale for iPad dimensions.
- All existing accessibility features must work identically on iPad.

---

## Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Routing:** Expo Router (file-based)
- **State:** Global reducer (`AppContext`) with debounced file persistence
- **Speech:** `expo-speech` via `src/hooks/useSpeech.ts`
- **Symbols:** Mulberry symbol library (CC BY-SA)
- **Backend:** Supabase (auth, cloud sync)
- **Database:** SQLite (symbol brain), AsyncStorage (board state)
- **Fonts:** SF Compact Rounded