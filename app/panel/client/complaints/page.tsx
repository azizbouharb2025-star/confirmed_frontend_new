'use client';

/**
 * Complaints Dashboard Page
 * Displays complaint management interface for Pro+ subscribers
 * Requirements: 2.1, 2.4, 2.5, 2.6
 */

import React, { useCallback, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ComplaintSummaryCards from '@/components/complaints/ComplaintSummaryCards';
import ComplaintsTable from '@/components/complaints/ComplaintsTable';
import ComplaintFilters from '@/components/complaints/ComplaintFilters';
import ComplaintDetailPanel from '@/components/complaints/ComplaintDetailPanel';
import { useComplaints } from '@/hooks/useComplaints';
import { useComplaintDetail } from '@/hooks/useComplaintDetail';
import { useRealTimeComplaints } from '@/hooks/useRealTimeComplaints';
import { useSubscription } from '@/hooks/useSubscription'
import { WidgetGate } from '@/components/dashboard/WidgetGate';
import { Complaint, ComplaintFilters as ComplaintFiltersType, ComplaintStatus } from '@/types/complaint';

/**
 * ClientComplaintsPage - Main complaints dashboard for sellers
 * 
 * Features:
 * - Tier gating for Pro+ access (Requirements: 2.6)
 * - Summary cards showing complaint counts by status (Requirements: 2.1)
 * - Paginated complaints table (Requirements: 2.2)
 * - Filter controls (Requirements: 2.3)
 * - Real-time updates via WebSocket (Requirements: 2.4, 2.5)
 */
export default function ClientComplaintsPage() {
  const { plan, canAccess } = useSubscription();
  
  // Check if user has Pro+ access
  const _hasProAccess = canAccess('pro');
  
  // Selected complaint for detail panel
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  
  // Initialize complaints hook
  const {
    complaints,
    summary,
    isLoading,
    isSummaryLoading,
    error,
    filters,
    setFilters,
    pagination,
    setPage,
    refetch,
    addComplaint,
    updateComplaint,
  } = useComplaints();

  // Initialize complaint detail hook
  const {
    complaint: selectedComplaint,
    updateStatus,
    addNote,
    isUpdatingStatus,
    isAddingNote,
  } = useComplaintDetail(selectedComplaintId || '');

  /**
   * Handle row click to open detail panel
   */
  const handleRowClick = useCallback((complaint: Complaint) => {
    setSelectedComplaintId(complaint._id);
    setIsDetailPanelOpen(true);
  }, []);

  /**
   * Handle closing detail panel
   */
  const handleCloseDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false);
    setSelectedComplaintId(null);
  }, []);

  /**
   * Handle status update from detail panel
   */
  const handleStatusUpdate = useCallback(async (status: ComplaintStatus, note?: string) => {
    await updateStatus(status, note);
    refetch(); // Refresh the list after update
  }, [updateStatus, refetch]);

  /**
   * Handle adding note from detail panel
   */
  const handleAddNote = useCallback(async (content: string) => {
    await addNote(content);
  }, [addNote]);

  /**
   * Handle new complaint from WebSocket
   * Requirements: 2.4
   */
  const handleNewComplaint = useCallback((complaint: Complaint) => {
    addComplaint(complaint);
  }, [addComplaint]);

  /**
   * Handle complaint update from WebSocket
   * Requirements: 2.5
   */
  const handleComplaintUpdate = useCallback((complaint: Complaint) => {
    updateComplaint(complaint);
  }, [updateComplaint]);

  // Subscribe to real-time complaint events
  const { isConnected } = useRealTimeComplaints(
    handleNewComplaint,
    handleComplaintUpdate
  );

  /**
   * Handle filter changes
   * Requirements: 2.3
   */
  const handleFiltersChange = useCallback((newFilters: ComplaintFiltersType) => {
    setFilters(newFilters);
  }, [setFilters]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <DashboardLayout userRole="shop_owner">
      <WidgetGate
        requiredPlan="pro"
        currentPlan={plan}
        featureName="Complaints Dashboard"
        featureDescription="View and manage customer complaints with real-time updates and analytics"
      >
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Complaints
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Manage and resolve customer complaints
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection status indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Cards - Requirements: 2.1 */}
          <ComplaintSummaryCards
            summary={summary}
            isLoading={isSummaryLoading}
          />

          {/* Filters - Requirements: 2.3 */}
          <ComplaintFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Complaints Table - Requirements: 2.2 */}
          <ComplaintsTable
            complaints={complaints}
            isLoading={isLoading}
            error={error}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            totalComplaints={pagination.total}
            onRowClick={handleRowClick}
            onPageChange={handlePageChange}
            onRetry={handleRetry}
          />
        </div>
      </WidgetGate>

      {/* Complaint Detail Panel - Requirements: 3.1, 3.4, 3.5, 3.6 */}
      <ComplaintDetailPanel
        complaint={selectedComplaint}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onStatusUpdate={handleStatusUpdate}
        onAddNote={handleAddNote}
        isUpdatingStatus={isUpdatingStatus}
        isAddingNote={isAddingNote}
      />
    </DashboardLayout>
  );
}
