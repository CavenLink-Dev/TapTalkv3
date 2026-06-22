/* global React */

const BOARDS = {
  Main: [
    { id: 'hello',  label: 'Hello',  symbol: '👋', tone: 'conjunction',  kind: 'word' },
    { id: 'car',    label: 'Car',    symbol: '🚗', tone: 'noun',         kind: 'word' },
    { id: 'him',    label: 'Him',    symbol: '👦', tone: 'pronoun',      kind: 'word' },
    { id: 'run',    label: 'Run',    symbol: '🏃', tone: 'verb',         kind: 'word' },
    { id: 'big',    label: 'Big',    symbol: '📦', tone: 'adjective',    kind: 'word' },
    { id: 'where',  label: 'Where',  symbol: '?',  tone: 'question',     kind: 'question' },
    { id: 'please', label: 'Please', symbol: '🙏', tone: 'social',       kind: 'word' },
    { id: 'the',    label: 'The',    symbol: '',   tone: 'article',      kind: 'article' },
    { id: 'ouch',   label: 'Ouch',   symbol: '😖', tone: 'interjection', kind: 'word' },
    { id: 'food',   label: 'Food',   symbol: '🍎', tone: 'folder',       kind: 'folder' },
    { id: 'sports', label: 'Sports', symbol: '⚽', tone: 'noun',         kind: 'word' },
    { id: 'places', label: 'Places', symbol: '📍', tone: 'folder',       kind: 'folder' },
  ],
  Actions: [
    { id: 'eat',   label: 'Eat',   symbol: '🍽️', tone: 'verb',         kind: 'word' },
    { id: 'drink', label: 'Drink', symbol: '🥤', tone: 'verb',         kind: 'word' },
    { id: 'go',    label: 'Go',    symbol: '🚶', tone: 'verb',         kind: 'word' },
    { id: 'stop',  label: 'Stop',  symbol: '✋', tone: 'interjection', kind: 'word' },
    { id: 'help',  label: 'Help',  symbol: '🤝', tone: 'social',       kind: 'word' },
    { id: 'want',  label: 'Want',  symbol: '🙋', tone: 'verb',         kind: 'word' },
    { id: 'play',  label: 'Play',  symbol: '🎮', tone: 'noun',         kind: 'word' },
    { id: 'sleep', label: 'Sleep', symbol: '😴', tone: 'adjective',    kind: 'word' },
    { id: 'sit',   label: 'Sit',   symbol: '🪑', tone: 'verb',         kind: 'word' },
    { id: 'walk',  label: 'Walk',  symbol: '🚶', tone: 'verb',         kind: 'word' },
  ],
  Feelings: [
    { id: 'happy',   label: 'Happy',   symbol: '😊', tone: 'adjective',    kind: 'word' },
    { id: 'sad',     label: 'Sad',     symbol: '😢', tone: 'adjective',    kind: 'word' },
    { id: 'angry',   label: 'Angry',   symbol: '😠', tone: 'interjection', kind: 'word' },
    { id: 'scared',  label: 'Scared',  symbol: '😨', tone: 'question',     kind: 'word' },
    { id: 'tired',   label: 'Tired',   symbol: '😴', tone: 'adjective',    kind: 'word' },
    { id: 'excited', label: 'Excited', symbol: '🤩', tone: 'pronoun',      kind: 'word' },
    { id: 'love',    label: 'Love',    symbol: '❤️', tone: 'conjunction',  kind: 'word' },
    { id: 'calm',    label: 'Calm',    symbol: '😌', tone: 'adjective',    kind: 'word' },
  ],
  Food: [
    { id: 'apple',  label: 'Apple',  symbol: '🍎', tone: 'noun', kind: 'word' },
    { id: 'banana', label: 'Banana', symbol: '🍌', tone: 'noun', kind: 'word' },
    { id: 'pizza',  label: 'Pizza',  symbol: '🍕', tone: 'noun', kind: 'word' },
    { id: 'water',  label: 'Water',  symbol: '💧', tone: 'noun', kind: 'word' },
    { id: 'milk',   label: 'Milk',   symbol: '🥛', tone: 'noun', kind: 'word' },
    { id: 'cookie', label: 'Cookie', symbol: '🍪', tone: 'noun', kind: 'word' },
    { id: 'juice',  label: 'Juice',  symbol: '🍊', tone: 'noun', kind: 'word' },
    { id: 'bread',  label: 'Bread',  symbol: '🍞', tone: 'noun', kind: 'word' },
  ],
  Social: [
    { id: 'yes',      label: 'Yes',       symbol: '✅', tone: 'verb',         kind: 'word' },
    { id: 'no',       label: 'No',        symbol: '❌', tone: 'interjection', kind: 'word' },
    { id: 'thankyou', label: 'Thank You', symbol: '🙏', tone: 'social',       kind: 'word' },
    { id: 'sorry',    label: 'Sorry',     symbol: '😔', tone: 'conjunction',  kind: 'word' },
    { id: 'ok',       label: 'OK',        symbol: '👌', tone: 'verb',         kind: 'word' },
    { id: 'bye',      label: 'Bye',       symbol: '👋', tone: 'conjunction',  kind: 'word' },
  ],
};
const CATEGORIES = ['Main', 'Actions', 'Feelings', 'Food', 'Social'];

