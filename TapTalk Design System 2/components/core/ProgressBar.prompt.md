Pill-shaped progress bar with a spring fill. Single mode for loading / password strength; two-phase for the registration flow.

```jsx
<ProgressBar value={0.4} />
<ProgressBar value={0.4} segments={2} />            {/* onboarding two-phase */}
<ProgressBar value={0.7} color="var(--tt-success)" height={6} />  {/* password strength */}
```

`value` is 0–1. For password strength, swap `color` to danger/warning/success as the score rises.
