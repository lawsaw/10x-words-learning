import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    // Arrange & Act
    render(<Button>Click me</Button>)
    
    // Assert
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should render button with outline variant', () => {
    // Arrange & Act
    render(<Button variant="outline">Outlined</Button>)
    
    // Assert
    const button = screen.getByRole('button', { name: /outlined/i })
    expect(button).toBeInTheDocument()
    expect(button.className).toBeTruthy()
  })

  it('should render disabled button', () => {
    // Arrange & Act
    render(<Button disabled>Disabled</Button>)
    
    // Assert
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })

  it('should render button with custom className', () => {
    // Arrange & Act
    render(<Button className="custom-class">Custom</Button>)
    
    // Assert
    const button = screen.getByRole('button', { name: /custom/i })
    expect(button).toHaveClass('custom-class')
  })
})

