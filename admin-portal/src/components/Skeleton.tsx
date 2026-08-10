import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/** A single shimmering skeleton block */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  style,
}) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius, ...style }}
  />
);

/** Skeleton for a table with N rows and M columns */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 5,
}) => (
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr>
        {Array.from({ length: cols }).map((_, i) => (
          <th key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
            <Skeleton height="0.85rem" width="70%" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
              <Skeleton height="0.85rem" width={c === 0 ? '80%' : c % 2 === 0 ? '50%' : '65%'} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/** Skeleton for the Dashboard stat cards + map */
export const SkeletonDashboard: React.FC = () => (
  <div>
    <Skeleton height="1.8rem" width="220px" style={{ marginBottom: '1.5rem' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {[0, 1].map(i => (
        <div key={i} className="card">
          <Skeleton height="0.8rem" width="120px" style={{ marginBottom: '0.75rem' }} />
          <Skeleton height="2.5rem" width="80px" />
        </div>
      ))}
    </div>
    <div className="card" style={{ height: '500px', padding: '1.5rem', overflow: 'hidden' }}>
      <Skeleton height="100%" borderRadius="6px" />
    </div>
  </div>
);

/** Skeleton for Buses / Users / Logs pages (header + table) */
export const SkeletonTablePage: React.FC<{ cols?: number }> = ({ cols = 6 }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <Skeleton height="1.8rem" width="180px" />
      <Skeleton height="2.2rem" width="130px" borderRadius="4px" />
    </div>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <SkeletonTable rows={7} cols={cols} />
    </div>
  </div>
);

/** Skeleton for StudentProfile (sidebar + detail rows) */
export const SkeletonStudentProfile: React.FC = () => (
  <div style={{ display: 'flex', height: 'calc(100vh - 72px)', margin: '-2rem' }}>
    {/* Sidebar */}
    <aside style={{ width: '280px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton height="0.75rem" width="60px" />
      <Skeleton height="1rem" width="160px" />
      <Skeleton height="0.85rem" width="120px" style={{ marginBottom: '1rem' }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} height="0.85rem" width={`${60 + (i % 4) * 10}%`} />
      ))}
    </aside>
    {/* Main */}
    <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#2170B5', padding: '1rem 1.5rem' }}>
          <Skeleton height="1rem" width="180px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '300px 1fr', borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '1rem 1.5rem' }}>
              <Skeleton height="0.8rem" width="70%" />
            </div>
            <div style={{ padding: '1rem 1.5rem' }}>
              <Skeleton height="0.8rem" width="55%" />
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

/**
 * SkeletonLogin — mirrors the exact Login page layout:
 * logo area → blue title bar → hint strip → 3 form rows → button → 2 footers
 */
export const SkeletonLogin: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)',
  }}>
    {/* Body — centred card */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', position: 'relative' }}>

      {/* Theme-toggle button placeholder (top-right) */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <Skeleton width="32px" height="32px" borderRadius="50%" />
      </div>

      {/* Login card */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
      }}>

        {/* ── White logo header ── */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Skeleton width="180px" height="70px" borderRadius="6px" />
        </div>

        {/* ── Blue title bar ── */}
        <div style={{ backgroundColor: '#2170B5', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Skeleton width="160px" height="1rem" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
        </div>

        {/* ── Form body ── */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Hint / info strip */}
          <div style={{ borderRadius: '4px', borderLeft: '4px solid #2170B5', backgroundColor: 'rgba(33,112,181,0.08)', padding: '0.75rem 1rem' }}>
            <Skeleton width="75%" height="0.8rem" />
          </div>

          {/* Row: Your ID (Email) */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="110px" height="0.85rem" style={{ marginLeft: 'auto' }} />
            <Skeleton height="2.15rem" borderRadius="4px" />
          </div>

          {/* Row: Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="80px" height="0.85rem" style={{ marginLeft: 'auto' }} />
            <Skeleton height="2.15rem" borderRadius="4px" />
          </div>

          {/* Row: Captcha — input + captcha box */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="60px" height="0.85rem" style={{ marginLeft: 'auto' }} />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Skeleton height="2.15rem" style={{ flex: 1 }} borderRadius="4px" />
              {/* Captcha display box */}
              <Skeleton width="120px" height="2.6rem" borderRadius="4px" />
            </div>
          </div>

          {/* Submit button */}
          <Skeleton height="2.75rem" borderRadius="4px" style={{ marginTop: '0.5rem', backgroundColor: 'rgba(33,112,181,0.25)' }} />
        </div>
      </div>
    </div>

    {/* ── Footer 1 — dark info bar ── */}
    <div style={{ backgroundColor: '#1C2939', padding: '1rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <Skeleton width="55%" height="0.8rem" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
    </div>

    {/* ── Footer 2 — blue bar ── */}
    <div style={{ backgroundColor: '#2170B5', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="180px" height="0.8rem" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
      <Skeleton width="100px" height="0.8rem" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
    </div>
  </div>
);

