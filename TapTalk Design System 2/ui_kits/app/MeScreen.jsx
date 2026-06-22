/* global React */

function MeScreen({ onRestart }) {
  const { Card, Switch, Badge, Button, Mascot } = window.DS;
  const A = window.ASSET;
  const [lock, setLock] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);

  const rows = [
    { label: 'Parental lock', value: lock, set: setLock, hint: 'PIN required to exit' },
    { label: 'Speak on tap', value: sound, set: setSound, hint: 'Read words aloud' },
    { label: 'Haptic feedback', value: haptics, set: setHaptics, hint: 'Vibrate on press' },
  ];

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 20px 20px' }}>
      <h1 style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 30,
        color: 'var(--tt-text)', margin: '6px 0 16px' }}>Me</h1>

      {/* profile */}
      <Card padding={20} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, background: 'var(--tt-soft-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Mascot src={`${A}/mascots/heart_eyes.png`} alt="Clo" size={62} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 22,
            color: 'var(--tt-text)' }}>DragonSlayer20</div>
          <div style={{ fontFamily: 'var(--tt-font-base)', fontSize: 14,
            color: 'var(--tt-text-muted)', marginBottom: 8 }}>Alex Jones · age 9</div>
          <Badge tone="success">Free forever</Badge>
        </div>
      </Card>

      {/* stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[['128', 'words today'], ['6', 'day streak'], ['12', 'sessions']].map(([n, l]) => (
          <Card key={l} padding={14} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 26,
              color: 'var(--tt-primary)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--tt-font-base)', fontSize: 12,
              color: 'var(--tt-text-muted)' }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* settings */}
      <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 13,
        color: 'var(--tt-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4,
        margin: '4px 2px 10px' }}>Caregiver controls</div>
      <Card padding={6} style={{ marginBottom: 16 }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i < rows.length - 1 ? '1px solid #EEF2F6' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 700, fontSize: 16,
                color: 'var(--tt-text)' }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--tt-font-base)', fontSize: 13,
                color: 'var(--tt-text-tertiary)' }}>{r.hint}</div>
            </div>
            <Switch checked={r.value} onChange={r.set} />
          </div>
        ))}
      </Card>

      {/* premium */}
      <Card padding={20} radius="bg" style={{ marginBottom: 16, background: 'var(--tt-primary)',
        border: 'none', boxShadow: 'var(--tt-shadow-pop)' }}>
        <Badge tone="primary" solid style={{ background: 'rgba(255,255,255,0.22)' }}>PREMIUM</Badge>
        <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 20,
          color: '#fff', margin: '10px 0 4px' }}>Unlock therapy tools</div>
        <div style={{ fontFamily: 'var(--tt-font-base)', fontSize: 14,
          color: 'rgba(255,255,255,0.9)', marginBottom: 14 }}>
          Cognitive activities, progress reports, and guided practice with Clo.</div>
        <Button label="See plans" variant="secondary" full />
      </Card>

      <Button label="Restart onboarding" variant="ghost" full onClick={onRestart} />
    </div>
  );
}

window.MeScreen = MeScreen;
