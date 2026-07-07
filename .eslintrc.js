/**
 * Guardrails to keep TapTalk from regressing back into a 7,000-line God screen.
 *  • max-lines: 400 per file (excluding blank lines + comments)
 *  • no-restricted-imports: force TTS through SpeechService
 */
module.exports = {
  root: true,
  extends: ['expo'],
  rules: {
    'max-lines': [
      'error',
      { max: 400, skipBlankLines: true, skipComments: true },
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'expo-speech',
            message:
              'Do not call expo-speech directly. Route through src/features/speech/SpeechService.ts.',
          },
        ],
      },
    ],
  },
  overrides: [
    // The service and its tests are allowed to touch expo-speech.
    {
      files: [
        'src/features/speech/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      rules: {
        'no-restricted-imports': 'off',
        'max-lines': 'off',
      },
    },
    // Generated data files can be large.
    {
      files: ['src/data/**/*.generated.ts', 'src/data/symbolPacks.ts'],
      rules: { 'max-lines': 'off' },
    },
  ],
};
