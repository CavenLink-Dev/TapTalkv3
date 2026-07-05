# IMPLEMENTATION — SYMBOL PACK SYSTEM EXPANSION

## Context

Expand the existing symbol pack system. This is a focused addition, not a full redesign.

Use the existing `SymbolPackFolder` / `SymbolPackSymbol` structure in `src/data/symbolPacks.ts` and the existing Add Symbol browse flow. Do not create a new library system, do not replace Mulberry, do not duplicate symbol assets.

---

## A generation script has already been prepared

**Run this first:**

```
npx ts-node --skip-project scripts/buildSymbolPacks.ts
```

This script:
- Has 155 verified Mulberry symbol IDs (all confirmed against `to_do/mulberry_categories.json`)
- Generates a complete new `src/data/symbolPacks.ts` with 10 nested packs
- Validates every ID before writing — prints `MISSING:` for any that fail
- Only touches `src/data/symbolPacks.ts` — no user data, no board state, no other files

**Reference file for all available symbol IDs:**
`to_do/mulberry_categories.json` — 3,436 symbols across 117 categories, grouped by Mulberry category name. Use this to look up any symbol ID you need.

---

## What the script already generates

These 10 packs are done and verified:

- **Answers** → Yes & No → Core → Questions
- **Numbers** → 0–10 → 11–20 → Tens (20–100)
- **Letters** → A–M → N–Z → a–m → n–z
- **Feelings** → Positive → Negative → Neutral
- **Food** → Fruit → Meals → Drinks
- **Transport** → Road → Rail → Air → Water
- **Activities** → Creative → Sport
- **Health** → Hygiene → Pain → Care
- **Places** → Everyday
- **Technology** → Devices

---

## Your task — expand the script further

Add more packs to `scripts/buildSymbolPacks.ts` using the same structure. Then re-run it to regenerate `src/data/symbolPacks.ts`.

**Rules:**
- Use only symbol IDs that exist in `to_do/mulberry_categories.json`
- Confirm every ID before adding it — no fake IDs, no placeholders
- Keep folders nested: top-level pack → sub-folder → symbols
- Each pack should aim for 50+ symbols total across its sub-folders
- Include communication functions, not only nouns (verbs, questions, feelings, requests)
- Keep wording mature, calm, and respectful — not childish
- Keep Australian users in mind where relevant
- Do not overwrite custom user symbols or break existing board data

---

## Suggested new starter pack areas to add

Each is a top-level folder. Folders branch into sub-folders. Sub-folders branch again where needed, then into individual symbols. Every pack targets 50+ symbols total.

- **Emergency** — medical emergency, fire and hazard, mental health crisis, lost or missing, allergy alert, general safety
- **Quick Answers** — yes and no, agreement, disagreement, I need time, I don't understand, quick reactions, quick social phrases
- **Drinks** — hot drinks, cold drinks, caffeinated, dietary options, café orders
- **Feelings (expanded)** — basic emotions, positive feelings, negative feelings, physical feelings, social feelings, complex feelings, emotional needs
- **Body and Health (expanded)** — body parts, pain and discomfort, medical appointments, medication, procedures, sleep, exercise, mental health
- **Home and Daily Life** — rooms, household tasks, appliances, daily morning and night routines, home safety
- **People and Relationships** — immediate family, extended family, friends, support workers, professionals, community people, pronouns
- **School and Learning** — core subjects, specialist subjects, school routine, school places, learning tasks, tools, social at school
- **Work and Employment** — office, trades, retail, care and support work, work actions, communication at work, rights and breaks
- **Therapy and Allied Health** — speech therapy, OT, physiotherapy, psychology, session vocabulary, goals and progress
- **Community and Places** — shopping, leisure, parks, beach, library, café, health services, government services, finance
- **Transport (expanded)** — vehicles (cars, bikes, trucks, motorbikes, special), public transport (bus, train, tram, ferry, taxi), air travel (airport, on the plane), walking and accessibility, directions and navigation
- **Time and Scheduling** — parts of day, clock times, days of the week, months, calendar events, morning and evening routines
- **Questions and Conversation** — question words, conversation starters, asking for help, clarification, confirming, ending conversations
- **Sensory and Needs** — sensory overload, comfort seeking, sensory preferences, physical needs, emotional regulation
- **Social and Community Life** — greetings, making plans, events, talking about yourself, compliments, disagreements
- **Privacy and Consent** — consent, personal space, privacy, boundaries, safety
- **Activities and Hobbies** — sports, creative activities, games, relaxation, social activities
- **Pain and Body** — pain location, pain type, pain scale, describing discomfort, asking for care
- **Toilet and Hygiene** — toilet needs, washing, grooming, dental care, personal care routine
- **Support Worker** — greetings, daily tasks, requests, preferences, feedback, end of visit

---

## Acceptance checks

- Symbol Pack Browser still opens correctly
- Existing packs still work
- New packs appear in the Add Symbol browse flow
- Every added symbol resolves to a real Mulberry symbol (no missing IDs in the validation output)
- No duplicate assets are created
- No custom user data is overwritten
- Typecheck passes: `npx tsc --noEmit`

---

## Final report required

1. What packs were added
2. Files touched
3. Why these packs were chosen
4. AAC usefulness
5. Accessibility impact
6. Any symbol IDs that could not be safely found
7. Typecheck result
8. Recommended next pack batch
