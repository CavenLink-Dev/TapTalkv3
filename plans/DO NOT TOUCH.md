    # TapTalk Final App Plan

    ## Version

    Final working product and onboarding plan for TapTalk iOS.

    ---

    # 1. What TapTalk Is

    TapTalk is an iOS app for AAC communication, routines, activities, and ADHD-friendly support.

    The app helps users:

    - Build spoken sentences using AAC symbols.
    - Tap symbols to speak quickly.
    - Save useful phrases.
    - Create custom symbols.
    - Break routines into smaller steps.
    - Track simple activities like reaction time.
    - Feel successful quickly without being forced through heavy setup.

    The app should feel:

    - Simple
    - Friendly
    - Safe
    - Fast
    - Accessible
    - Playful, but not childish
    - High quality enough for iOS

    The mascot is a baby-blue cloud chat bubble with a black outline. The mascot acts as a guide through onboarding, empty states, helper moments, success states, and error states.

    ---

    # 2. Core Product Rule

    The user must experience value before being asked for:

    - Account creation
    - Payment
    - Too many personal details
    - Permissions
    - Complex setup

    The first important win is:

    > The user creates the sentence “I want help” and hears TapTalk speak it.

    That is the heart of the first onboarding dopamine moment.

    ---

    # 3. Main Loopholes Fixed

    ## 3.1 Drag-and-drop cannot be required

    Original idea:

    > Press and hold a symbol, drag it to the board, then tap Speak.

    This is good visually, but not enough.

    Problem:

    Some users may have difficulty dragging, holding, or placing items accurately.

    Final rule:

    Every symbol must support three ways to add it to the board:

    1. Tap once to add to the next empty slot.
    2. Press and hold to pick it up, then drag to the board.
    3. Tap the small plus button on the symbol card.

    This means users can still get the nice drag-and-drop feeling, but nobody is stuck if they cannot drag.

    ---

    ## 3.2 Press-and-hold cannot be the only hidden action

    Press-and-hold is useful, but hidden.

    Final rule:

    Press-and-hold can be a shortcut, not the main instruction.

    Use visible actions:

    - Tap symbol to add.
    - Tap Speak to speak.
    - Tap Backspace to remove last symbol.
    - Tap Clear to empty the board.
    - Tap Edit to change a symbol.

    Press-and-hold can show:

    - Add to board
    - Edit symbol
    - Save symbol
    - Move symbol
    - Delete symbol

    But the same actions must exist somewhere visible.

    ---

    ## 3.3 Paywall must not block basic AAC

    Since AAC can be important for communication, the app should not make the user pay before trying basic speech.

    Final rule:

    Free / guest users can:

    - Use starter board
    - Speak starter phrases
    - Try onboarding demo
    - Save a small number of phrases
    - Use basic routines

    Premium can unlock:

    - Unlimited custom symbols
    - Unlimited saved phrases
    - Advanced routines
    - Activity history
    - More voices
    - Cloud sync
    - More boards
    - Custom themes

    ---

    ## 3.4 Account creation should come after value

    Do not start with:

    > Create account.

    Start with:

    > Try the app.

    Final rule:

    User sees AAC demo before login.

    Account is only needed for:

    - Syncing
    - Saving across devices
    - Restoring purchases
    - Backups
    - Advanced personalization

    Always include:

    > Continue as guest

    ---

    ## 3.5 Permissions only appear when needed

    Do not request:

    - Camera
    - Photos
    - Microphone
    - Notifications

    during splash or early onboarding.

    Ask only when the user taps the feature that needs it.

    Example:

    If user taps “Take photo for symbol,” then ask for camera permission.

    Before Apple’s system permission popup, show your own friendly explanation:

    > TapTalk needs camera access so you can create your own symbol picture.

    If denied, show fallback options:

    - Use built-in symbol
    - Use emoji
    - Use text only
    - Choose a different symbol

    ---

    # 4. Design System

    ## 4.1 Colors

    Primary app color:

    - Baby blue, matching mascot fill.

    Secondary color:

    - Dark blue for shadows, outlines, active states, and depth.

    Neutral colors:

    - White
    - Very light blue
    - Soft gray
    - Dark navy text

    Mascot:

    - Baby blue fill
    - Pure black outline
    - White eyes
    - Black pupils
    - Soft rounded shapes

    ---

    ## 4.2 Shape Language

    Use rounded UI everywhere.

    Recommended corner radius:

    - Small cards: 16 pt
    - Symbol cards: 20–24 pt
    - Large panels: 24–32 pt
    - Pills/buttons: 22–28 pt

    Avoid sharp corners unless used intentionally for an error/broken state.

    ---

    ## 4.3 Button Rules

    Primary button:

    - Height: 56 pt
    - Horizontal margin: 24 pt
    - Corner radius: 22–28 pt
    - Fill: baby blue
    - Text: white
    - Shadow: dark blue, low opacity

    Secondary button:

    - White or light blue fill
    - Baby blue or dark blue text
    - Border optional

    Minimum hit area:

    - 44 x 44 pt

    For AAC buttons, use larger than minimum whenever possible.

    ---

    ## 4.4 Typography

    Use iOS-friendly font behavior.

    Recommended:

    - Large title: 32–36 pt
    - Page title: 28–32 pt
    - Subtitle: 16–18 pt
    - Button text: 17–20 pt
    - Symbol label: 18–22 pt
    - Helper text: 14–16 pt

    Text should be clear and short.

    Avoid long paragraphs during onboarding.

    ---

    # 5. Main App Structure

    Bottom navigation should have four tabs:

    1. Board
    2. Activity
    3. Saved
    4. Me

    ---

    # 6. Board Tab

    ## Purpose

    The Board tab is the main AAC communication area.

    The user can:

    - Tap symbols
    - Build a sentence
    - Speak the sentence
    - Save phrases
    - Use custom symbols
    - Access recent phrases

    ---

    ## 6.1 Board Screen Layout

    Base iPhone frame:

    - Width: 390 pt
    - Height: 844 pt

    Safe area:

    - Top safe area respected.
    - Bottom tab bar respected.

    ---

    ## 6.2 Top Talk Area

    Position:

    - Starts around 60 pt from top.

    Height:

    - 130–160 pt

    Container:

    - Width: screen width minus 24–32 pt
    - Left margin: 12–16 pt
    - Right margin: 12–16 pt
    - Background: white or very light blue
    - Corner radius: 26 pt
    - Border: 2 pt baby blue at 30–50% opacity
    - Shadow: dark blue at low opacity

    Top-left label:

    > Talk

    Right-side controls:

    - Backspace
    - Clear
    - Save
    - Speak

    Recommended control sizes:

    - Icon buttons: 44 x 44 pt
    - Speak button: 88–110 pt wide, 48–54 pt high

    Speak button:

    - Baby blue fill
    - White text
    - Rounded pill
    - Disabled until at least one symbol is in the board

    ---

    ## 6.3 Talk Board Slots

    Inside the Talk area, show a horizontal strip where selected symbols appear.

    Empty state:

    - Three dashed rounded slots
    - Light blue border
    - Soft fill

    Filled state:

    - Symbol card appears inside slot
    - Slot border becomes solid
    - Small success haptic
    - Gentle pop animation

    The board should allow scrolling horizontally if more symbols are added.

    ---

    ## 6.4 Symbol Grid

    Below the Talk area.

    Starter layout:

    - 3 columns
    - Large cards
    - Comfortable spacing

    Each card:

    - White background
    - 20–24 pt corner radius
    - 2 pt border
    - Symbol image on top
    - Word label below
    - Optional small plus button

    Symbol interaction:

    - Tap card: add to board
    - Press and hold: pick up for drag
    - Drag to board: place symbol
    - Tap plus: add to board
    - In edit mode: pencil icon appears

    ---

    # 7. Activity Tab

    ## Purpose

    The Activity tab supports ADHD-friendly activities and routines.

    Sections:

    1. Games
    2. Learn
    3. Progress
    4. Routine

    ---

    ## 7.1 Games

    Examples:

    - Reaction time tap
    - Match symbol
    - Focus tap challenge
    - Memory sequence

    ---

    ## 7.2 Learn

    Short lessons:

    - How to build a sentence
    - How to save a phrase
    - How to create a custom symbol
    - How to use routines

    ---

    ## 7.3 Progress

    Shows:

    - Reaction time history
    - Completed routines
    - Streaks
    - Used phrases
    - Saved phrases

    Keep this simple for MVP.

    ---

    ## 7.4 Routine

    Users create routines with steps.

    Routine includes:

    - Name
    - Picture
    - Start time
    - End time
    - Steps
    - Duration per step
    - Checkmark completion

    Example:

    Morning routine:

    1. Brush teeth — 2 min
    2. Get dressed — 5 min
    3. Pack bag — 3 min
    4. Eat breakfast — 10 min

    ---

    # 8. Saved Tab

    ## Purpose

    The Saved tab stores useful AAC phrases and custom symbols.

    Sections:

    - Saved phrases
    - Recent phrases
    - Favorite symbols
    - Custom symbols

    Phrase card actions:

    - Speak
    - Edit
    - Delete
    - Move
    - Add to board

    Example saved phrases:

    - I want help
    - I need a break
    - I feel sad
    - I need toilet
    - I want drink
    - Please wait

    ---

    # 9. Me Tab

    ## Purpose

    User settings and account.

    Sections:

    - Profile
    - Voice settings
    - Accessibility
    - Subscription
    - Account
    - Help
    - Privacy

    Settings:

    - Voice speed
    - Voice pitch
    - Symbol size
    - Grid size
    - Reduce animations
    - Haptics on/off
    - Show text labels on/off
    - Theme
    - Reset onboarding

    ---

    # 10. Final Onboarding Flow

    The onboarding should be detailed enough to feel premium, but not exhausting.

    Recommended onboarding screens:

    1. Splash screen
    2. Hello, welcome
    3. Mascot introduction and name
    4. Nice to meet you
    5. Where did you hear about us?
    6. What brings you to TapTalk?
    7. Choose main goal
    8. AAC preview
    9. Try this out intro
    10. Build first sentence
    11. Speak first sentence
    12. Success reaction
    13. Backspace and clear lesson
    14. Save phrase preview
    15. Custom symbol intro
    16. Create sample symbol
    17. Activity intro
    18. Reaction time demo
    19. Routine intro
    20. First-Then preview
    21. Personalization summary
    22. Free trial / paywall
    23. Account screen
    24. Main board landing

    This gives enough onboarding depth without becoming “please complete this government form to say hello.”

    ---

    # 11. Detailed Onboarding Screens

    ---

    ## Screen 01 — Splash Screen

    ### Purpose

    Show brand while app loads.

    ### Layout

    Top area:

    - Mascot centered in upper third.
    - Mascot is large, friendly, and unchanged from brand design.

    Middle area:

    - TapTalk title.
    - Baby blue fill.
    - Dark blue shadow or outline behind text.

    Bottom area:

    - Three loading dots.
    - Dots sit inside rounded pill.
    - Pill:
    - Dark blue
    - 50% opacity
    - 22 pt corner radius

    ### Animation

    Dots move up and down one at a time.

    Reduce Motion:

    - Dots fade instead of bouncing.

    ### Destination

    Automatically moves to Screen 02.

    Timing:

    - 1.2 to 2 seconds.

    ---

    ## Screen 02 — Hello, Welcome

    ### Purpose

    Friendly first contact.

    ### Layout

    Top:

    - Empty safe area.

    Middle:

    - Mascot large and centered.
    - Mascot normal smile or wave.

    Text:

    > Hello, welcome to TapTalk.

    Subtitle:

    > A simple way to speak, plan, and stay on track.

    Bottom:

    - No heavy controls.
    - Optional progress dots.

    ### Action

    Auto-advance after 1.5 seconds.

    Alternative:

    Button:

    > Continue

    ### Destination

    Screen 03.

    ---

    ## Screen 03 — Mascot Introduction + Name

    ### Purpose

    Create personal connection.

    ### Layout

    Top:

    - Mascot in speech bubble card.

    Main text:

    > My name is [Mascot Name].  
    > What is yours?

    Input:

    - Large rounded field.
    - Placeholder: Your name
    - Height: 56 pt
    - Horizontal margin: 24 pt

    Buttons:

    Primary:

    > Continue

    Secondary:

    > Skip for now

    ### Behavior

    If user enters name:

    Go to Screen 04 with name.

    If user skips:

    Use neutral copy later:

    > Nice to meet you.

    Do not force name.

    ---

    ## Screen 04 — Nice to Meet You

    ### Purpose

    Small reward after name input.

    ### Layout

    Top:

    - Mascot happy.

    Main text:

    > Nice to meet you, [Name].

    Subtitle:

    > Let’s show you how TapTalk works.

    Button:

    > Let’s start

    Button style:

    - White fill
    - Baby blue text
    - Dark blue shadow
    - 56 pt height
    - Rounded pill

    ### Destination

    Screen 05.

    ---

    ## Screen 05 — Where Did You Hear About Us?

    ### Purpose

    Marketing attribution, but optional.

    ### Layout

    Title:

    > Quick question

    Subtitle:

    > How did you hear about TapTalk?

    Options:

    - TikTok
    - Instagram
    - App Store
    - Friend or family
    - Therapist or teacher
    - Other

    Bottom buttons:

    Primary:

    > Continue

    Secondary:

    > Skip

    ### Rule

    Never block progress here.

    ### Destination

    Screen 06.

    ---

    ## Screen 06 — What Brings You to TapTalk?

    ### Purpose

    Personalize the rest of onboarding.

    ### Layout

    Title:

    > What brings you to TapTalk?

    Subtitle:

    > Pick what feels most useful.

    Cards:

    1. Communication
    - I want to use symbols to speak.

    2. Routines
    - I want help with steps and tasks.

    3. Focus activities
    - I want quick activities and reaction games.

    4. I am setting this up for someone else
    - Parent, carer, teacher, therapist.

    Allow multiple selections.

    Button:

    > Continue

    ### Destination

    Screen 07.

    ---

    ## Screen 07 — Choose Main Goal

    ### Purpose

    Create user commitment.

    ### Layout

    Title:

    > What should we help with first?

    Options:

    - Speak a sentence
    - Save useful phrases
    - Make a custom symbol
    - Try a focus activity
    - Build a routine

    Recommended default selected:

    > Speak a sentence

    Button:

    > Start with this

    ### Destination

    Screen 08.

    ---

    ## Screen 08 — AAC Preview

    ### Purpose

    Explain AAC simply.

    ### Layout

    Top:

    - Mascot pointing to a mini board.

    Title:

    > Tap symbols. Build a sentence. Speak it out loud.

    Visual:

    - Small mock board with:
    - I
    - want
    - help

    Subtitle:

    > Let’s try one now.

    Button:

    > Try this out

    ### Destination

    Screen 09.

    ---

    ## Screen 09 — Try This Out Intro

    ### Purpose

    Prepare the user for the task.

    ### Layout

    Title:

    > Try this out

    Subtitle:

    > Add these words to the Talk board.

    Instruction card:

    > You can tap, press and hold, or drag a word.

    Mini helper row:

    - Tap = quick add
    - Press & hold = pick up
    - Drag = place it yourself

    Button:

    > Show me

    ### Destination

    Screen 10.

    ---

    # 12. Main Dopamine Screen

    ## Screen 10 — Build First Sentence

    This is the most important onboarding screen.

    ### Goal

    User builds:

    > I want help

    ---

    ## 12.1 Layout

    Base iPhone frame:

    - 390 x 844 pt

    Background:

    - Very light blue or white.

    Top safe area:

    - Clear.

    Header:

    Position:

    - Around 60–70 pt from top.

    Title:

    > Build your first sentence

    Subtitle:

    > Add the words in order, then press Speak.

    ---

    ## 12.2 Talk Board

    Position:

    - Y: 150–170 pt
    - X: 16 pt
    - Width: 358 pt
    - Height: 145 pt

    Style:

    - White card
    - 26 pt corner radius
    - 2 pt baby blue border
    - Soft dark blue shadow

    Top-left label inside:

    > Talk

    Position:

    - 16 pt from left
    - 12 pt from top

    Top-right controls:

    - Backspace button
    - Clear button

    Control size:

    - 44 x 44 pt each

    Inside board:

    Three slots:

    1. Slot 1
    2. Slot 2
    3. Slot 3

    Slot size:

    - Width: 96 pt
    - Height: 70 pt
    - Gap: 8 pt

    Slot style:

    - Dashed baby-blue border
    - Very light blue fill
    - 16 pt corner radius

    Placeholder text:

    - Add word

    ---

    ## 12.3 Symbol Cards

    Position:

    - Below board
    - Y: around 345 pt

    Instruction:

    > Tap or drag these words.

    Cards:

    1. I
    2. want
    3. help

    Layout:

    - Three cards in a row.
    - Each card around 106 x 132 pt.
    - Gap: 10 pt.

    Card style:

    - White fill
    - Rounded corners: 22 pt
    - Border: 2 pt dark blue at low opacity
    - Soft shadow

    Each card includes:

    - Symbol image
    - Word label
    - Small plus button in top-right

    ---

    ## 12.4 Symbol Details

    ### Symbol 1

    Label:

    > I

    Visual:

    - Person icon
    - Or mascot pointing to itself

    Speech text:

    > I

    ### Symbol 2

    Label:

    > want

    Visual:

    - Open hands reaching toward a small star or item

    Speech text:

    > want

    ### Symbol 3

    Label:

    > help

    Visual:

    - Raised hand
    - Or helping hand

    Speech text:

    > help

    ---

    ## 12.5 User Instructions

    The screen should guide step-by-step.

    Initial helper text:

    > Start with “I”.

    When user adds I:

    > Great. Now add “want”.

    When user adds want:

    > Now add “help”.

    When user adds help:

    > Perfect. Press Speak.

    This is better than throwing all instructions at them at once like a chaotic IKEA manual with feelings.

    ---

    ## 12.6 Interaction Methods

    ### Method 1: Tap

    User taps the “I” card.

    Result:

    - Card copies into first empty slot.
    - Original card stays in symbol area.
    - Slot briefly glows.
    - Haptic feedback plays.

    ### Method 2: Press and hold

    User presses and holds a symbol for 0.3–0.5 seconds.

    Result:

    - Card lifts slightly.
    - Shadow increases.
    - Card scales to 1.04.
    - Talk board highlights.
    - Helper text appears:

    > Drop it on the Talk board.

    ### Method 3: Drag

    User drags card into board.

    Result:

    - Card snaps into first available slot.
    - If dropped over a specific empty slot, it fills that slot.
    - If dropped outside board, it returns gently.

    ### Method 4: Plus button

    User taps small plus.

    Result:

    - Symbol adds to next empty slot.

    ---

    ## 12.7 Speak Button

    Speak button position:

    - Below symbols or fixed above bottom button area.
    - Y: around 540–590 pt.

    Button:

    > Speak

    Style:

    - Baby blue fill
    - White text
    - 60 pt height
    - Width: 220–260 pt
    - Centered
    - Rounded pill

    Disabled state:

    - Light gray-blue
    - Text: Add words first

    Active state:

    - Baby blue
    - Gentle pulse after all three words are added

    ---

    ## 12.8 Backspace and Clear

    Backspace button:

    - Removes last symbol.
    - Icon: backspace arrow.
    - Label for accessibility: Remove last word.

    Clear button:

    - Removes all symbols.
    - Icon: X or trash.
    - Label for accessibility: Clear sentence.

    If board is empty:

    - Backspace and Clear are disabled.

    ---

    ## 12.9 Error States

    If user presses Speak before adding symbols:

    Message:

    > Add a word first.

    If user only adds one word:

    Message:

    > Add more words or press Speak to say this word.

    Allow single-word speaking.

    If user drops outside board:

    Message:

    > Try dropping it inside the Talk board.

    If user places words out of order:

    Do not punish.

    Show:

    > That works too. You can move words around later.

    ---

    ## 12.10 Success

    When the sentence is complete:

    Board shows:

    1. I
    2. want
    3. help

    Speak button activates.

    User taps Speak.

    App speaks:

    > I want help.

    Then move to Screen 11.

    ---

    ## Screen 11 — First Spoken Sentence

    ### Purpose

    Reward the user.

    ### Layout

    Top:

    - Mascot excited / proud.

    Main text:

    > You made TapTalk speak.

    Subtitle:

    > That was your first sentence.

    Visual:

    - Completed board:
    - I
    - want
    - help

    Button:

    > Continue

    Secondary:

    > Try again

    ### Destination

    Screen 12.

    ---

    ## Screen 12 — Success Reaction

    ### Purpose

    Make the win feel meaningful.

    ### Layout

    Mascot:

    - Happy success pose.
    - Optional sparkles.

    Text:

    > Nice work.

    Subtitle:

    > Symbols can help say what you need quickly.

    Button:

    > Next

    ### Destination

    Screen 13.

    ---

    ## Screen 13 — Backspace and Clear Lesson

    ### Purpose

    Teach correction without stress.

    ### Layout

    Title:

    > Need to fix it?

    Subtitle:

    > Use Backspace to remove the last word, or Clear to start again.

    Mini board:

    - I
    - want
    - help

    Highlighted controls:

    - Backspace
    - Clear

    Interactive task:

    > Press Backspace once.

    Result:

    - “help” disappears.
    - Helper text:

    > Good. Now add it back.

    User taps “help”.

    Then:

    > Perfect.

    Button:

    > Continue

    ### Destination

    Screen 14.

    ---

    ## Screen 14 — Save Phrase Preview

    ### Purpose

    Show saved phrases.

    ### Layout

    Title:

    > Save phrases you use often.

    Subtitle:

    > So you can speak them faster next time.

    Visual:

    - Phrase card:
    - I want help
    - Speak button
    - Save star

    Action:

    > Save this phrase

    When tapped:

    - Star fills.
    - Mascot smiles.
    - Message:

    > Saved to your phrases.

    Button:

    > Continue

    ### Destination

    Screen 15.

    ---

    ## Screen 15 — Custom Symbol Intro

    ### Purpose

    Show personalization.

    ### Layout

    Title:

    > Make symbols personal.

    Subtitle:

    > Add your own words, pictures, or voice.

    Visual:

    - Empty symbol card with plus icon.
    - Mascot pointing at it.

    Button:

    > Make a sample symbol

    Secondary:

    > Skip

    ### Destination

    Screen 16.

    ---

    ## Screen 16 — Create Sample Symbol

    ### Purpose

    Teach symbol creation without permissions.

    Do not ask for photos yet.

    Use a built-in symbol for onboarding.

    ### Layout

    Title:

    > Create a symbol

    Fields:

    1. Word label
    2. Spoken phrase
    3. Symbol picture

    Pre-filled example:

    Word label:

    > break

    Spoken phrase:

    > I need a break

    Symbol picture:

    - Built-in pause icon or calm mascot icon.

    Buttons:

    - Preview
    - Save symbol

    Interaction:

    User taps Preview.

    App speaks:

    > I need a break.

    User taps Save symbol.

    Success:

    > Symbol saved.

    Button:

    > Continue

    ### Destination

    Screen 17.

    ---

    ## Screen 17 — Activity Intro

    ### Purpose

    Introduce ADHD / focus features.

    ### Layout

    Title:

    > Small activities can help with focus.

    Subtitle:

    > Try quick games, reaction tasks, and progress tracking.

    Visual:

    - Mascot holding timer.
    - Simple reaction button preview.

    Button:

    > Try one

    Secondary:

    > Skip

    ### Destination

    Screen 18.

    ---

    ## Screen 18 — Reaction Time Demo

    ### Purpose

    Give another quick win.

    ### Layout

    Title:

    > Tap when it turns blue.

    Center:

    - Large rounded button/card.
    - Starts gray.
    - After random 1–2 second delay, turns baby blue.

    Instruction:

    > Wait for blue.

    When blue:

    > Tap now!

    Result:

    > Nice — 482 ms

    Do not over-emphasize score.

    Button:

    > Continue

    ### Destination

    Screen 19.

    ---

    ## Screen 19 — Routine Intro

    ### Purpose

    Show routine support.

    ### Layout

    Title:

    > Break routines into steps.

    Subtitle:

    > Big tasks feel easier when they are smaller.

    Visual:

    Routine card:

    > Morning routine

    Steps:

    1. Brush teeth
    2. Get dressed
    3. Pack bag

    Button:

    > See how it works

    ### Destination

    Screen 20.

    ---

    ## Screen 20 — First-Then Preview

    ### Purpose

    Teach First-Then support.

    ### Layout

    Title:

    > First, then.

    Visual:

    Two large cards:

    First:

    > Brush teeth

    Then:

    > Play game

    Mascot:

    - Pointing from first card to second card.

    Subtitle:

    > Finish one step, then move to the reward.

    Button:

    > Continue

    ### Destination

    Screen 21.

    ---

    ## Screen 21 — Personalization Summary

    ### Purpose

    Show the app has adapted to user choices.

    ### Layout

    Title:

    > TapTalk is ready for you.

    Subtitle:

    > Here’s what we set up first.

    Summary cards:

    - Starter AAC board
    - Saved phrase: I want help
    - Sample symbol: break
    - Activity demo
    - Routine preview

    Button:

    > Continue

    ### Destination

    Screen 22.

    ---

    ## Screen 22 — Free Trial / Paywall

    ### Purpose

    Present premium after value.

    ### Layout

    Title:

    > Unlock more with TapTalk Plus.

    Subtitle:

    > Try premium features free for 7 days.

    Benefit cards:

    1. Unlimited custom symbols
    2. Unlimited saved phrases
    3. More routines and activity history
    4. Cloud sync and backup

    Primary button:

    > Start free trial

    Secondary button:

    > Continue with free version

    Small text:

    - Price
    - Renewal information
    - Cancel anytime wording
    - Terms
    - Privacy
    - Restore purchases

    Important:

    Do not hide the free option.

    ### Destination

    If trial selected:

    - Apple purchase flow
    - Then Screen 23

    If free selected:

    - Screen 23

    ---

    ## Screen 23 — Account Screen

    ### Purpose

    Let user save and sync, but do not force.

    ### Layout

    Title:

    > Save your boards?

    Subtitle:

    > Create an account to keep your symbols and phrases backed up.

    Buttons:

    1. Continue with Apple
    2. Continue with email
    3. Continue as guest

    Recommended order:

    - Continue with Apple
    - Continue with email
    - Continue as guest

    Small text:

    > You can create an account later.

    ### Destination

    Account created:

    - Main Board

    Guest:

    - Main Board

    ---

    ## Screen 24 — Main Board Landing

    ### Purpose

    Bring user into real app.

    ### Layout

    Tab selected:

    - Board

    Top:

    - Talk board

    Middle:

    - Starter symbol grid

    Bottom:

    - Tab bar

    Tooltip:

    > Tap a symbol to add it. Press Speak to say it.

    Tooltip actions:

    - Got it
    - Show me again

    Mascot:

    - Small helper bubble, not covering symbols.

    ---

    # 13. Starter AAC Board

    ## Core starter symbols

    Use simple words first.

    Recommended starter board:

    1. I
    2. want
    3. help
    4. yes
    5. no
    6. stop
    7. go
    8. more
    9. done
    10. eat
    11. drink
    12. toilet
    13. pain
    14. happy
    15. sad
    16. break
    17. please
    18. wait
    19. open
    20. close

    ---

    # 14. Symbol Categories

    Recommended categories:

    - Core
    - People
    - Actions
    - Feelings
    - Food
    - Places
    - Body
    - Routines
    - Custom

    Do not show all categories at once in onboarding.

    Main board can show category chips in a horizontal row.

    ---

    # 15. Custom Symbol Flow

    ## Entry points

    User can create a symbol from:

    - Board tab
    - Saved tab
    - Onboarding
    - Empty custom category

    Button:

    > Add Symbol

    ---

    ## Add Symbol Steps

    ### Step 1 — Choose symbol type

    Options:

    - Built-in symbol
    - Emoji
    - Photo
    - Camera
    - Text only

    ### Step 2 — Add label

    Input:

    > Word label

    Example:

    > break

    ### Step 3 — Add spoken phrase

    Input:

    > What should TapTalk say?

    Example:

    > I need a break

    ### Step 4 — Choose category

    Options:

    - Core
    - Feeling
    - Food
    - Place
    - Routine
    - Custom

    ### Step 5 — Preview

    Button:

    > Preview voice

    ### Step 6 — Save

    Button:

    > Save symbol

    Success:

    > Symbol saved.

    ---

    # 16. Search Symbol Flow

    If you later add symbol search:

    Search field:

    > Search symbols

    If symbol exists:

    - Show results.
    - User selects one.

    If no result:

    Show:

    > No symbol found.

    Options:

    - Create text-only symbol
    - Use emoji
    - Take photo
    - Choose photo
    - Request symbol

    Never show a dead end.

    ---

    # 17. Press-and-Hold Behavior

    Press-and-hold is allowed, but not required.

    When user press-holds a symbol:

    A context menu appears:

    - Add to Talk board
    - Speak now
    - Edit symbol
    - Save to favorites
    - Move
    - Delete

    In onboarding, press-and-hold can also start drag mode.

    Instruction text:

    > Press and hold to pick up a symbol, or just tap to add it.

    This keeps the app accessible and still gives your interaction that nice tactile feel.

    ---

    # 18. Drag-and-Drop Behavior

    When dragging:

    1. Symbol lifts.
    2. Board highlights.
    3. Empty slots glow.
    4. User drops symbol.
    5. Symbol snaps into slot.

    If dropped outside board:

    - Symbol returns to original place.
    - Helper text appears:

    > Drop it inside the Talk board.

    If board is full:

    Show:

    > The board is full. Press Speak or Clear.

    Do not use scary red error unless something truly fails.

    ---

    # 19. Board Controls

    ## Speak

    Purpose:

    Speak all words in the Talk board.

    Text:

    > Speak

    Active:

    - When one or more symbols are added.

    Disabled:

    - When board is empty.

    ---

    ## Backspace

    Purpose:

    Remove last word.

    Icon:

    - Backspace arrow

    Accessible label:

    > Remove last word

    ---

    ## Clear

    Purpose:

    Clear all words.

    Icon:

    - X or trash

    Accessible label:

    > Clear sentence

    Confirmation:

    Do not ask confirmation for clearing a short board.

    For longer saved work, ask confirmation.

    ---

    ## Save

    Purpose:

    Save the current sentence.

    Icon:

    - Star or bookmark

    Accessible label:

    > Save phrase

    If phrase already saved:

    - Filled star.

    ---

    # 20. Empty States

    ## Empty Board

    Text:

    > Tap a symbol to start talking.

    Mascot:

    - Pointing to symbols.

    Button:

    > Show me how

    ---

    ## Empty Saved

    Text:

    > Saved phrases will appear here.

    Subtitle:

    > Save phrases you use often so they are easy to speak again.

    Button:

    > Create phrase

    ---

    ## Empty Custom Symbols

    Text:

    > Your custom symbols will appear here.

    Subtitle:

    > Add people, places, routines, or words that matter to you.

    Button:

    > Add symbol

    ---

    # 21. Error States

    ## Symbol failed to speak

    Text:

    > Something went wrong with speech.

    Buttons:

    - Try again
    - Check voice settings

    Mascot:

    - Concerned expression with small broken gear.

    ---

    ## No internet

    Text:

    > You are offline.

    Subtitle:

    > Built-in symbols still work. Sync will continue when internet returns.

    ---

    ## Permission denied

    Text:

    > Photo access is off.

    Subtitle:

    > You can still use built-in symbols, emoji, or text-only cards.

    Button:

    > Open Settings

    Secondary:

    > Use built-in symbol

    ---

    # 22. Success States

    ## Phrase spoken

    Text:

    > Spoken.

    Animation:

    - Small wave from mascot
    - No huge confetti every time

    ---

    ## Phrase saved

    Text:

    > Saved to phrases.

    ---

    ## Symbol created

    Text:

    > Symbol added.

    ---

    ## Routine completed

    Text:

    > Routine complete.

    Mascot:

    - Celebrating

    ---

    # 23. Accessibility Requirements

    Before launch, test:

    - User can complete onboarding without dragging.
    - User can complete onboarding without press-and-hold.
    - User can use tap-only controls.
    - VoiceOver labels are clear.
    - Buttons are at least 44 x 44 pt.
    - AAC cards are larger than minimum.
    - Text supports Dynamic Type.
    - Reduce Motion works.
    - Color is not the only way to show state.
    - Haptics can be disabled.
    - Guest users can access starter AAC.
    - Speech works offline for built-in phrases.
    - Permissions are optional and recoverable.
    - User can clear mistakes easily.

    ---

    # 24. MVP Feature List

    ## Must have

    1. Splash screen
    2. Onboarding flow
    3. AAC demo
    4. Main board
    5. Tap symbol to add
    6. Drag symbol to board
    7. Press-and-hold shortcut
    8. Speak sentence
    9. Backspace
    10. Clear
    11. Save phrase
    12. Starter symbols
    13. Custom symbol creation
    14. Saved phrases
    15. Activity tab
    16. Reaction time demo
    17. Routine builder
    18. Guest mode
    19. Sign in
    20. Paywall
    21. Settings

    ---

    ## Not needed for first launch

    These can come later:

    - Huge symbol library
    - AI symbol generation
    - Therapist dashboard
    - Family accounts
    - Multi-device collaboration
    - Advanced analytics
    - Eye gaze
    - Switch scanning
    - Board sharing
    - Full custom themes

    Do not overload version one. You are building an app, not a space station with feelings.

    ---

    # 25. Paywall Rules

    The paywall should appear only after the user understands the app.

    Best placement:

    After:

    - AAC sentence demo
    - Saved phrase preview
    - Custom symbol preview
    - Activity preview

    Paywall should include:

    - Clear trial length
    - Clear price
    - Renewal explanation
    - Restore purchases
    - Terms
    - Privacy
    - Continue with free version

    Never hide the free path.

    ---

    # 26. Account Rules

    Do not force account before AAC demo.

    Account screen copy:

    > Save your boards and phrases.

    Options:

    - Sign in with Apple
    - Continue with email
    - Continue as guest

    Guest limitations should be gentle:

    Guest can:

    - Use starter board
    - Speak symbols
    - Save limited phrases
    - Try routines

    Account unlocks:

    - Backup
    - Sync
    - Restore
    - More personalization

    ---

    # 27. Final Recommended User Journey

    1. User opens app.
    2. Splash screen shows mascot and TapTalk title.
    3. Welcome screen introduces TapTalk.
    4. Mascot asks for name.
    5. User enters name or skips.
    6. App says nice to meet you.
    7. Optional attribution question.
    8. User selects what they want help with.
    9. User sees AAC preview.
    10. User builds “I want help.”
    11. User taps Speak.
    12. App speaks the sentence.
    13. User learns Backspace and Clear.
    14. User saves phrase.
    15. User creates sample symbol.
    16. User tries reaction time demo.
    17. User sees routine preview.
    18. User sees free trial.
    19. User signs in or continues as guest.
    20. User lands on main Board.

    ---

    # 28. Final Product Principle

    TapTalk should never make communication feel harder.

    Every important action should be:

    - Visible
    - Tappable
    - Forgiving
    - Reversible
    - Accessible
    - Fast

    The onboarding should teach by doing.

    The board should let the user speak with the least effort possible.

    The first emotional moment should be:

    > I tapped symbols, and the app spoke for me.

    That is the product.

    Hello, Welcome	First human contact after splash
    1. Mascot Intro + Name	Creates personal connection
    2. Nice to Meet You	Small reward for entering name
    3. Where Did You Hear About Us?	Optional marketing attribution
    4. What Brings You to TapTalk?	Personalizes the rest of onboarding
    5. Choose Main Goal	Creates user commitment
    6. AAC Preview	Explains AAC simply with visuals
    7. Try This Out Intro	Prepares user for the demo
    8. Build First Sentence	The core dopamine moment — "I want help"
    9. First Spoken Sentence	Reward after speaking
    10. Success Reaction	Makes the win feel meaningful
    11. Backspace & Clear Lesson	Teaches correction without stress
    12. Save Phrase Preview	Shows saved phrases feature
    13. Custom Symbol Intro	Shows personalization
    14. Create Sample Symbol	Teaches symbol creation
    15. Activity Intro	Introduces ADHD/focus features
    16. Reaction Time Demo	Quick win activity
    17. Routine Intro	Shows routine support
    18. First-Then Preview	Teaches First-Then support
    19. mPersonalization Summary	Shows app has adapted to user