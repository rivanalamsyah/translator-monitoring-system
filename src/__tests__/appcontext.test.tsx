import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import { vi } from 'vitest';

// Mock Firebase dependencies
vi.mock('../lib/firebase', () => ({
  getFirebaseApp: () => ({}),
  getFirebaseAuth: () => ({}),
  getFirebaseDb: () => ({}),
  getFirebaseStorage: () => ({}),
}));

vi.mock('../services/firestoreService', () => ({
  subscribeTranslators: vi.fn(() => vi.fn()),
  subscribeAssignments: vi.fn(() => vi.fn()),
  subscribeActivityLogs: vi.fn(() => vi.fn()),
  subscribeSettings: vi.fn(() => vi.fn()),
  subscribeTimerLogs: vi.fn(() => vi.fn()),
  subscribeNotifications: vi.fn(() => vi.fn()),
}));

describe('AppContext (production mode)', () => {
  it('renders AppProvider successfully in database mode', () => {
    render(
      <AppProvider>
        <div data-testid="child">Production ready</div>
      </AppProvider>
    );
    expect(screen.getByTestId('child').textContent).toBe('Production ready');
  });
});

