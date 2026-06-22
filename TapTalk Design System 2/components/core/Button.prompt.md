The main call-to-action button — rounded (10px), bold rounded-display label, large tap target. Use one primary per screen.

```jsx
<Button label="Continue" onClick={next} />
<Button label="Create Account" loading={submitting} full />
<Button label="Delete" variant="danger" />
<Button label="Skip" variant="ghost" size="sm" />
```

Variants: `primary` (blue), `secondary` (soft-blue fill, dark-blue text), `danger` (red), `ghost`. Sizes: `sm` / `md` / `lg`. Pass `loading` for an inline spinner, `full` to stretch, `disabled` to grey out. Press feedback (scale 0.97 + lighter fill) is built in.
