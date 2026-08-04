import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

function TestConsumer() {
  const { currentUser, login, logout, createAssignment, assignments } = useApp();

  return (
    <div>
      <div data-testid="user">{currentUser ? currentUser.email : 'no'}</div>
      <div data-testid="assignments-count">{assignments.length}</div>
      <button onClick={() => createAssignment({ title: 'T-1' })}>create</button>
      <button onClick={() => logout()}>logout</button>
      <button
        onClick={async () => {
          await login('admin@translator.id', 'password');
        }}
      >
        login
      </button>
    </div>
  );
}

describe('AppContext (local mode)', () => {
  it('allows login in demo mode and create assignment', async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    const user = screen.getByTestId('user');
    const assignmentsCount = screen.getByTestId('assignments-count');

    expect(user.textContent).toBe('no');

    // perform login
    await act(async () => {
      const btn = screen.getByText('login');
      btn.click();
    });

    expect(user.textContent).toContain('@translator.id');

    // create assignment
    await act(async () => {
      const btn = screen.getByText('create');
      btn.click();
    });

    expect(Number(assignmentsCount.textContent)).toBeGreaterThan(0);

    // logout
    await act(async () => {
      const btn = screen.getByText('logout');
      btn.click();
    });

    expect(user.textContent).toBe('no');
  });
});
