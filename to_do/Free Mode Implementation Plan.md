# Free Mode Implementation Plan

## Purpose

- Create a free AAC board mode for TapTalk.
- Keep communication access free.
- Avoid cloud storage costs for free users.
- Store free user data locally on the user's device.
- Keep paid/cloud features separate from free/local features.
- Protect privacy, accessibility, and user dignity.

---

## Main Product Decision

- The paid app remains the full cloud-connected TapTalk experience.
- The free mode is called **Free Mode** or **Guest Mode**.
- Free Mode uses local device storage only.
- Free Mode does not require login, sign-up, email, name, phone number, or profile.
- Free Mode does not sync to cloud.
- Free Mode does not use paid-user cloud data.
- Cloud sync only starts when the user chooses paid/account mode and gives consent.

---

## Start-To-Finish Free Mode Flow

- User downloads TapTalk.
- User opens TapTalk for the first time.
- User sees a mode selector screen.
- User chooses:
  - **Continue Free**
  - **Sign In / Create Account**
- User taps **Continue Free**.
- User sees a short Free Mode notice.
- User enters the Free Mode board.
- User uses the AAC board immediately.
- User changes board settings if needed.
- User saves phrases locally.
- User exits the app.
- App saves Free Mode data locally.
- User opens the app again.
- App reloads the same local board.
- No account is created.
- No cloud data is used.
- No personal information is requested.

---

## Free Mode Board

- The Free Mode board should be a one-to-one replica of the current TapTalk board.
- The board should look and feel the same as the current board.
- The board should still support AAC communication.
- The board should still allow tap-to-speak.
- The board should still allow folders.
- The board should still allow symbols.
- The board should still allow symbol packs.
- The board should still allow sentence building.
- The board should still allow delete/backspace.
- The board should still allow clear.
- The board should still allow saved QuickTalk phrases.
- The board should still allow simple board settings.
- The board should still use calm, accessible, iOS-native design.
- The difference is storage, not communication ability.

---

## Naming

- Public user name:
  - **Free Mode**
- Technical/internal name:
  - **Guest Mode**
- User-facing wording:
  - **Free Mode**
  - **Saved on this device**
  - **No account required**
  - **No cloud backup**

---

## Free Mode Features

- AAC board
- Tap-to-speak symbols
- Folder navigation
- Symbol packs
- Sentence input bar
- Backspace/delete
- Clear sentence
- Save QuickTalk phrase
- Favourite QuickTalk phrase
- Reorder QuickTalk phrases
- Recently spoken history
- Basic word suggestions
- Basic symbol suggestions
- Time-of-day suggestions
- Planner / step sequence
- Countdown timer for planner steps
- Local settings
- Export backup
- Import backup
- Delete local data
- Local backup limit

---

## Free Mode Capacity

- Up to 3,500 symbols
- 14 symbol packs
- 100 to 300 symbols per pack
- Nested folders allowed
- 3 to 5 folder levels allowed
- Up to 50 QuickTalk phrases
- QuickTalk favourites allowed
- QuickTalk reorder allowed
- Local spoken history allowed
- Local planner steps allowed
- 10 to 20 accessibility/settings options
- Local backups limited to 3 to 5 backups

---

## What Free Mode Should Not Include

- No login
- No sign-up
- No email collection
- No name collection
- No phone number collection
- No cloud sync
- No cloud backup
- No paid AI cloud processing
- No account profile
- No cross-device sync
- No hidden analytics
- No advertising trackers
- No third-party tracking SDKs
- No automatic upload of board data
- No automatic upload of saved phrases
- No automatic upload of history
- No automatic upload of planner data

---

## Local Storage Integration

- Use SQLite for Free Mode local storage.
- SQLite stores data on the user's device.
- SQLite does not create a cloud account.
- SQLite does not charge cloud storage fees.
- SQLite should store structured data only.
- Store references, not heavy files.
- Store symbol IDs, not duplicate symbol assets.
- Store folder structure as IDs and parent-child relationships.
- Store QuickTalk phrases as text.
- Store settings as small values.
- Store history as local records.
- Store planner steps as local records.
- Store backups as limited local files or database snapshots.

---

## Data To Store Locally

- Board layout
- Folder structure
- Symbol placement
- Symbol IDs
- Symbol labels
- Symbol pack selections
- Tile size
- Folder colour
- Symbol colour
- Text colour
- Outline setting
- Haptic setting
- Board size setting
- Accessibility settings
- QuickTalk phrases
- QuickTalk favourites
- QuickTalk order
- Recently spoken history
- Planner steps
- Timer settings
- Local backup metadata

---

## Data To Avoid In Free Mode

- Legal name
- Email
- Phone number
- Address
- Date of birth
- NDIS number
- Support worker details
- Medical records
- Diagnosis fields
- Payment details
- Account ID
- Cloud user ID
- Device advertising ID
- Precise location
- Photos
- Voice recordings
- Contact list
- Background tracking data

