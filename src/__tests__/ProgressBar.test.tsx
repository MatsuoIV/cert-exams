import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../components/ProgressBar'

describe('ProgressBar', () => {
  it('renders current and total', () => {
    render(<ProgressBar current={3} total={10} />)
    expect(screen.getByText('3 / 10')).toBeInTheDocument()
  })

  it('sets aria attributes correctly', () => {
    render(<ProgressBar current={2} total={5} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '5')
  })

  it('fill width reflects percentage', () => {
    const { container } = render(<ProgressBar current={1} total={4} />)
    const fill = container.querySelector('.progress-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('25%')
  })

  it('shows 0% when total is zero', () => {
    const { container } = render(<ProgressBar current={0} total={0} />)
    const fill = container.querySelector('.progress-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })
})
