import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).not.toBeDisabled();
  });
  
  it('renders with different variants', () => {
    render(
      <>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>
    );
    
    expect(screen.getByRole('button', { name: /default/i })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: /destructive/i })).toHaveClass('bg-destructive');
    expect(screen.getByRole('button', { name: /outline/i })).toHaveClass('border');
    expect(screen.getByRole('button', { name: /secondary/i })).toHaveClass('bg-secondary');
    expect(screen.getByRole('button', { name: /ghost/i })).toHaveClass('hover:bg-accent');
    expect(screen.getByRole('button', { name: /link/i })).toHaveClass('text-primary');
  });
  
  it('renders with different sizes', () => {
    render(
      <>
        <Button size="default">Default</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">Icon</Button>
      </>
    );
    
    expect(screen.getByRole('button', { name: /default/i })).toHaveClass('h-10 px-4 py-2');
    expect(screen.getByRole('button', { name: /small/i })).toHaveClass('h-9 px-3');
    expect(screen.getByRole('button', { name: /large/i })).toHaveClass('h-11 px-8');
    expect(screen.getByRole('button', { name: /icon/i })).toHaveClass('h-10 w-10');
  });
  
  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50 pointer-events-none');
  });
  
  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    const user = userEvent.setup();
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('renders as different elements using asChild', () => {
    render(
      <Button asChild>
        <a href="https://example.com">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveClass('bg-primary');
  });
});
