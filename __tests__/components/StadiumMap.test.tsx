/**
 * @jest-environment jsdom
 *
 * Tests for components/StadiumMap.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StadiumMap from '@/components/StadiumMap';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock firestore subscription — returns a no-op unsubscribe
jest.mock('@/lib/firestore', () => ({
  subscribeToZoneDensity: jest.fn(() => jest.fn()),
}));

// Mock analytics to prevent firebase import chain in jsdom
jest.mock('@/lib/analytics', () => ({
  logZoneClicked: jest.fn(),
}));

describe('StadiumMap', () => {
  it('renders the map region with accessible label', () => {
    render(<StadiumMap />);
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Interactive SVG stadium zone map');
  });

  it('renders the demo mode badge by default', () => {
    render(<StadiumMap />);
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('renders all zone labels in the SVG', () => {
    render(<StadiumMap />);
    expect(screen.getByText('Gate A')).toBeInTheDocument();
    expect(screen.getByText('Gate B')).toBeInTheDocument();
    expect(screen.getByText('Food Court')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });

  it('renders the density legend', () => {
    render(<StadiumMap />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders zone markers with aria-labels containing density info', () => {
    const { container } = render(<StadiumMap />);
    // SVG <g> elements with role="button" aren't recognized by testing-library's role queries in jsdom,
    // so we query the DOM directly for elements with aria-label containing "Crowd density"
    const zoneMarkers = container.querySelectorAll('[aria-label*="Crowd density"]');
    expect(zoneMarkers).toHaveLength(4);
  });

  it('zone markers have correct aria-label format', () => {
    const { container } = render(<StadiumMap />);
    const gateA = container.querySelector('[aria-label*="Gate A"]');
    expect(gateA).toBeTruthy();
    expect(gateA?.getAttribute('aria-label')).toMatch(/Gate A.*Crowd density.*\d+%/);
  });

  it('renders the legend as an accessible list', () => {
    render(<StadiumMap />);
    const legend = screen.getByRole('list');
    expect(legend).toBeInTheDocument();
    expect(legend).toHaveAttribute('aria-label', 'Density colour legend');
  });

  it('renders 3 legend items', () => {
    render(<StadiumMap />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('renders the Navigate Here button is not shown initially', () => {
    render(<StadiumMap />);
    // The detail drawer (with "Navigate Here" button) only appears on zone click
    expect(screen.queryByText('Navigate Here')).not.toBeInTheDocument();
  });
});
