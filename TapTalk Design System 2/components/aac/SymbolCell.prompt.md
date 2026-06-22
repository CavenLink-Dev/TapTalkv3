Colour-coded AAC symbol tile for the Talk board — the core building block of TapTalk. Tap to add the word to the sentence strip; folders open sub-boards.

```jsx
<SymbolCell label="Run" tone="verb" symbol="🏃" onClick={say} />
<SymbolCell label="Hello" tone="conjunction" image="assets/aac/card_hello.png" />
<SymbolCell label="Food" tone="folder" kind="folder" symbol="🍎" />
<SymbolCell label="The" tone="article" kind="article" />
```

`tone` follows the Fitzgerald key (verb=green, noun=purple, pronoun=yellow, question=orange, social=indigo, …). Pass `image` for a real symbol PNG, else an emoji `symbol`. `kind`: word / folder / article / question.
