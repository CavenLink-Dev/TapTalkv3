Single-line text input with an uppercase label, helper text, and error/shake state. Use for all form entry.

```jsx
<TextField label="Name" placeholder="e.g. Alex Jones" value={name} onChange={e => setName(e.target.value)} />
<TextField label="Email" type="email" error="Please enter a valid email" />
<TextField label="Display name" helper="This is shown in the app!" white />
```

Setting `error` turns the border red and runs a 3-shake animation. `white` switches the fill from grey to white. 48px min height.
