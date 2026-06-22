/* global React */

function OnboardingScreen({ onDone }) {
  const { ProgressBar, SpeechBubble, Mascot, TextField, Button } = window.DS;
  const [name, setName] = React.useState('');
  const [display, setDisplay] = React.useState('');
  const A = window.ASSET;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* progress */}
      <div style={{ padding: '4px 24px 0' }}>
        <ProgressBar value={0.18} segments={2} />
      </div>

      {/* speech bubble */}
      <div style={{ padding: '20px 22px 0' }}>
        <SpeechBubble tail="bottom" style={{ fontSize: 17 }}>
          Welcome to TapTalk! I'm <b>Clo</b>. Before we get started, <b>what would
          you like me to call you?</b>
        </SpeechBubble>
      </div>

      {/* mascot */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px' }}>
        <Mascot src={`${A}/mascots/happy_smile.png`} alt="Clo smiling" size={150} float />
      </div>

      {/* bottom white card */}
      <div style={{
        marginTop: 'auto', background: 'var(--tt-surface)',
        borderTopLeftRadius: 40, borderTopRightRadius: 40,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        padding: '28px 26px 30px', display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div>
          <TextField label="Name" placeholder="e.g. Alex Jones"
            helper="Enter your full first and last legal name"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <TextField label="Display name" placeholder="e.g. DragonSlayer20"
            helper="This is the name that will be displayed on the app!"
            value={display} onChange={e => setDisplay(e.target.value)} />
        </div>
        <Button label="Continue" full onClick={onDone} style={{ marginTop: 4 }} />
        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--tt-text-tertiary)',
          fontFamily: 'var(--tt-font-base)',
        }}>
          Check out this <b style={{ color: 'var(--tt-primary)' }}>LINK</b> to see how we store confidential data
        </div>
      </div>
    </div>
  );
}

window.OnboardingScreen = OnboardingScreen;
