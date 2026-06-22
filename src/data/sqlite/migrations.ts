export const SYMBOL_BRAIN_DB_VERSION = 1;

export const SYMBOL_BRAIN_MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY NOT NULL,
    concept_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('svg','png')),
    category TEXT,
    rating REAL,
    source TEXT NOT NULL,
    license TEXT NOT NULL,
    author TEXT NOT NULL,
    is_sensitive INTEGER NOT NULL DEFAULT 0,
    age_level TEXT DEFAULT 'all',
    locale_json TEXT NOT NULL DEFAULT '[]',
    aac_priority REAL NOT NULL DEFAULT 0.5,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS concepts (
    concept_id TEXT PRIMARY KEY NOT NULL,
    canonical_label TEXT NOT NULL,
    concept_type TEXT NOT NULL,
    part_of_speech TEXT,
    category TEXT,
    core_or_fringe TEXT NOT NULL,
    description TEXT,
    default_symbol_id TEXT
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY NOT NULL,
    keyword TEXT NOT NULL,
    normalized_keyword TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    locale TEXT NOT NULL DEFAULT 'en-AU',
    source TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS symbol_tags (
    id TEXT PRIMARY KEY NOT NULL,
    symbol_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    normalized_tag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_symbol_preferences (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    preferred_symbol_id TEXT NOT NULL,
    preference_score REAL NOT NULL DEFAULT 1.0,
    last_used_at TEXT NOT NULL,
    selected_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    raw_input TEXT NOT NULL,
    normalized_input TEXT NOT NULL,
    matched_concept_id TEXT,
    selected_symbol_id TEXT,
    accepted_or_overridden TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS licence_attribution (
    id TEXT PRIMARY KEY NOT NULL,
    symbol_id TEXT NOT NULL,
    source TEXT NOT NULL,
    author TEXT NOT NULL,
    license TEXT NOT NULL,
    attribution_text TEXT NOT NULL,
    source_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS derived_symbols (
    id TEXT PRIMARY KEY NOT NULL,
    original_symbol_id TEXT NOT NULL,
    new_symbol_id TEXT NOT NULL,
    modification_description TEXT NOT NULL,
    license TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_symbols (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    label TEXT NOT NULL,
    concept_id TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_keywords_normalized_keyword
    ON keywords(normalized_keyword);
  CREATE INDEX IF NOT EXISTS idx_keywords_concept_id
    ON keywords(concept_id);
  CREATE INDEX IF NOT EXISTS idx_symbols_concept_id
    ON symbols(concept_id);
  CREATE INDEX IF NOT EXISTS idx_symbols_category
    ON symbols(category);
  CREATE INDEX IF NOT EXISTS idx_symbol_tags_normalized_tag
    ON symbol_tags(normalized_tag);
  CREATE INDEX IF NOT EXISTS idx_user_symbol_preferences_user_id
    ON user_symbol_preferences(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_symbol_preferences_concept_id
    ON user_symbol_preferences(concept_id);

  INSERT OR IGNORE INTO schema_migrations (id, applied_at)
    VALUES (1, datetime('now'));
  `,
];