function mascotFor(n) {
  if (n === 0) return 'neutral_curious';
  if (n === 1) return 'happy_smile';
  if (n === 2) return 'happy_grin';
  return 'excited_tongue';
}

function TalkScreen() {
  const { SymbolCell, Mascot, Pill } = window.DS;
  const A = window.ASSET;
  const [cat, setCat] = React.useState('Main');
  const [words, setWords] = React.useState([]);
  const [speaking, setSpeaking] = React.useState(false);

  const text = words.map(w => w.label).join(' ');
  const has = words.length > 0;

  const tapSymbol = (item) => {
    if (item.kind === 'folder') { setCat('Food'); return; }
    setWords(w => [...w, item]);
  };
  const speak = () => {
    if (!has) return;
    setSpeaking(true);
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } else { setTimeout(() => setSpeaking(false), 800); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* message strip */}
      <div style={{ display: 'flex', gap: 10, padding: '6px 16px 10px' }}>
        <button onClick={speak} style={{
          flex: 1, textAlign: 'left', cursor: has ? 'pointer' : 'default',
          background: 'var(--tt-surface)', border: '1.5px solid var(--tt-border)',
          borderRadius: 16, padding: 12, position: 'relative', minHeight: 78,
          boxShadow: 'var(--tt-shadow-card)', WebkitTapHighlightColor: 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Mascot src={`${A}/mascots/${mascotFor(words.length)}.png`} alt="Clo" size={52}
              style={{ animation: speaking ? 'tt-float 0.6s ease-in-out infinite' : 'none' }} />
            <span style={{
              fontFamily: 'var(--tt-font-display)', fontWeight: 700, fontSize: 19,
              color: has ? 'var(--tt-text)' : 'var(--tt-text-tertiary)', lineHeight: 1.2,
            }}>{has ? text : 'Tap to speak....'}</span>
          </div>
          <span onClick={(e) => { e.stopPropagation(); setWords(w => w.slice(0, -1)); }}
            style={{
              position: 'absolute', right: 10, bottom: 10, fontSize: 20,
              opacity: has ? 1 : 0.3, cursor: 'pointer',
            }}>⌫</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setWords([])} disabled={!has} style={{
            width: 46, height: 35, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--tt-danger)', color: '#fff', fontSize: 16, opacity: has ? 1 : 0.4,
          }}>🗑</button>
          <button onClick={speak} disabled={!has} style={{
            width: 46, height: 35, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--tt-success)', color: '#fff', fontSize: 16, opacity: has ? 1 : 0.4,
          }}>🔊</button>
        </div>
      </div>

      {/* category pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px', overflowX: 'auto' }}>
        {CATEGORIES.map(c =>
          <Pill key={c} label={c} selected={cat === c} onClick={() => setCat(c)}
            style={{ flex: 'none' }} />)}
      </div>

      {/* grid */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {BOARDS[cat].map(item =>
            <SymbolCell key={item.id} label={item.label} tone={item.tone}
              symbol={item.symbol} kind={item.kind} size={68}
              onClick={() => tapSymbol(item)} />)}
        </div>
      </div>
    </div>
  );
}

window.TalkScreen = TalkScreen;
