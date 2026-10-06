export function Placeholder({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="ecran" style={{ padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{titre}</h1>
      <p style={{ color: 'var(--texte-2)', margin: 0 }}>{texte}</p>
    </div>
  )
}
