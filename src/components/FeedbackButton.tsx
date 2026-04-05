const FORM_URL = import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined

export function FeedbackButton() {
  if (!FORM_URL) return null
  return (
    <a
      href={FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn--feedback"
    >
      💬 Give me your feedback
    </a>
  )
}
