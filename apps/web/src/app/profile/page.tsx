export default function ProfilePage() {
  const SETTINGS = [
    { label: 'Push Notifications',  desc: 'Get alerts for your favorite DJs'   },
    { label: 'High Audio Quality',  desc: 'Stream at 320kbps when available'    },
    { label: 'Dark Mode',           desc: 'Always on for OwnRadio'              },
    { label: 'Show Listener Count', desc: 'Display live listener numbers'        },
  ];
  return (
    <div style={{ padding: '24px', maxWidth: '540px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#fff' }}>U</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>User</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>user@example.com</div>
        </div>
      </div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Settings</h2>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: '24px' }}>
        {SETTINGS.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < SETTINGS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', cursor: 'pointer' }} />
          </div>
        ))}
      </div>
      <button style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        Sign Out
      </button>
    </div>
  );
}
