import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import { ThemeToggle } from './ThemeToggle';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

const useThemeMock = vi.mocked(useTheme);
const setTheme = vi.fn();

describe('ThemeToggle', () => {
  it('renders a toggle button with the theme aria-label', () => {
    useThemeMock.mockReturnValue({ resolvedTheme: 'light', setTheme });

    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'nav.toggleTheme' })).toBeInTheDocument();
  });

  it('toggles to the opposite explicit theme on click', async () => {
    useThemeMock.mockReturnValue({ resolvedTheme: 'dark', setTheme });
    const user = userEvent.setup();

    render(<ThemeToggle />);
    await user.click(screen.getByRole('button'));

    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
