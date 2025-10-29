import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignUpForm } from '../SignUpForm';
import { authClient } from '@/lib/auth/client';

// Mock the auth client
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sign-up form', () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should display error message on failed sign-up', async () => {
    const errorMessage = 'Email already exists';
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      error: { message: errorMessage },
      data: null,
    });

    render(<SignUpForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard on successful sign-up', async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: { user: { id: '1', email: 'test@example.com' } } as { user: { id: string; email: string } },
      error: null,
    });

    render(<SignUpForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  // Extracted promise logic for mocking signUp.email
  function mockSignUpEmailWithDelay() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: { user: { id: '1', email: 'test@example.com' } },
          error: null,
        });
      }, 100);
    });
  }

  it('should show loading state during submission', async () => {
    vi.mocked(authClient.signUp.email).mockImplementation(mockSignUpEmailWithDelay);

    render(<SignUpForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
  });

  it('should require all fields', () => {
    render(<SignUpForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(nameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it('should require minimum password length', () => {
    render(<SignUpForm />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(passwordInput.minLength).toBe(8);
  });
});
