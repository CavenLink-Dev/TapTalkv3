# TapTalk Build Checklist

---
    ## Make the AAC Board
    - [ ] Create Symbol
    - [ ] Create Folder
    - [ ] Create Whole screen

    ## Make Bottom Navigation Bar
    - [ ] Icons
    - [ ] Typeogrophy 
    - [ ] Neat

    ## 1. Splash & Welcome
    - [ ] Splash screen with mascot + loading dots (1.2s auto-advance)
    - [ ] Welcome screen: "Hello, welcome to TapTalk"
    - [ ] Mascot asks for name (input + skip option)
    - [ ] "Nice to meet you" screen

    ## 2. User Discovery
    - [ ] Ask "Where did you hear about us?" (skippable)
    - [ ] Ask "What brings you to TapTalk?" (multi-select)
    - [ ] Ask "Choose main goal" (default: Speak a sentence)

    ## 3. AAC Demo
    - [ ] Preview screen: "Tap symbols. Build a sentence. Speak it."
    - [ ] Instruction screen: Tap / Drag / Hold options
    - [ ] **Build "I want help"** (tap 3 symbols into board)
    - [ ] Speak button plays "I want help"
    - [ ] Success reward screen

    ## 4. Learn Features
    - [ ] Backspace & Clear lesson
    - [ ] Save phrase preview (star to save)
    - [ ] Custom symbol intro + create sample

    ## 5. Extra Features Preview
    - [ ] Activity intro (focus games)
    - [ ] Reaction time demo
    - [ ] Routine intro
    - [ ] First-Then preview
    - [ ] Personalization summary

    ## 6. Paywall & Account
    - [ ] Free trial offer (after all demos)
    - [ ] Sign in with Apple / Email / Guest
    - [ ] Land on main Board

    ## 7. Main Board Tab
    - [ ] Talk board area (white card, rounded)
    - [ ] 3 empty slots (dashed border)
    - [ ] Backspace, Clear, Save, Speak controls
    - [ ] 3-column symbol grid (20 starter words)
    - [ ] Tap / drag / plus-button to add symbols

    ## 8. Activity Tab
    - [ ] Games section (reaction time, matching)
    - [ ] Learn section (short lessons)
    - [ ] Progress section (history, streaks)
    - [ ] Routine builder (steps + checkmarks)

    ## 9. Saved Tab
    - [ ] Saved phrases list
    - [ ] Recent phrases
    - [ ] Favorite symbols
    - [ ] Custom symbols

    ## 10. Me Tab
    - [ ] Voice settings (speed, pitch)
    - [ ] Accessibility (size, motion, haptics)
    - [ ] Subscription / Account
    - [ ] Help & Privacy

    ## 11. Custom Symbol Flow
    - [ ] Choose type: built-in / emoji / photo / camera / text
    - [ ] Enter word label
    - [ ] Enter spoken phrase
    - [ ] Pick category
    - [ ] Preview voice & save

    ## 12. Empty States
    - [ ] Empty board: "Tap a symbol to start talking"
    - [ ] Empty saved: "Saved phrases will appear here"
    - [ ] Empty custom: "Your custom symbols will appear here"

    ## 13. Error States
    - [ ] Speech failed message + retry
    - [ ] Offline message
    - [ ] Permission denied + fallback

    ## 14. Polish
    - [ ] All buttons 44pt+ hit area
    - [ ] Dynamic Type support
    - [ ] Reduce Motion support
    - [ ] Haptics can be disabled
    - [ ] Guest mode works fully
    - [ ] Offline speech works

---

> NOTE: Almost every onboarding screen below has a persistent "Skip" in the corner. Communication/ Accesability/ Core Disabillity Features is the core never block it.

-[] Splash
> Keep, no changes.

-[] Tutorial Choice  *(NEW)*
> "TapTalk has a ton of features. Want a quick tour, or jump straight in?"
> Primary button: "Explore Features"
> Text button: "Skip tour"
>> [Skip tour] -> Register -> Customization / Accessibility -> App
>> [Explore Features] -> continue tour

