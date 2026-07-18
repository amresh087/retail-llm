import { useState } from 'react';

interface Props {
  open: boolean;
  initialToken?: string | null;
  onRefresh: (token: string) => void;
  onCancel: () => void;
}

const RefreshSessionModal = ({ open, initialToken, onRefresh, onCancel }: Props) => {
  const [token, setToken] = useState(initialToken ?? '');
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 420 }}>
        <h3>Session Expired</h3>
        <p>Your session has expired. You can extend it by providing a refresh token.</p>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Refresh Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onRefresh(token)} style={{ background: '#0b74de', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4 }}>Refresh Session</button>
        </div>
      </div>
    </div>
  );
};

export default RefreshSessionModal;