---

## Free Mode Settings

- Symbol size
- Folder size
- Board size
- Text size
- Text colour
- Tile colour
- Folder colour
- Outline on/off
- Outline thickness
- Haptics on/off
- Reduce Motion support
- Animation intensity
- Speech speed
- Speak on tap on/off
- Show labels on/off
- Show history on/off
- QuickTalk limit display
- Backup/export controls
- Delete local data control

---

## Free Mode Planner

- User creates a simple plan.
- User adds steps.
- Each step can use a symbol or short phrase.
- Each step can have an optional timer.
- User can move to the next step.
- Completion feedback must stay calm.
- Avoid overwhelming animations.
- Respect Reduce Motion.
- Confetti should be optional or reduced when Reduce Motion is enabled.
- Planner data stays local only.

---

## Symbol Packs

- Symbol packs should be prebuilt groups of symbols and folders.
- Symbol packs should install into the local board.
- Symbol packs should use symbol references.
- Symbol packs should not duplicate heavy assets.
- Symbol packs should be optional.
- User can add a pack without adding symbols one by one.
- User can still edit symbols and folders after adding a pack.

---

## Suggested Symbol Pack Structure

- Responses
- Feelings
- Actions
- People
- Social
- Places
- Transport
- School
- Home
- Health
- Food
- Activities
- Safety
- ABC & 123

---

## Local Backup Rules

- Allow manual backup.
- Allow import backup.
- Limit local backups to 3 to 5.
- Delete the oldest backup when the limit is reached.
- Show a warning before export.
- Show a warning before import.
- Show a warning before deleting local data.
- Do not silently create unlimited backups.

---

## Free Mode Privacy Rules

- Free Mode data stays on device.
- Free Mode does not collect personal information.
- Free Mode does not require an account.
- Free Mode does not send board data to cloud.
- Free Mode does not send saved phrases to cloud.
- Free Mode does not send usage history to cloud.
- Free Mode does not send planner data to cloud.
- User can delete local data.
- User can export local data if they choose.
- User must be warned that exported data is their responsibility.

---

## Cloud / Paid Separation

- Paid mode uses account login.
- Paid mode can use cloud sync.
- Paid mode can use cloud backup.
- Paid mode can use cross-device sync.
- Paid mode can use subscription features.
- Paid mode can use AI features if disclosed.
- Paid mode needs cloud consent.
- Paid mode needs account deletion.
- Paid mode needs cloud data deletion.
- Paid mode must not automatically import Free Mode data without user consent.
- Free Mode must not automatically upload to paid/cloud storage.

---

## Upgrade From Free Mode To Paid Mode

- User chooses upgrade.
- App explains what will change.
- App asks for account creation.
- App asks for cloud sync consent.
- User chooses whether to upload local board data.
- User can continue without upload.
- User can stay in Free Mode.
- No forced upgrade.
- No loss of voice access if they do not upgrade.

---

## Required Documents

- Privacy Policy
- Terms of Use
- Data Collection Summary
- Guest Mode / Free Mode Data Notice
- Cloud Sync Data Notice
- Cloud Sync Consent Statement
- Export / Import Data Warning
- Delete Guest Data Notice
- Delete Account Notice
- Subscription Terms
- App Store Privacy Label Answers
- Privacy Impact Assessment
- NDIS Dignity and Choice Statement
- Data Retention Policy
- Data Deletion Policy
- Security Summary
- Third-Party Services List
- Contact / Privacy Support Details

---

## Where Documents Should Go

### First Mode Selector Screen

- Free Mode short notice
- Cloud/Paid Mode short notice
- Privacy Policy link
- Terms of Use link

### Free Mode Board

- No large legal block
- Keep the board clean
- Legal links should stay in settings

### Free Mode Settings

- Free Mode Data Notice
- Delete Guest Data Notice
- Export / Import Data Warning
- Privacy Policy link
- Terms of Use link
- Contact / Privacy Support link

### Legal & Privacy Settings

- Privacy Policy
- Terms of Use
- Data Collection Summary
- Free Mode Data Notice
- Cloud Sync Data Notice
- Data Retention Policy
- Data Deletion Policy
- Security Summary
- Third-Party Services List
- Contact / Privacy Support Details

### Export / Import Screen

- Export / Import Data Warning
- Backup privacy warning
- Import safety warning

### Delete Guest Data Screen

- Delete Guest Data Notice
- Final confirmation message

### Sign Up / Login Screen

- Cloud Sync Data Notice
- Privacy Policy link
- Terms of Use link

### Cloud Sync Consent Screen

- Cloud Sync Consent Statement
- Data Collection Summary link
- Privacy Policy link

### Account Settings

- Delete Account Notice
- Cloud data deletion option
- Privacy Policy link
- Terms of Use link

### Paywall / Subscription Screen

