import { useExam } from './hooks/useExam'
import { ProgressBar } from './components/ProgressBar'
import { ExamQuestion } from './components/ExamQuestion'
import { ExamSummary } from './components/ExamSummary'
import { ExamTimer } from './components/ExamTimer'
import { WelcomeScreen } from './components/WelcomeScreen'
import { QuestionNavigator } from './components/QuestionNavigator'
import { EXAM_DURATION_SECONDS } from './config'
import './App.css'

const DATA_URL = '/data/questions.json'

export default function App() {
  const {
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
  } = useExam(DATA_URL, EXAM_DURATION_SECONDS)

  if (phase === 'loading') {
    return (
      <div className="app-center">
        <p>Cargando examen...</p>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="app-center">
        <p>No se pudo cargar el examen.</p>
      </div>
    )
  }

  if (phase === 'welcome') {
    return (
      <WelcomeScreen
        title={examData.title}
        description={examData.description}
        totalQuestions={examData.questions.length}
        durationSeconds={EXAM_DURATION_SECONDS}
        onStart={startExam}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1 className="app-title">{examData.title}</h1>
          {phase === 'exam' && <ExamTimer timeLeft={timeLeft} />}
        </div>
      </header>

      <main className="app-main">
        {phase === 'exam' && currentQuestion && (
          <>
            <ProgressBar current={currentIndex + 1} total={totalQuestions} />
            <QuestionNavigator
              questions={shuffledQuestions}
              currentIndex={currentIndex}
              userAnswers={userAnswers}
              onGoTo={goTo}
            />
            <ExamQuestion
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              userAnswers={userAnswers}
              onToggleAnswer={toggleAnswer}
              onPrev={goPrev}
              onNext={goNext}
              onSubmit={submitExam}
              isFirst={currentIndex === 0}
              isLast={isLastQuestion}
            />
          </>
        )}

        {phase === 'summary' && (
          <ExamSummary
            examData={examData}
            userAnswers={userAnswers}
            score={getScore()}
            isAnswerCorrect={isAnswerCorrect}
            onRestart={restartExam}
          />
        )}
      </main>
    </div>
  )
}
