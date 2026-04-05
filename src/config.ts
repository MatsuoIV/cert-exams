const minutes = Number(import.meta.env.VITE_EXAM_DURATION_MINUTES)

/**
 * Duración del examen en segundos.
 * 0 significa sin límite de tiempo.
 * Valor tomado de VITE_EXAM_DURATION_MINUTES en tiempo de build.
 */
export const EXAM_DURATION_SECONDS = Number.isFinite(minutes) && minutes > 0
  ? Math.round(minutes * 60)
  : 0
