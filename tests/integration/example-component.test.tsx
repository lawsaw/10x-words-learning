import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

/**
 * Example integration test for React components
 * This demonstrates testing UI components with React Testing Library
 */

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should render button with different variants', () => {
    render(<Button variant="outline">Outlined</Button>)

    const button = screen.getByRole('button', { name: /outlined/i })
    expect(button).toBeInTheDocument()
    // Check that the button has Tailwind classes applied
    expect(button.className).toBeTruthy()
  })

  it('should render disabled button', () => {
    render(<Button disabled>Disabled</Button>)

    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })

  it('should render button with custom className', () => {
    render(<Button className="custom-class">Custom</Button>)

    const button = screen.getByRole('button', { name: /custom/i })
    expect(button).toHaveClass('custom-class')
  })
})
