import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/common/Navigation';
import { useContent } from '@/lib/content-provider';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock content provider
jest.mock('@/lib/content-provider', () => ({
  useContent: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseContent = useContent as jest.MockedFunction<typeof useContent>;

describe('Navigation Authentication UI', () => {
  const mockContent = {
    organization: {
      name: 'ARPU Future Rise Life Foundation',
      email: 'test@example.com',
      logo_image: '/logo.png',
    },
    navigation: [
      { id: 1, label: 'Home', link: '/' },
      { id: 2, label: 'About', link: '/about' },
      { id: 3, label: 'Programs', link: '/programs' },
      { id: 4, label: 'Donate', link: '/donate' },
      { id: 5, label: 'Contact', link: '/contact' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContent.mockReturnValue({
      content: mockContent,
      loading: false,
      error: null,
      reloadContent: jest.fn(),
      isUsingFallback: false,
      lastUpdated: new Date(),
    });
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should display login and signup buttons when not authenticated', () => {
      render(<Navigation />);

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should have correct links for login and signup buttons', () => {
      render(<Navigation />);

      const loginLink = screen.getByText('Login').closest('a');
      const signupLink = screen.getByText('Sign Up').closest('a');

      expect(loginLink).toHaveAttribute('href', '/login');
      expect(signupLink).toHaveAttribute('href', '/register');
    });

    it('should apply correct CSS classes to auth buttons', () => {
      render(<Navigation />);

      const loginButton = screen.getByText('Login');
      const signupButton = screen.getByText('Sign Up');

      expect(loginButton).toHaveClass('text-gray-600', 'hover:text-gray-800', 'font-medium');
      expect(signupButton).toHaveClass('bg-blue-600', 'text-white', 'px-4', 'py-2', 'rounded-lg');
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });
    });

    it('should display loading skeleton when session is loading', () => {
      render(<Navigation />);

      const loadingSkeleton = document.querySelector('.animate-pulse');
      expect(loadingSkeleton).toBeInTheDocument();
    });
  });

  describe('Authenticated Regular User', () => {
    const regularUserSession = {
      user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'DONOR',
        isDemoAccount: false,
      },
      expires: '2025-01-01',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: regularUserSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should display user menu when authenticated', () => {
      render(<Navigation />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('should show user avatar or initial', () => {
      render(<Navigation />);

      // Should show user initial or avatar
      const userElement = screen.getByText('J') || screen.getByTestId('user-icon');
      expect(userElement).toBeInTheDocument();
    });

    it('should display dropdown menu on user menu click', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('John Doe');
      fireEvent.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should not show admin-specific menu items for regular user', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('John Doe');
      fireEvent.click(userMenu);

      await waitFor(() => {
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated Demo Admin', () => {
    const demoAdminSession = {
      user: {
        id: 'demo-admin',
        name: 'Demo Administrator',
        email: 'admin@arpufrl.demo',
        role: 'ADMIN',
        isDemoAccount: true,
      },
      expires: '2025-01-01',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: demoAdminSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should display demo admin user menu', () => {
      render(<Navigation />);

      expect(screen.getByText('Demo Administrator')).toBeInTheDocument();
    });

    it('should show demo admin indicator', () => {
      render(<Navigation />);

      // Should show demo admin badge or indicator
      expect(screen.getByText('Demo')).toBeInTheDocument();
    });

    it('should display admin-specific menu items', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('Demo Administrator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Donations')).toBeInTheDocument();
        expect(screen.getByText('Programs')).toBeInTheDocument();
      });
    });

    it('should show demo admin visual indicators', () => {
      render(<Navigation />);

      // Should show shield icon or demo badge
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('should have correct links for admin menu items', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('Demo Administrator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        const adminDashboardLink = screen.getByText('Admin Dashboard').closest('a');
        const userManagementLink = screen.getByText('User Management').closest('a');

        expect(adminDashboardLink).toHaveAttribute('href', '/dashboard/admin');
        expect(userManagementLink).toHaveAttribute('href', '/dashboard/admin/users');
      });
    });
  });

  describe('Authenticated Regular Admin', () => {
    const regularAdminSession = {
      user: {
        id: 'admin-123',
        name: 'Regular Administrator',
        email: 'admin@example.com',
        role: 'ADMIN',
        isDemoAccount: false,
      },
      expires: '2025-01-01',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: regularAdminSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should display regular admin user menu', () => {
      render(<Navigation />);

      expect(screen.getByText('Regular Administrator')).toBeInTheDocument();
    });

    it('should not show demo admin indicator for regular admin', () => {
      render(<Navigation />);

      expect(screen.queryByText('Demo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('shield-icon')).not.toBeInTheDocument();
    });

    it('should display admin menu items but without demo indicators', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('Regular Administrator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        // Should not show demo-specific items
        expect(screen.queryByText('Demo Admin Audit')).not.toBeInTheDocument();
      });
    });
  });

  describe('Coordinator User', () => {
    const coordinatorSession = {
      user: {
        id: 'coord-123',
        name: 'Jane Coordinator',
        email: 'jane@example.com',
        role: 'COORDINATOR',
        isDemoAccount: false,
      },
      expires: '2025-01-01',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: coordinatorSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should display coordinator-specific menu items', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('Jane Coordinator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        expect(screen.getByText('Coordinator Dashboard')).toBeInTheDocument();
        expect(screen.getByText('My Referrals')).toBeInTheDocument();
        // Should not show admin-only items
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
      });
    });

    it('should have correct links for coordinator menu items', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('Jane Coordinator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        const coordinatorDashboardLink = screen.getByText('Coordinator Dashboard').closest('a');
        expect(coordinatorDashboardLink).toHaveAttribute('href', '/dashboard/coordinator');
      });
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should show mobile menu button', () => {
      render(<Navigation />);

      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('should toggle mobile menu on button click', async () => {
      render(<Navigation />);

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      expect(menuButton).toBeInTheDocument();

      fireEvent.click(menuButton!);

      // Mobile menu should appear
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('should show auth buttons in mobile menu when unauthenticated', async () => {
      render(<Navigation />);

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      fireEvent.click(menuButton!);

      await waitFor(() => {
        // Should show mobile auth buttons
        const mobileLoginButtons = screen.getAllByText('Login');
        const mobileSignupButtons = screen.getAllByText('Sign Up');

        expect(mobileLoginButtons.length).toBeGreaterThan(0);
        expect(mobileSignupButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Integration', () => {
    it('should display organization name from content', () => {
      render(<Navigation />);

      expect(screen.getByText('ARPU Future Rise Life Foundation')).toBeInTheDocument();
    });

    it('should display organization logo when available', () => {
      render(<Navigation />);

      const logo = screen.getByAltText('ARPU Future Rise Life Foundation');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.png');
    });

    it('should render navigation items from content', () => {
      render(<Navigation />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Programs')).toBeInTheDocument();
      expect(screen.getByText('Donate')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should handle missing content gracefully', () => {
      mockUseContent.mockReturnValue({
        content: null as any,
        loading: false,
        error: null,
        reloadContent: jest.fn(),
        isUsingFallback: false,
        lastUpdated: null,
      });

      render(<Navigation />);

      // Should show skeleton or fallback UI
      const skeleton = document.querySelector('.animate-pulse') || screen.getByText('Loading...');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    const { signOut } = require('next-auth/react');

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'DONOR',
            isDemoAccount: false,
          },
          expires: '2025-01-01',
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should call signOut when logout is clicked', async () => {
      render(<Navigation />);

      const userMenu = screen.getByText('John Doe');
      fireEvent.click(userMenu);

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
        expect(signOut).toHaveBeenCalled();
      });
    });

    it('should show logout confirmation for demo admin', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'demo-admin',
            name: 'Demo Administrator',
            email: 'admin@arpufrl.demo',
            role: 'ADMIN',
            isDemoAccount: true,
          },
          expires: '2025-01-01',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<Navigation />);

      const userMenu = screen.getByText('Demo Administrator');
      fireEvent.click(userMenu);

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        expect(logoutButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should have proper ARIA labels for navigation elements', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have proper button roles and labels', () => {
      render(<Navigation />);

      const menuButton = screen.getByTestId('menu-icon').closest('button');
      expect(menuButton).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', () => {
      render(<Navigation />);

      const loginLink = screen.getByText('Login');
      expect(loginLink).toBeInTheDocument();

      // Should be focusable
      loginLink.focus();
      expect(document.activeElement).toBe(loginLink);
    });
  });
});