-[] Welcome Screen
> Get Started with art/animated screen
> Button "Get Started"

-[] Nice to Meet You Screen
>"Hi, I'm Clo. What's your name?"  (keep copy short)
>> [User Inputs: Name]   (Skip not allowed, We need name to address user)

-[] Hi [User Name], Let me show you around
> Time-aware: "Good morning / afternoon / evening, [User Name] — quick tour, won't take long."  (Skip)

-[] AAC Feature Screen   (TAP to add — drag is optional/advanced)
> Intro (short): "This is a symbol. This is your board. This is the talk strip. Buttons: Play + Clear."
> Task: "Tap these 3 symbols in order: This / Is / Easy"
>   - On TAP the symbol GHOSTS and a low-opacity trail glides (gently but fast) up into the talk strip, Goes from left to right leaving a small space inbetween 5px maybe  [Design D3]
>   - The halo ring is a DIRECTIONAL cue — it points to exactly what to touch and where  [Design D7]
>   - Symbols are numbered during the intro to guide the order
> "Press Play to hear your phrase."
> Optional (advanced): "You can also press & hold to drag and rearrange symbols, or move several at once."
> "Press & hold a symbol to edit it — image, label, spoken phrase, colour, importance, category."
> "Thousands of symbols, and you can make your own — it's endless."
> "Now let's try making a phrase by using TapBoard"

-[] TapBoard Screen
> "This is your TapBoard, Here are keys to help you type a phrase or word"
> "Let's try typing a phrase"
> "Great, Now you can test it by pressing the play button"
> "Then you can save it by pressing the plus button"
> "You can also press and hold to edit the phrase"
> "The edit screen will allow you to choose a symbol, It can even be a pitcure in your gallery, update the spoken phrase, You can also either add to "Quick Talk" where you can swiftly access it, or put it in your board"
> "When editing, There is this button called, "Quick Build" which automatically finds a symbol, places it in your board, and if its already in your board then it will place it into quick talk"

-[] Activities Intro  (Skippable — short fun demo only)
> NOTE: Activities are CLINICAL TOOLS, not games. They build motor skills, reflexes, and track progression over time, with documentation practitioners can export into reports (for support workers, parents, clinicians).
> Carousel: flip card (image + title -> description + "Start"). Horizontal swipe.
> Persistent "Skip" button.
>> [Skip] -> next screen
>> [Try one] -> short, fun demo round -> result -> Continue
> Onboarding demo has NO difficulty / player / timer setup — that lives in the real Activities tab.
> Result popup shows "This is only the onboarding result screen", then real result + Continue.

## USER PLAYING ACTIVITY SEQUENCE (real Activities tab, not onboarding)
1. User chooses an activity
2. User clicks, then presses Start
3. User chooses difficulty, player, timer
4. User plays activity
5. User completes activity
6. Result screen + "Play Again" + Continue
7. Progress is logged for documentation / report export

-[] Tools Intro  (Skippable)   [Tools live as a subcategory of Activities — see Tabs]
> "Tools to help day to day."
> Carousel (swipe, each with a short description): FirstThen, Activity Planner, Goal Tracker, Big-Task Splitter, Notes (sticky note + optional checklist + timer), Calming Zone, Nearby (accessibility-friendly), Routine Timer (visual cooldown), Visual Clock, Weather.
> "You can open these anytime later."
> Prompt: "Want to try one now?"
>> [Yes, show me] -> open selected tool -> Continue
>> [Not now] -> next screen

-[] (High Priority) Benefits Screen (Tap to continue) [With each tap, and going to the next screen a animation will play, Animation would be a Everything forming together animation]
> "Communicate Better, We help by making this proccess as simple and swift as possible"
> "Many options, For everyone to use. If you dont need the AAC function then there are other tools and features for you."
> "Have fun and Improve at the same time."
> "Built also for carers and third parties, With in depth documentation and tracking features, Visual Routine and Sequenced Tasks. Made for Support Workers, Parents, And Practitioners."

