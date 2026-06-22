/* global React */

function TodayScreen() {
  const { Card, Checkbox, Badge, Pill } = window.DS;
  const A = window.ASSET;
  const [tasks, setTasks] = React.useState([
    { id: 1, label: 'Brush teeth', tag: 'Morning', done: true },
    { id: 2, label: 'Speech practice with Clo', tag: 'Therapy', done: false },
    { id: 3, label: 'Pack school bag', tag: 'Morning', done: false },
    { id: 4, label: 'Story time', tag: 'Evening', done: false },
  ]);
  const toggle = (id) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const done = tasks.filter(t => t.done).length;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const tagTone = { Morning: 'primary', Therapy: 'success', Evening: 'warning' };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 30,
          color: 'var(--tt-text)', margin: '6px 0 2px' }}>Today</h1>
        <span style={{ fontFamily: 'var(--tt-font-base)', fontSize: 14, color: 'var(--tt-text-muted)' }}>
          Tuesday, 22 June</span>
      </div>

      {/* week strip */}
      <div style={{ display: 'flex', gap: 6, margin: '14px 0 18px' }}>
        {days.map((d, i) => {
          const today = i === 1;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tt-text-tertiary)',
                fontFamily: 'var(--tt-font-display)', marginBottom: 6 }}>{d}</div>
              <div style={{
                height: 38, borderRadius: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: 'var(--tt-font-display)', fontWeight: 800,
                fontSize: 15,
                background: today ? 'var(--tt-primary)' : 'var(--tt-surface)',
                color: today ? '#fff' : 'var(--tt-text-muted)',
                border: today ? 'none' : '1.5px solid var(--tt-border)',
              }}>{20 + i}</div>
            </div>
          );
        })}
      </div>

      {/* First-Then */}
      <Card padding={16} style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 13,
          color: 'var(--tt-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4,
          marginBottom: 12 }}>First · Then</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {[['First', '🦷', 'Brush teeth'], ['Then', '🎮', 'Play time']].map(([k, e, l], i) => (
            <React.Fragment key={k}>
              <div style={{ flex: 1, textAlign: 'center', background: 'var(--tt-input-bg)',
                borderRadius: 14, padding: '14px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--tt-primary)',
                  fontFamily: 'var(--tt-font-display)', letterSpacing: 0.4 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 34, margin: '4px 0' }}>{e}</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--tt-font-display)',
                  color: 'var(--tt-text)' }}>{l}</div>
              </div>
              {i === 0 && <span style={{ fontSize: 22, color: 'var(--tt-text-tertiary)' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* tasks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '4px 2px 12px' }}>
        <span style={{ fontFamily: 'var(--tt-font-display)', fontWeight: 800, fontSize: 18,
          color: 'var(--tt-text)' }}>Tasks</span>
        <Badge tone="primary">{done}/{tasks.length} done</Badge>
      </div>
      <Card padding={6}>
        {tasks.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
            borderBottom: i < tasks.length - 1 ? '1px solid #EEF2F6' : 'none',
          }}>
            <Checkbox checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{ flex: 1, fontFamily: 'var(--tt-font-base)', fontSize: 16,
              color: t.done ? 'var(--tt-text-tertiary)' : 'var(--tt-text)',
              textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
            <Badge tone={tagTone[t.tag] || 'neutral'}>{t.tag}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

window.TodayScreen = TodayScreen;
