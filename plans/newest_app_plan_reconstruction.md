## IMPORTANT: EVEYTHING IS CHANGING, PLEASE FOLLOW THE STEPS BELOW TO CHANGE THE APP, IMPORTANTLY ENSURE THAT YOU DELETE AND TRIM HEAVILY UNEEDED CONTENT TO MAKE IT LIGHTER ##

# AAC App — Screen Structure Plan

> Moto/Summarisation: "Everyone deserves a voice which is why we don't charge for it" . HOWEVER Users will only pay if they want access to Cognitive Skills features. Such as Cognitive Activities, Sensory Activities, Therapy Games, With custom progression and documentations and other features like the "First & Then" Tool, Or "Daily Planner" made easier by cutting it into many steps. "Visual Timers", "Visual Cues", and MORE! Paid or Not all information are stored securely and privately.

# Core Features:
> AAC Board (Symbols, Symbol Search + Add, TapBoard (In screen keyboard to type and save phrases, Quick Talk))

> Tools Screen - Premium (First & Then, Daily Planner, Visual Timers, Visual Cues)

> Activity / Game Screen - Premium (Cognitive Activities, Sensory Activities, Therapy Games)

> Profile Screen - Free (User Settings, System settings, Account Settings, Progression (Paid), Sign out) 

# Nav Bar [THIS WILL CHANGE READ BELOW]: 
> Board (AAC Board)
> Cognition (Premium)
> Profile (Free)

---

## Detailed Screen Breakdown

### 1. Splash Screen
- [ ] **Keep existing** — no changes needed

---

### 2. Get Started Screen (NOT FOR REGISTERED USERS)
- [ ] **New screen**
- **Purpose:** Welcome to TapTalk
- [Get Started] button navigates to Registration screen (3.)
- Notes: Simple and fast No Fussing straight to Register Account. Helps users with speech impairment need minimal friction to get back to communicating.

---

### 3. Registration Screen (ONLY FOR NEW USERS) — Multi-Page Flow
- [ ] **New screen**
- **Purpose:** Create a new user account
- **How it works:** Split across multiple pages to reduce overwhelm, especially for users with motor or cognitive impairments. A progress bar is shown at the top of every page so the user knows where they are.
- **Notes:** No payment info collected here — voice is free, no credit card needed at sign-up. Device ID is tied to account on registration to prevent free trial abuse.

---

#### Page 1 — "Who is this app for?" (Required)
- Two large buttons: **"Myself"** or **"Someone Else"**
- ⚠️ **Loophole fix:** Once a selection is made, it is locked for the entire registration flow. The user cannot switch from "Myself" to "Someone Else" mid-way to bypass the age requirement.
- Tapping either option advances to Page 2

---

#### Page 2 — Legal Full Name (Required)
- Three input boxes: **First Name**, **Middle Name** (Optional), **Last Name**
- "Continue" button at bottom

---

#### Page 3 — Username (Optional)
- Input field: "What should we call you?"
- Restricted to 8–12 characters, letters and numbers only, no special characters
- Helper text shown: "This is optional — you can skip this"
- "Continue" button or "Skip" option

---

#### Page 4 — Date of Birth / Age (Required)
- Date of birth picker (day / month / year)

**If "Myself" was selected on Page 1:**
- Under 15 → Block registration. Show: *"You must be at least 15 to register yourself. Please ask a guardian to register on your behalf."* No option to proceed. No option to go back and switch to "Someone Else."
- 15 or older → proceed normally

**If "Someone Else" was selected on Page 1:**
- Person is under 18 → Show: *"As this person is a minor, a guardian must verify this account. Please enter the guardian's email address on the next page."*
- Person is 18 or older → proceed normally, no guardian verification needed

---

#### Page 5 — Guardian Verification (Only shown if person is under 18 and "Someone Else" was selected)
- Input field: **Guardian's Email Address**
- App sends a verification link to that email
- Screen shows: *"A verification link has been sent to the guardian's email. The guardian must click the link before registration can be completed."*
- ⚠️ **Loophole fix:** Registration cannot proceed until the guardian clicks the verification link sent to their email. The kid cannot complete this step using their own email or phone — the guardian must actively approve it.
- ⚠️ **Loophole fix:** One guardian email can only be linked to a maximum of 5 accounts. If the limit is reached, the guardian must contact support.

---

#### Page 6 — Email Address (Required)
- Input field
- Must be a valid email format — if invalid, show error message inline
- "Continue" button

---

#### Page 7 — Mobile Number (Required)
- Input field (used for 2FA verification)
- "Continue" button

---

#### Page 8 — Password (Required)
- Input field (masked, with show/hide toggle)
- Restrictions: 8–16 characters, must contain at least one number, at least one special character
- Inline error messages shown as user types:
  - *"Password must be 8–16 characters long"*
  - *"Password must contain at least one special character"*
  - *"Password must contain at least one number"*
- Password strength indicator shown below field
- "Continue" button

---

#### Page 9 — Confirm Password (Required)
- Input field (masked, with show/hide toggle)
- If passwords do not match: a red circle with an ✕ appears next to the field
- If passwords match: a green circle with a ✓ appears
- "Continue" button

---

#### Page 10 — Legal & Consent (Required)
- Three checkboxes (all must be ticked to proceed):
  - ☐ "I agree to the Terms & Conditions"
  - ☐ "I agree to the Privacy Policy"
  - ☐ "I consent to my data being stored securely"
- Links to full Terms & Conditions and Privacy Policy documents
- **"Create Account"** button — greyed out until all three boxes are ticked
- On success: account created, user auto-logged in and taken to AAC Board

---

### 4. Login Screen (ONLY FOR REGISTERED USERS)
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

### As they get into thee main screen after login and onboarding, 

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