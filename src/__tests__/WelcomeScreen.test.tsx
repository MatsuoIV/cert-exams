import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeScreen } from '../components/WelcomeScreen'

const defaultProps = {
  title: 'GH-200: GitHub Actions',
  totalQuestions: 80,
  durationSeconds: 1800,
  onStart: vi.fn(),
}

describe('WelcomeScreen', () => {
  it('renders the exam title', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText('GH-200: GitHub Actions')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<WelcomeScreen {...defaultProps} description="Banco de preguntas de certificación." />)
    expect(screen.getByText('Banco de preguntas de certificación.')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.queryByText(/certificación/i)).not.toBeInTheDocument()
  })

  it('shows the number of questions', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText(/80/)).toBeInTheDocument()
  })

  it('formats duration in minutes', () => {
    render(<WelcomeScreen {...defaultProps} durationSeconds={1800} />)
    expect(screen.getByText(/30 minutos/i)).toBeInTheDocument()
  })

  it('shows "Sin límite de tiempo" when durationSeconds is 0', () => {
    render(<WelcomeScreen {...defaultProps} durationSeconds={0} />)
    expect(screen.getByText(/sin límite/i)).toBeInTheDocument()
  })

  it('shows "Sin límite de tiempo" when durationSeconds is -1', () => {
    render(<WelcomeScreen {...defaultProps} durationSeconds={-1} />)
    expect(screen.getByText(/sin límite/i)).toBeInTheDocument()
  })

  it('renders the Iniciar button', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument()
  })

  it('calls onStart when Iniciar is clicked', async () => {
    const onStart = vi.fn()
    render(<WelcomeScreen {...defaultProps} onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /iniciar/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('mentions random order', () => {
    render(<WelcomeScreen {...defaultProps} />)
    expect(screen.getByText(/aleatorio/i)).toBeInTheDocument()
  })
})
