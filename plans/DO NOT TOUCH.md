# AAC App — Screen Structure Plan

> **Motto:** *Everyone deserves a voice.*
> Core AAC voice features are **free forever**. Premium tools and activities require a one-time or subscription purchase.

---

## Screens Overview

| # | Screen | Status | Access |
|---|--------|--------|--------|
| 1 | Splash Screen | ✅ Keep | Public |
| 2 | Welcome / Mission Screen | 🆕 New | Public |
| 3 | Registration Screen | 🆕 New | Public |
| 4 | Login Screen | 🆕 New | Public |
| 5 | Forgot Password Screen | 🆕 New | Public |
| 6 | AAC Board (with Symbols, Folders, Bottom Nav) | ✅ Keep | Free |
| 7 | Tools Screen | 🆕 New | Premium |
| 8 | Activity / Game Screen | 🆕 New | Premium |
| 9 | Profile Screen | 🆕 New | Free |

---

## Detailed Screen Breakdown

### 1. Splash Screen
- [ ] **Keep existing** — no changes needed
- **Purpose:** Brand intro, app loads in background
- **How it works:** App logo + mascot animation plays briefly, then auto-navigates to Welcome screen
- **Duration:** 2–3 seconds max

---

### 2. Welcome / Mission Screen
- [ ] **"Everyone Deserves a Voice" screen**
- **Purpose:** Sets the ethical tone of the app before registration — tells the user the voice is free and why
- **How it works:**
  - Mascot appears with a short message: *"We believe everyone deserves a voice. That's why our core AAC features are completely free — forever."*
  - Two buttons: **Get Started** (goes to Registration) and **I already have an account** (goes to Login)
- **Why it exists:** Builds trust immediately, differentiates from expensive competitors, sets expectations before any paywall

---

### 3. Registration Screen
- [ ] **New screen**
- **Purpose:** Create a new user account
- **How it works:**
  - Fields: Full Name, Email, Password, Confirm Password
  - "Register" button submits to Supabase Auth
  - Link to Login screen for existing users
  - Device ID tied to account on registration (prevents free trial abuse)
- **Notes:** No payment info collected here — voice is free, no credit card needed at sign-up

---

### 4. Login Screen
- [ ] **New screen**
- **Purpose:** Returning users sign back in
- **How it works:**
  - Fields: Email, Password
  - "Login" button
  - Link to Forgot Password screen
  - Link to Registration screen for new users
- **Notes:** Simple and fast — users with speech impairment need minimal friction to get back to communicating

---

### 5. Forgot Password Screen
- [ ] **New screen**
- **Purpose:** Password recovery
- **How it works:**
  - Field: Email address
  - "Send Reset Link" button triggers Supabase password reset email
  - Confirmation message shown on screen after submission
- **Notes:** Keep it minimal — one field, one button, one confirmation

---

### 6. AAC Board
- [ ] **Keep existing — core of the app**
- **Purpose:** The main communication tool — free for all users, forever
- **How it works:**
  - Symbol grid with Mulberry symbols
  - Folder navigation to browse categories
  - Bottom navigation bar for quick access
  - Text-to-speech using iOS native voices (free)
  - User can save custom phrases (stored in Supabase)
- **Access:** Fully free — no paywall, no time limit, no subscription
- **Why it's free:** Core to the app's mission — *"everyone deserves a voice"*

---

### 7. Tools Screen
- [ ] **New screen — Premium**
- **Purpose:** Advanced communication tools beyond the basic AAC board
- **How it works:**
  - Accessible from bottom navigation bar (locked icon if not premium)
  - Examples: saved phrase bank, custom phrase builder, communication history, voice settings
  - Tapping a locked tool shows upgrade prompt
- **Payment model:** Included in premium subscription (monthly) or one-time purchase
- **Why it's paid:** These are enhancements, not essentials — the user can already communicate without them

---

### 8. Activity / Game Screen
- [ ] **New screen — Premium**
- **Purpose:** OT-style therapy activities to build motor skills, finger pressure control, reflexes, and cognitive engagement
- **How it works:**
  - Accessible from bottom navigation bar (locked if not premium)
  - Games designed in collaboration with OT therapy principles
  - Examples: finger pressure games, reflex activities, pattern recognition
  - Progress tracked per user in Supabase
- **Payment model:** Monthly subscription — ethical because this is *optional therapy enhancement*, not a communication gate
- **Why it's paid:** Clinically valuable, time-intensive to build, therapist-recommended — users understand the value

---

### 9. Profile Screen
- [ ] **New screen — Free**
- **Purpose:** User account management and personalisation
- **How it works:**
  - Display name, email, profile photo (optional)
  - Voice settings (choose from free iOS voices)
  - Subscription/purchase status
  - Option to upgrade to premium
  - Logout button
- **Access:** Free for all users
- **Notes:** Upgrade prompt lives here too — non-intrusive, not a popup, just a section in profile

---

## User Flow Summary

```
Splash Screen
     ↓
Welcome / Mission Screen ("Everyone deserves a voice")
     ↓
Registration → Login (returning users)
     ↓
AAC Board ← FREE FOREVER
     ↓ (optional)
Tools / Activities ← PREMIUM (subscription)
```

---

## Pricing Model Summary

| Feature | Cost |
|---------|------|
| AAC Board (voice, symbols, folders) | 🆓 Free forever |
| Custom phrase bank & tools | 💳 Premium |
| OT Activities / Games | 💳 Premium (monthly subscription) |
| Profile & account management | 🆓 Free |

> **Why this is ethical:** The voice is never locked. Users can always communicate. Premium features are optional enhancements — not gates to communication.

---

## Tech Notes

- **Auth & Database:** Supabase (free tier supports up to 50,000 monthly active users)
- **Symbols:** Mulberry Symbols (free and open-source)
- **Voices:** iOS native text-to-speech (free)
- **Device lock:** Trial abuse prevention via device ID tied to Supabase account on first registration