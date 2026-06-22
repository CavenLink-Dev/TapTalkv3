/* global React */

// Pull primitives from the compiled design-system bundle.
const DS = window.TapTalkDesignSystem_5cf136;

const ASSET = '../../assets';

// ─── Phone frame ──────────────────────────────────────────────────────────────
function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 393, height: 844, position: 'relative', flex: 'none',
      background: '#000', borderRadius: 56, padding: 11,
      boxShadow: '0 30px 80px rgba(13,36,54,0.32)',
    }}>
      <div style={{
        width: '100%', height: '100%', background: 'var(--tt-background)',
        borderRadius: 46, overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* notch */}
        <div style={{
          position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)',
          width: 126, height: 34, background: '#000', borderRadius: 20, zIndex: 50,
        }} />
        {children}
      </div>
    </div>
  );
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({ dark }) {
  const c = dark ? '#fff' : 'var(--tt-text)';
  return (
    <div style={{
      height: 50, flex: 'none', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 28px 0 32px',
      fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 15, color: c,
    }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
        <span>●●●</span><span>📶</span><span>🔋</span>
      </span>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'talk',  label: 'Talk',  icon: `${ASSET}/aac/board_icon.png` },
    { id: 'today', label: 'Today', icon: `${ASSET}/aac/tools_icon.png` },
    { id: 'me',    label: 'Me',    icon: `${ASSET}/aac/profile_icon.png` },
  ];
  return (
    <div style={{
      flex: 'none', display: 'flex', background: 'var(--tt-nav-background)',
      borderTop: '1px solid #E3E9EF', paddingBottom: 22, paddingTop: 8,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 0', WebkitTapHighlightColor: 'transparent',
          }}>
            <img src={t.icon} alt="" style={{
              width: 26, height: 26, objectFit: 'contain',
              opacity: on ? 1 : 0.4,
              filter: on ? 'none' : 'grayscale(0.6)',
            }} />
            <span style={{
              fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 10,
              color: on ? 'var(--tt-primary)' : 'var(--tt-text-tertiary)',
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────
function App() {
  const [phase, setPhase] = React.useState('onboarding'); // 'onboarding' | 'app'
  const [tab, setTab] = React.useState('talk');

  let screen = null;
  if (phase === 'onboarding') {
    screen = <window.OnboardingScreen onDone={() => setPhase('app')} />;
  } else if (tab === 'talk') {
    screen = <window.TalkScreen />;
  } else if (tab === 'today') {
    screen = <window.TodayScreen />;
  } else {
    screen = <window.MeScreen onRestart={() => { setPhase('onboarding'); setTab('talk'); }} />;
  }

  return (
    <PhoneFrame>
      <StatusBar />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {screen}
      </div>
      {phase === 'app' && <TabBar active={tab} onChange={setTab} />}
    </PhoneFrame>
  );
}

Object.assign(window, { App, ASSET, DS });
