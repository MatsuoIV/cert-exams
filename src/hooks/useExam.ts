import { useState, useEffect, useCallback } from 'react'
import type { ExamData, ExamPhase, Question, UserAnswers } from '../types/exam'

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface UseExamReturn {
  phase: ExamPhase
  examData: ExamData | null
  shuffledQuestions: Question[]
  currentIndex: number
  currentQuestion: Question | null
  totalQuestions: number
  userAnswers: UserAnswers
  isLastQuestion: boolean
  timeLeft: number        // segundos restantes; -1 si no hay límite
  toggleAnswer: (questionId: string, optionId: string) => void
  goNext: () => void
  goPrev: () => void
  goTo: (index: number) => void
  startExam: () => void
  submitExam: () => void
  restartExam: () => void
  getScore: () => { correct: number; total: number; percentage: number }
  isAnswerCorrect: (questionId: string) => boolean
}

/**
 * @param dataUrl         URL del archivo JSON de preguntas
 * @param durationSeconds Duración del examen en segundos. 0 = sin límite.
 */
export function useExam(dataUrl: string, durationSeconds = 0): UseExamReturn {
  const [phase, setPhase] = useState<ExamPhase>('loading')
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({})
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds > 0 ? durationSeconds : -1)

  useEffect(() => {
    fetch(dataUrl)
      .then((res) => res.json())
      .then((data: ExamData) => {
        setExamData(data)
        setPhase('welcome')
      })
      .catch(() => setPhase('welcome'))
  }, [dataUrl])

  // Countdown — solo activo durante la fase de examen con límite configurado
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0) return

    const id = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)

    return () => clearInterval(id)
  }, [phase, timeLeft > 0])  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-envío cuando el tiempo llega a 0
  useEffect(() => {
    if (timeLeft === 0 && phase === 'exam') {
      setPhase('summary')
    }
  }, [timeLeft, phase])

  const totalQuestions = shuffledQuestions.length
  const currentQuestion = shuffledQuestions[currentIndex] ?? null
  const isLastQuestion = totalQuestions > 0 && currentIndex === totalQuestions - 1

  const startExam = useCallback(() => {
    if (!examData) return
    setShuffledQuestions(shuffleArray(examData.questions))
    setCurrentIndex(0)
    setUserAnswers({})
    setTimeLeft(durationSeconds > 0 ? durationSeconds : -1)
    setPhase('exam')
  }, [examData, durationSeconds])

  const toggleAnswer = useCallback((questionId: string, optionId: string) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] ?? []
      const question = shuffledQuestions.find((q) => q.id === questionId)
      if (!question) return prev

      const isMultiple = question.correctAnswers.length > 1

      if (isMultiple) {
        const updated = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: updated }
      } else {
        return { ...prev, [questionId]: [optionId] }
      }
    })
  }, [shuffledQuestions])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1))
  }, [totalQuestions])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalQuestions - 1)))
  }, [totalQuestions])

  const submitExam = useCallback(() => {
    setPhase('summary')
  }, [])

  // Vuelve a la pantalla de bienvenida para iniciar un nuevo intento
  const restartExam = useCallback(() => {
    setShuffledQuestions([])
    setCurrentIndex(0)
    setUserAnswers({})
    setTimeLeft(durationSeconds > 0 ? durationSeconds : -1)
    setPhase('welcome')
  }, [durationSeconds])

  const isAnswerCorrect = useCallback((questionId: string): boolean => {
    const question = examData?.questions.find((q) => q.id === questionId)
    if (!question) return false
    const given = [...(userAnswers[questionId] ?? [])].sort()
    const expected = [...question.correctAnswers].sort()
    return given.length === expected.length && given.every((v, i) => v === expected[i])
  }, [examData, userAnswers])

  const getScore = useCallback(() => {
    const total = shuffledQuestions.length
    const correct = shuffledQuestions.filter((q) => isAnswerCorrect(q.id)).length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, total, percentage }
  }, [shuffledQuestions, isAnswerCorrect])

  return {
    phase,
    examData,
    shuffledQuestions,
    currentIndex,
    currentQuestion,
    totalQuestions,
    userAnswers,
    isLastQuestion,
    timeLeft,
    toggleAnswer,
    goNext,
    goPrev,
    goTo,
    startExam,
    submitExam,
    restartExam,
    getScore,
    isAnswerCorrect,
  }
}

export { shuffleArray }
