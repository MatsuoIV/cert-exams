interface WelcomeScreenProps {
  title: string
  description?: string
  totalQuestions: number
  durationSeconds: number   // -1 = sin límite
  onStart: () => void
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Sin límite de tiempo'
  const minutes = Math.round(seconds / 60)
  return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
}

export function WelcomeScreen({
  title,
  description,
  totalQuestions,
  durationSeconds,
  onStart,
}: WelcomeScreenProps) {
  return (
    <div className="welcome">
      <div className="welcome-card">
        <h1 className="welcome-title">{title}</h1>
        {description && <p className="welcome-description">{description}</p>}

        <ul className="welcome-meta">
          <li>
            <span className="welcome-meta-icon">📋</span>
            <span><strong>{totalQuestions}</strong> preguntas</span>
          </li>
          <li>
            <span className="welcome-meta-icon">⏱</span>
            <span>{formatDuration(durationSeconds)}</span>
          </li>
          <li>
            <span className="welcome-meta-icon">🔀</span>
            <span>Las preguntas se presentan en orden aleatorio</span>
          </li>
        </ul>

        <button className="btn btn--primary btn--large" onClick={onStart}>
          Iniciar examen
        </button>
      </div>

      <footer className="welcome-footer">
        Hecho con amor, paciencia, Sertralina y Caldo de Gallina
      </footer>
    </div>
  )
}
