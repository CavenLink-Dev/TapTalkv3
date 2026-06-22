Selectable pill / chip for categories and segmented choices. Lay out a row of them for AAC board categories.

```jsx
<Pill label="Main" selected={cat === 'Main'} onClick={() => setCat('Main')} />
<Pill label="Food" selected={cat === 'Food'} onClick={() => setCat('Food')} />
```

Selected = primary fill + white label; idle = white surface + muted label. Built-in press scale.
