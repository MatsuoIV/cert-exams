import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExam, shuffleArray } from '../hooks/useExam'
import type { ExamData } from '../types/exam'

const mockExamData: ExamData = {
  title: 'Test Exam',
  questions: [
    {
      id: 'q1',
      text: 'Single answer question',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
      ],
      correctAnswers: ['b'],
    },
    {
      id: 'q2',
      text: 'Multiple answer question',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
      ],
      correctAnswers: ['a', 'c'],
    },
    {
      id: 'q3',
      text: 'Third question',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
      ],
      correctAnswers: ['a'],
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockExamData),
    })
  )
})

/** Helper: loads data and starts the exam. */
async function loadAndStart(result: ReturnType<typeof renderHook<ReturnType<typeof useExam>, unknown>>['result']) {
  await act(async () => {})         // resolve fetch → welcome
  act(() => result.current.startExam()) // welcome → exam
}

// ─────────────────────────────────────────────────────────
describe('shuffleArray', () => {
  it('returns an array with the same elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffleArray(arr)
    expect(result).toHaveLength(arr.length)
    expect(result.sort()).toEqual([...arr].sort())
  })

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3]
    const copy = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(copy)
  })

  it('returns a new array reference', () => {
    const arr = [1, 2, 3]
    expect(shuffleArray(arr)).not.toBe(arr)
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — loading and welcome phase', () => {
  it('starts in loading phase', () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    expect(result.current.phase).toBe('loading')
  })

  it('transitions to welcome after data loads', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await act(async () => {})
    expect(result.current.phase).toBe('welcome')
    expect(result.current.examData).toEqual(mockExamData)
  })

  it('has no current question in welcome phase', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await act(async () => {})
    expect(result.current.currentQuestion).toBeNull()
    expect(result.current.totalQuestions).toBe(0)
  })

  it('transitions to exam on startExam', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await act(async () => {})
    act(() => result.current.startExam())
    expect(result.current.phase).toBe('exam')
  })

  it('sets totalQuestions after startExam', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    expect(result.current.totalQuestions).toBe(3)
  })

  it('shuffles questions on each startExam call', async () => {
    // Run startExam many times and check that at least one different order is produced
    const orders = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const { result } = renderHook(() => useExam('/data/questions.json'))
      await act(async () => {})
      act(() => result.current.startExam())
      // Collect the IDs in order
      const ids: string[] = []
      for (let idx = 0; idx < 3; idx++) {
        if (idx > 0) act(() => result.current.goNext())
        ids.push(result.current.currentQuestion?.id ?? '')
      }
      orders.add(ids.join(','))
    }
    // With 3 questions there are 6 possible orderings; we should see more than 1
    expect(orders.size).toBeGreaterThan(1)
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — navigation', () => {
  it('starts on the first question', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentQuestion).not.toBeNull()
  })

  it('moves to the next question', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goNext())
    expect(result.current.currentIndex).toBe(1)
  })

  it('does not go beyond the last question', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goNext())
    act(() => result.current.goNext())
    act(() => result.current.goNext()) // attempt past end
    expect(result.current.currentIndex).toBe(2)
  })

  it('moves to the previous question', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goNext())
    act(() => result.current.goPrev())
    expect(result.current.currentIndex).toBe(0)
  })

  it('does not go before the first question', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goPrev())
    expect(result.current.currentIndex).toBe(0)
  })

  it('flags isLastQuestion correctly', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    expect(result.current.isLastQuestion).toBe(false)
    act(() => result.current.goNext())
    act(() => result.current.goNext())
    expect(result.current.isLastQuestion).toBe(true)
  })

  it('goTo jumps directly to a given index', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goTo(2))
    expect(result.current.currentIndex).toBe(2)
  })

  it('goTo clamps to valid range', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.goTo(-5))
    expect(result.current.currentIndex).toBe(0)
    act(() => result.current.goTo(100))
    expect(result.current.currentIndex).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — answering', () => {
  it('records a single answer (radio)', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    const q1Id = result.current.currentQuestion!.id
    act(() => result.current.toggleAnswer(q1Id, 'b'))
    expect(result.current.userAnswers[q1Id]).toEqual(['b'])
  })

  it('replaces the previous answer for single-answer questions', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q1', 'a'))
    act(() => result.current.toggleAnswer('q1', 'c'))
    expect(result.current.userAnswers['q1']).toEqual(['c'])
  })

  it('accumulates multiple answers for multi-answer questions', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q2', 'a'))
    act(() => result.current.toggleAnswer('q2', 'c'))
    expect(result.current.userAnswers['q2']).toContain('a')
    expect(result.current.userAnswers['q2']).toContain('c')
    expect(result.current.userAnswers['q2']).toHaveLength(2)
  })

  it('deselects an answer when toggled again (multi-answer)', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q2', 'a'))
    act(() => result.current.toggleAnswer('q2', 'c'))
    act(() => result.current.toggleAnswer('q2', 'a')) // deselect
    expect(result.current.userAnswers['q2']).toEqual(['c'])
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — scoring', () => {
  it('marks a correct single answer', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q1', 'b'))
    expect(result.current.isAnswerCorrect('q1')).toBe(true)
  })

  it('marks a wrong single answer', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q1', 'a'))
    expect(result.current.isAnswerCorrect('q1')).toBe(false)
  })

  it('marks correct multi-answer when all selected', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q2', 'a'))
    act(() => result.current.toggleAnswer('q2', 'c'))
    expect(result.current.isAnswerCorrect('q2')).toBe(true)
  })

  it('marks wrong multi-answer when partially selected', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q2', 'a'))
    expect(result.current.isAnswerCorrect('q2')).toBe(false)
  })

  it('computes score correctly', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q1', 'b'))  // correct
    act(() => result.current.toggleAnswer('q2', 'a'))  // correct (part 1)
    act(() => result.current.toggleAnswer('q2', 'c'))  // correct (part 2)
    act(() => result.current.toggleAnswer('q3', 'b'))  // wrong
    const score = result.current.getScore()
    expect(score.correct).toBe(2)
    expect(score.total).toBe(3)
    expect(score.percentage).toBe(67)
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — exam flow', () => {
  it('transitions to summary on submitExam', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.submitExam())
    expect(result.current.phase).toBe('summary')
  })

  it('restartExam goes back to welcome and resets state', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.toggleAnswer('q1', 'b'))
    act(() => result.current.goNext())
    act(() => result.current.submitExam())
    act(() => result.current.restartExam())

    expect(result.current.phase).toBe('welcome')
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.userAnswers).toEqual({})
    expect(result.current.totalQuestions).toBe(0)
  })

  it('can start a new attempt after restart', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await loadAndStart(result)
    act(() => result.current.submitExam())
    act(() => result.current.restartExam())
    act(() => result.current.startExam())

    expect(result.current.phase).toBe('exam')
    expect(result.current.totalQuestions).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────
describe('useExam — timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns -1 when no duration is set', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json'))
    await act(async () => {})
    expect(result.current.timeLeft).toBe(-1)
  })

  it('initializes timeLeft with the given duration', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 120))
    await act(async () => {})
    expect(result.current.timeLeft).toBe(120)
  })

  it('counts down every second after startExam', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 10))
    await act(async () => {})
    act(() => result.current.startExam())
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(result.current.timeLeft).toBe(7)
  })

  it('does not count down in welcome phase', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 10))
    await act(async () => {})
    // Still in welcome — timer should not tick
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(result.current.timeLeft).toBe(10)
  })

  it('transitions to summary when time reaches 0', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 5))
    await act(async () => {})
    act(() => result.current.startExam())
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(result.current.phase).toBe('summary')
  })

  it('preserves answers when time runs out', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 5))
    await act(async () => {})
    act(() => result.current.startExam())
    act(() => result.current.toggleAnswer('q1', 'b'))
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(result.current.userAnswers['q1']).toEqual(['b'])
    expect(result.current.phase).toBe('summary')
  })

  it('resets timeLeft on restartExam', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 10))
    await act(async () => {})
    act(() => result.current.startExam())
    await act(async () => { vi.advanceTimersByTime(4000) })
    expect(result.current.timeLeft).toBe(6)
    act(() => result.current.restartExam())
    expect(result.current.timeLeft).toBe(10)
  })

  it('does not count down during summary phase', async () => {
    const { result } = renderHook(() => useExam('/data/questions.json', 30))
    await act(async () => {})
    act(() => result.current.startExam())
    act(() => result.current.submitExam())
    const snapshot = result.current.timeLeft
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(result.current.timeLeft).toBe(snapshot)
  })
})
