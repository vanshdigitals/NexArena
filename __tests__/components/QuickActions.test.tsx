/**
 * @jest-environment jsdom
 *
 * Tests for components/QuickActions.tsx
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickActions from '@/components/QuickActions';

// Mock analytics to prevent firebase import chain in jsdom
jest.mock('@/lib/analytics', () => ({
  logQuickActionUsed: jest.fn(),
}));

describe('QuickActions', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders all 6 quick action buttons', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('renders expected labels', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    expect(screen.getByText('Find Restroom')).toBeTruthy();
    expect(screen.getByText('Food Court')).toBeTruthy();
    expect(screen.getByText('Nearest Exit')).toBeTruthy();
    expect(screen.getByText('Parking Info')).toBeTruthy();
    expect(screen.getByText('Medical Aid')).toBeTruthy();
    expect(screen.getByText('My Seat')).toBeTruthy();
  });

  it('calls onSelect with the correct prompt when clicked', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    const restroomBtn = screen.getByText('Find Restroom');
    fireEvent.click(restroomBtn);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(
      'Where is the nearest restroom from my current section?'
    );
  });

  it('calls onSelect with different prompts for each action', () => {
    render(<QuickActions onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText('Food Court'));
    expect(mockOnSelect).toHaveBeenLastCalledWith(
      "Show me the nearest food court and what's available there."
    );

    fireEvent.click(screen.getByText('Nearest Exit'));
    expect(mockOnSelect).toHaveBeenLastCalledWith(
      'What is the safest and quickest exit from the stadium?'
    );
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<QuickActions onSelect={mockOnSelect} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it('buttons are enabled by default', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('has an accessible region wrapper', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    const region = screen.getByRole('region');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-label')).toBe('Quick action suggestions');
  });

  it('each button has an aria-label', () => {
    render(<QuickActions onSelect={mockOnSelect} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
      expect(btn.getAttribute('aria-label')).toContain('Quick action:');
    });
  });
});