- Subscription Terms
- Payment disclosure
- Restore purchases button
- Privacy Policy link
- Terms of Use link

---

## Simple User Notices

### Free Mode Notice

- Free Mode does not need an account.
- Your board saves on this device only.
- TapTalk does not upload your Free Mode board to cloud.
- If you delete the app, your local data may be lost.
- You can export a backup in settings.

### Cloud Sync Notice

- Cloud sync stores your TapTalk data online.
- This can help backup and sync your board across devices.
- Cloud sync requires an account.
- Cloud sync only starts after you give consent.

### Export Warning

- Your export may include saved phrases, board setup, history, settings, and planner steps.
- Keep the file private.
- Anyone with access to the file may be able to restore or view your setup.

### Delete Guest Data Warning

- This deletes Free Mode data stored on this device.
- This may include board setup, saved phrases, settings, history, and planner steps.
- This cannot be undone unless you exported a backup.

---

## Legal / Compliance Basics

- Be clear about local storage.
- Be clear about cloud storage.
- Do not hide data collection.
- Do not collect personal data in Free Mode.
- Do not use cloud sync without consent.
- Do not claim NDIS approval unless officially approved.
- Do not claim medical or clinical proof unless properly supported.
- Keep App Store Privacy Label answers accurate.
- Keep privacy policy matching the real app behaviour.
- Keep account deletion available for account users.
- Keep guest data deletion available for Free Mode users.

---

## Apple Notes To Remember

- Apple requires accurate App Store privacy disclosures.
- Apple treats transmitted and retained off-device data as collected data.
- Apple says data processed only on device is generally not collected for App Store privacy answers.
- Apple requires a privacy policy URL.
- Apple requires account deletion inside the app if account creation is available.
- App Store privacy labels must match the real app.

Official Apple references:
- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/

---

## Australia / Privacy Notes To Remember

- The Privacy Act and Australian Privacy Principles focus on personal information.
- Personal information means information that identifies a person or could reasonably identify a person.
- Free Mode should avoid collecting personal information.
- If cloud mode collects account/user data, disclose it clearly.
- Keep privacy wording simple and understandable.

Official OAIC reference:
- https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-quick-reference

---

## NDIS Notes To Remember

- Respect privacy.
- Respect dignity.
- Respect choice and control.
- Do not make communication access dependent on payment.
- Do not use patronising language.
- Do not make false NDIS approval claims.
- Keep the app calm, accessible, and safe for people with disability.

Official NDIS Commission reference:
- https://www.ndiscommission.gov.au/rules-and-standards/ndis-code-conduct

---

## Implementation Basics

- Add Free Mode selector.
- Add Free Mode local SQLite database.
- Create separate local storage service.
- Keep Free Mode separate from cloud sync service.
- Add board save/load from SQLite.
- Add QuickTalk save/load from SQLite.
- Add settings save/load from SQLite.
- Add history save/load from SQLite.
- Add planner save/load from SQLite.
- Add export/import.
- Add delete guest data.
- Add local backup limit.
- Add Free Mode data notice.
- Add Legal & Privacy settings page.
- Add Cloud Sync consent before upload.
- Add account deletion for cloud users.
- Add App Store privacy label answers document.
- Add privacy impact assessment document.

---

## Testing Basics

- Test fresh install.
- Test Free Mode without internet.
- Test Free Mode with airplane mode.
- Test closing and reopening app.
- Test app update with existing local data.
- Test deleting guest data.
- Test export backup.
- Test import backup.
- Test upgrade from Free Mode to paid mode.
- Test refusing cloud sync.
- Test cloud sync consent.
- Test Reduce Motion.
- Test VoiceOver.
- Test large text.
- Test small screens.
- Test slow older devices.
- Run typecheck.

---

## Risks

- Local database migration can break old saved boards.
- Free Mode and Cloud Mode can accidentally mix if not separated clearly.
- Export files can contain user-created sensitive text.
- Unlimited backups can waste local storage.
- Hidden analytics can create privacy risk.
- Too many animations can harm accessibility.
- Complex folder depth can confuse users.
- App Store privacy labels can become wrong if features change.
- Cloud sync consent can be unclear if wording is too vague.

---

## Final Build Rule

- Free Mode gives users a voice.
- Free Mode saves locally.
- Free Mode costs TapTalk no cloud storage.
- Paid Mode adds convenience.
- Paid Mode adds backup, sync, account, and premium services.
- Do not take away core communication because someone does not pay.

---

## Final Report Format For Claude / Fable / Cursor

1. What changed
2. Files touched
3. Why it matters
4. Accessibility impact
5. Privacy impact
6. Risks
7. Typecheck result
8. Next recommended step

---

## Not Legal Advice

- This plan is a product and implementation planning document.
- It is not legal advice.
- A lawyer should review the final Privacy Policy, Terms of Use, subscription wording, and App Store disclosures before launch.
