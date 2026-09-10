import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InspectorDashboard } from '../components/screens/InspectorDashboard';
import { useInspectorDashboard } from '../hooks/useInspectorDashboard';
import { useAuth } from '../context/AuthContext';

vi.mock('../hooks/useInspectorDashboard');
vi.mock('../context/AuthContext');
vi.mock('../hooks/useCreateInspection');

const mockUseInspectorDashboard = useInspectorDashboard as any;
const mockUseAuth = useAuth as any;

describe('InspectorDashboard', () => {
  const mockOnStartNewInspection = vi.fn();
  const mockOnSelectInspection = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { name: 'Test Inspector' }
    });
  });

  it('renders loading skeletons initially', () => {
    mockUseInspectorDashboard.mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
      isOffline: false,
      refresh: vi.fn()
    });

    render(
      <InspectorDashboard 
        onStartNewInspection={mockOnStartNewInspection}
        onSelectInspection={mockOnSelectInspection}
        onNavigate={mockOnNavigate}
      />
    );

    // Verify loading skeletons are present (we can check text that shouldn't be there yet)
    expect(screen.queryByText('No inspections yet')).not.toBeInTheDocument();
  });

  it('renders error state on failure', () => {
    const mockRefresh = vi.fn();
    mockUseInspectorDashboard.mockReturnValue({
      isLoading: false,
      data: null,
      error: 'Failed to load dashboard data',
      isOffline: false,
      refresh: mockRefresh
    });

    render(
      <InspectorDashboard 
        onStartNewInspection={mockOnStartNewInspection}
        onSelectInspection={mockOnSelectInspection}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Unable to load dashboard data.')).toBeInTheDocument();
    
    const retryBtn = screen.getByText('TRY AGAIN');
    fireEvent.click(retryBtn);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders empty state when no inspections exist', () => {
    mockUseInspectorDashboard.mockReturnValue({
      isLoading: false,
      data: {
        summary: { totalInspections: 0, pendingReview: 0, potentialViolations: 0, verified: 0 },
        recentInspections: []
      },
      error: null,
      isOffline: false,
      refresh: vi.fn()
    });

    render(
      <InspectorDashboard 
        onStartNewInspection={mockOnStartNewInspection}
        onSelectInspection={mockOnSelectInspection}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('No inspections yet')).toBeInTheDocument();
  });

  it('renders data correctly', () => {
    mockUseInspectorDashboard.mockReturnValue({
      isLoading: false,
      data: {
        summary: { totalInspections: 5, pendingReview: 2, potentialViolations: 1, verified: 2 },
        recentInspections: [
          {
            id: 'INS-01',
            category: 'Electronics',
            productName: 'Electronics',
            manufacturer: 'TechCorp',
            status: 'VERIFIED_COMPLIANT',
            date: '2023-10-01T12:00:00Z',
            time: '12:00',
            inspectorName: 'Test',
            inspectorId: 'T1',
            retailerName: 'Test Store',
            retailerAddress: '123 Main St',
            city: 'Test City',
            gtin: '12345678901234',
            classification: 'VERIFIED',
            confidenceScore: 99,
            findingsCount: 0
          }
        ]
      },
      error: null,
      isOffline: false,
      refresh: vi.fn()
    });

    render(
      <InspectorDashboard 
        onStartNewInspection={mockOnStartNewInspection}
        onSelectInspection={mockOnSelectInspection}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('INS-01')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
  });

  it('handles + New Inspection creation', async () => {
    mockUseInspectorDashboard.mockReturnValue({
      isLoading: false,
      data: { summary: {}, recentInspections: [] },
      error: null,
      isOffline: false,
      refresh: vi.fn()
    });

    const mockCreateInspection = vi.fn().mockResolvedValue('NEW-INS-ID');
    const { useCreateInspection } = await import('../hooks/useCreateInspection');
    (useCreateInspection as any).mockReturnValue({
      createInspection: mockCreateInspection,
      isCreating: false,
      error: null
    });

    render(
      <InspectorDashboard 
        onStartNewInspection={mockOnStartNewInspection}
        onSelectInspection={mockOnSelectInspection}
        onNavigate={mockOnNavigate}
      />
    );

    const newBtn = screen.getByText('+ New Inspection');
    fireEvent.click(newBtn);

    expect(mockCreateInspection).toHaveBeenCalled();
    
    // Check if onStartNewInspection is called with the new ID after tick
    await new Promise(process.nextTick);
    expect(mockOnStartNewInspection).toHaveBeenCalledWith('NEW-INS-ID');
  });
});
