import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';

// Mock fetch
global.fetch = jest.fn();

// Helper component to test the hook
const AuthConsumer = () => {
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <button data-testid="login" onClick={() => login('test@example.com', 'password')}>Login</button>
      <button data-testid="register" onClick={() => register('Test User', 'test@example.com', 'password')}>Register</button>
      <button data-testid="logout" onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth check
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ success: false })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });
  
  it('provides authentication state and methods', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // After auth check completes
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Should not be authenticated initially
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });
  
  it('handles login successfully', async () => {
    // Mock successful login
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              user: {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'user'
              },
              token: 'fake-token'
            }
          })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false })
      });
    });
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login'));
    
    // Should be loading during login
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // After login completes
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
    
    // Verify fetch was called with correct arguments
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    }));
  });
  
  it('handles login failure', async () => {
    // Mock failed login
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'Invalid credentials'
          })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false })
      });
    });
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    const user = userEvent.setup();
    
    // Use act to handle the rejected promise
    await act(async () => {
      await user.click(screen.getByTestId('login'));
    });
    
    // After login fails
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
  });
  
  it('handles logout', async () => {
    // First mock a successful login
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              user: {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'user'
              },
              token: 'fake-token'
            }
          })
        });
      } else if (url === '/api/auth/logout') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false })
      });
    });
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Login first
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login'));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });
    
    // Now logout
    await user.click(screen.getByTestId('logout'));
    
    // After logout completes
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
    
    // Verify logout API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
    }));
  });
});