-[] (High Priority) Free Trial Screen   (honest + Apple-compliant)
> Present opens (halo ring cue) to reveal: "Your 7-day free trial".
> Honest copy (NO fake "you got lucky"): "Full access for 7 days. Cancel anytime. We'll remind you 2 days before it ends."
> Clearly shows: what's free vs what the trial unlocks, the trial end date, "Cancel anytime in Settings".
> 7-day counter shown in Profile.
> Trial is tracked via Apple StoreKit receipt (server-side), NOT local storage — prevents reinstall / new-guest abuse.
> Text link: "See pricing" -> Pricing page

## USER SUBSCRIBING SEQUENCE ONBOARDING
1. User clicks link -> Open pricing page
2. User selects subscription plan
3. User clicks Subscribe
4. User is subscribed

-[] (Low Priority) Pricing Page (Skipable) 
- [ ] Plans: Monthly $19.99  /  Annual $89.99  /  Lifetime $299.99 (one-time)
- [ ] Annual marked "Best value" (anchor)
- [ ] Each plan: features + description, clear price + billing period
- [ ] "Subscribe" / "Skip" / "Back" buttons
- [ ] Apple-required: auto-renew terms, "Restore Purchases", links to Terms & Privacy

> [User clicks Subscribe] -> Subscribe
- [ ] User presses Subscribe button
- [ ] Confetti animation (with a calm Reduce-Motion fallback)
- [ ] Feature carousel: horizontal scroll, user-controlled like a carousel
- [ ] After all features seen, "Check It Out" button appears at the bottom
- [ ] User presses "Check It Out" or "I'll explore myself"

> [User presses "I'll explore myself" button] -> User is redirected to home screen
> After user got 7 days of free trial, they will be redirected onto the main "TalkBoard" screen then they have access to the app for 7 days

### THE APP's MAIN FUNCTION AFTER ONBOARDING ###
-[] TalkBoard Screen
- Shows the main AAC symbols. Nav bar can hide (pulsing arrow above it indicates hide/show).
- Empty board shows a centered "Add Symbols" circular + button.
- Tapping a symbol sends a low-opacity ghost trail up into the Input strip (gentle but fast).  [Design D3]
- Quick Access pill on top: horizontal scroll + dashed "Add" tile (22px radius, + icon).
- Input field: full-width "Tap to speak" pill. Right side: Play + Backspace (44x44).
- Backspace: TAP = delete one symbol. HOLD = clear all, BUT show a confirm + Undo toast (never a silent wipe).

-[] Bottom Nav   (3 tabs)
- Tabs, left to right: TalkBoard, Activities, Profile
- Simple solid rectangle, custom icons, no roundness/effects, very subtle selected animation.
- Sub-navbar: tapping a tab reveals a small pill (~11-15px) of extra functions, with a pulsing arrow to hide it.
  Design note [D1]: keep this compact and Apple-like — minimal height, system blur/material, clear tap targets, easy to dismiss. It must not crowd the small screen.

# TalkBoard: TapBoard, Quick Access, Design Icon, History
# Activities: Therapy Tools, Routine, Progress, Learn  + [Tools: FirstThen, Planner, Timer, Notes, Calming Zone]
# Profile: Settings, Subscription, Account, Help

-[] How did you hear about us  (very end, Skippable)
> "One last thing — how did you hear about us?"
>> [TikTok / Instagram / Facebook / YouTube / Google / Other]
>>> [If 'Other'] -> input field "Please specify"

---

## GLOBAL DESIGN NOTE  [D6]
> All animations (ghost trail, confetti, halos, forming-together, pulsing arrows) must respect Reduce Motion — provide subtle cross-fade fallbacks, per Apple HIG.

## PAYWALL MODEL  (recommendation, ref #1)
> Your 7-day full trial is already more generous than most AAC apps (many charge a one-time $150-300 with NO trial).
> Recommended safety net: after day 7, do NOT drop to zero access — degrade to a small free starter board instead of fully locking the user out of their voice. Keeps goodwill + avoids App Store / review backlash while still driving the subscription.