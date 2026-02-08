'use client';

/**
 * ComplaintDetailPanel Component
 * Slide-over panel showing complete complaint information
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * Property 8: Complaint detail displays all required sections
 */

import React, { Fragment, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import {
  Complaint,
  ComplaintStatus,
  ALL_COMPLAINT_STATUSES,
  getStatusDisplayName,
  getCategoryDisplayName,
} from '@/types/complaint';
import MediaGallery from './MediaGallery';
import AITagsDisplay from './AITagsDisplay';
import ResolutionTimeline from './ResolutionTimeline';

export interface ComplaintDetailPanelProps {
  /** The complaint to display */
  complaint: Complaint | null;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Callback when status is updated */
  onStatusUpdate?: (status: ComplaintStatus, note?: string) => Promise<void>;
  /** Callback when a note is added */
  onAddNote?: (content: string) => Promise<void>;
  /** Whether status update is in progress */
  isUpdatingStatus?: boolean;
  /** Whether note is being added */
  isAddingNote?: boolean;
}

/**
 * Format date/time for display
 */
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color classes
 */
function getStatusBadgeClasses(status: ComplaintStatus): string {
  const baseClasses = 'px-2.5 py-1 rounded-full text-xs font-medium';

  switch (status) {
    case 'open':
      return clsx(baseClasses, 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400');
    case 'in_progress':
      return clsx(baseClasses, 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400');
    case 'resolved':
      return clsx(baseClasses, 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400');
    case 'closed':
      return clsx(baseClasses, 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400');
    case 'escalated':
      return clsx(baseClasses, 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400');
    default:
      return clsx(baseClasses, 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400');
  }
}


/**
 * Check if complaint detail has all required sections
 * Used for property testing (Property 8)
 */
export function hasRequiredSections(complaint: Complaint): {
  hasCustomerInfo: boolean;
  hasOrderContext: boolean;
  hasCategory: boolean;
  hasDescription: boolean;
  hasMediaGallery: boolean;
  hasAITags: boolean;
  hasResolutionHistory: boolean;
} {
  return {
    hasCustomerInfo: Boolean(complaint.customerInfo && complaint.customerInfo.name && complaint.customerInfo.phone),
    hasOrderContext: Boolean(complaint.orderId),
    hasCategory: Boolean(complaint.category),
    hasDescription: Boolean(complaint.description),
    hasMediaGallery: Boolean(complaint.mediaAttachments),
    hasAITags: Boolean(complaint.aiTags),
    hasResolutionHistory: Boolean(complaint.resolutionHistory),
  };
}

/**
 * Section Header Component
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
      {title}
    </h3>
  );
}

/**
 * Customer Information Section
 * Displays customer name, phone, email
 * Requirements: 3.1
 */
function CustomerInfoSection({ complaint }: { complaint: Complaint }) {
  const customerInfo = complaint.customerInfo || {};

  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="customer-info-section">
      <SectionHeader title="Customer Information" />
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">Name</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.name || 'N/A'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">Phone</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.phone || 'N/A'}</dd>
        </div>
        {customerInfo.email && (
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-slate-400">Email</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.email}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * Order Context Section
 * Displays order ID and related information
 * Requirements: 3.1
 */
function OrderContextSection({ complaint }: { complaint: Complaint }) {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="order-context-section">
      <SectionHeader title="Order Context" />
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">Order ID</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{complaint.orderId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">Shop ID</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{complaint.shopId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">Region</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{complaint.region}</dd>
        </div>
        {complaint.productIds?.length > 0 && (
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-slate-400">Products</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">
              {complaint.productIds.length} item(s)
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}


/**
 * Complaint Details Section
 * Displays category and description
 * Requirements: 3.1
 */
function ComplaintDetailsSection({ complaint }: { complaint: Complaint }) {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="complaint-details-section">
      <SectionHeader title="Complaint Details" />
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-gray-500 dark:text-slate-400 mb-1">Category</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">
            {getCategoryDisplayName(complaint.category)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500 dark:text-slate-400 mb-1">Description</dt>
          <dd className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
            {complaint.description}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Status Update Form
 * Requirements: 3.5
 */
function StatusUpdateForm({
  currentStatus,
  onStatusUpdate,
  isUpdating,
}: {
  currentStatus: ComplaintStatus;
  onStatusUpdate: (status: ComplaintStatus, note?: string) => Promise<void>;
  isUpdating: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(currentStatus);
  const [statusNote, setStatusNote] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedStatus !== currentStatus) {
        await onStatusUpdate(selectedStatus, statusNote || undefined);
        setStatusNote('');
      }
    },
    [selectedStatus, statusNote, currentStatus, onStatusUpdate]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="status-update-form">
      <div>
        <label
          htmlFor="status-select"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
        >
          Update Status
        </label>
        <select
          id="status-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm',
            'border border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-800',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F] focus:border-transparent'
          )}
          data-testid="status-select"
        >
          {ALL_COMPLAINT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getStatusDisplayName(status)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="status-note"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
        >
          Note (optional)
        </label>
        <textarea
          id="status-note"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          rows={2}
          placeholder="Add a note about this status change..."
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm',
            'border border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F] focus:border-transparent',
            'resize-none'
          )}
          data-testid="status-note-input"
        />
      </div>
      <button
        type="submit"
        disabled={isUpdating || selectedStatus === currentStatus}
        className={clsx(
          'w-full px-4 py-2 rounded-lg text-sm font-medium',
          'bg-[#ADFF2F] text-gray-900 hover:bg-[#9AE62A]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
        data-testid="update-status-button"
      >
        {isUpdating ? 'Updating...' : 'Update Status'}
      </button>
    </form>
  );
}


/**
 * Add Note Form
 * Requirements: 3.6
 */
function AddNoteForm({
  onAddNote,
  isAdding,
}: {
  onAddNote: (content: string) => Promise<void>;
  isAdding: boolean;
}) {
  const [noteContent, setNoteContent] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (noteContent.trim()) {
        await onAddNote(noteContent.trim());
        setNoteContent('');
      }
    },
    [noteContent, onAddNote]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="add-note-form">
      <div>
        <label
          htmlFor="note-content"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
        >
          Add Resolution Note
        </label>
        <textarea
          id="note-content"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={3}
          placeholder="Enter your note..."
          className={clsx(
            'w-full px-3 py-2 rounded-lg text-sm',
            'border border-gray-300 dark:border-slate-600',
            'bg-white dark:bg-slate-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F] focus:border-transparent',
            'resize-none'
          )}
          data-testid="note-content-input"
        />
      </div>
      <button
        type="submit"
        disabled={isAdding || !noteContent.trim()}
        className={clsx(
          'w-full px-4 py-2 rounded-lg text-sm font-medium',
          'border border-gray-300 dark:border-slate-600',
          'bg-white dark:bg-slate-800',
          'text-gray-700 dark:text-slate-300',
          'hover:bg-gray-50 dark:hover:bg-slate-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
        data-testid="add-note-button"
      >
        {isAdding ? 'Adding...' : 'Add Note'}
      </button>
    </form>
  );
}

/**
 * Close button icon
 */
function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * ComplaintDetailPanel Component
 * Main slide-over panel for displaying complaint details
 */
export default function ComplaintDetailPanel({
  complaint,
  isOpen,
  onClose,
  onStatusUpdate,
  onAddNote,
  isUpdatingStatus = false,
  isAddingNote = false,
}: ComplaintDetailPanelProps) {
  if (!complaint) {
    return null;
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                  <div className="flex h-full flex-col bg-white dark:bg-slate-800 shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                            {complaint.referenceNumber}
                          </Dialog.Title>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={getStatusBadgeClasses(complaint.status)}>
                              {getStatusDisplayName(complaint.status)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {formatDateTime(complaint.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]"
                          onClick={onClose}
                          data-testid="close-panel-button"
                        >
                          <span className="sr-only">Close panel</span>
                          <CloseIcon />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6" data-testid="complaint-detail-content">
                      <CustomerInfoSection complaint={complaint} />
                      <OrderContextSection complaint={complaint} />
                      <ComplaintDetailsSection complaint={complaint} />

                      {/* Media Gallery - Requirements: 3.2 */}
                      {complaint.mediaAttachments && complaint.mediaAttachments.length > 0 && (
                        <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="media-section">
                          <SectionHeader title="Media Attachments" />
                          <MediaGallery attachments={complaint.mediaAttachments} />
                        </div>
                      )}

                      {/* AI Tags - Requirements: 3.3 */}
                      <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="ai-tags-section">
                        <SectionHeader title="AI Analysis" />
                        <AITagsDisplay
                          tags={complaint.aiTags || []}
                          primaryCategory={complaint.aiPrimaryCategory || ''}
                          requiresManualReview={complaint.requiresManualReview || false}
                        />
                      </div>

                      {/* Resolution History - Requirements: 3.4 */}
                      <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="resolution-history-section">
                        <SectionHeader title="Resolution History" />
                        <ResolutionTimeline history={complaint.resolutionHistory || []} />
                      </div>

                      {/* Status Update Form - Requirements: 3.5 */}
                      {onStatusUpdate && (
                        <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="status-update-section">
                          <StatusUpdateForm
                            currentStatus={complaint.status}
                            onStatusUpdate={onStatusUpdate}
                            isUpdating={isUpdatingStatus}
                          />
                        </div>
                      )}

                      {/* Add Note Form - Requirements: 3.6 */}
                      {onAddNote && (
                        <div className="py-4" data-testid="add-note-section">
                          <AddNoteForm onAddNote={onAddNote} isAdding={isAddingNote} />
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
