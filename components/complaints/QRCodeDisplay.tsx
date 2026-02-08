'use client';

/**
 * QRCodeDisplay Component
 * Displays QR codes from backend with download functionality
 * Requirements: 4.3
 */

import React, { useCallback } from 'react';
import { ArrowDownTrayIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { SupportCard } from '@/types/complaint';

export interface QRCodeDisplayProps {
  /** Single support card to display */
  supportCard?: SupportCard;
  /** Multiple support cards for bulk display */
  supportCards?: SupportCard[];
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Callback when download is clicked for single QR */
  onDownload?: (supportCard: SupportCard) => void;
  /** Callback when batch download is clicked */
  onBatchDownload?: (supportCards: SupportCard[]) => void;
}

/**
 * Format date for display
 */
function formatExpiryDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Download QR code from base64 data
 */
function downloadQRCode(supportCard: SupportCard): void {
  const link = document.createElement('a');
  link.href = supportCard.qrCodeBase64;
  link.download = `support-card-${supportCard.orderNumber || supportCard.orderId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download multiple QR codes as individual files
 */
async function downloadAllQRCodes(supportCards: SupportCard[]): Promise<void> {
  for (const card of supportCards) {
    downloadQRCode(card);
    // Small delay between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Single QR Code Card Component
 */
function QRCodeCard({ 
  supportCard, 
  onDownload 
}: { 
  supportCard: SupportCard; 
  onDownload?: (card: SupportCard) => void;
}) {
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(supportCard);
    } else {
      downloadQRCode(supportCard);
    }
  }, [supportCard, onDownload]);

  const displayId = supportCard.orderNumber || supportCard.orderId;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col items-center">
      {/* QR Code Image */}
      <div className="w-48 h-48 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
        {supportCard.qrCodeBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={supportCard.qrCodeBase64}
            alt={`QR Code for order ${displayId}`}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <QrCodeIcon className="w-24 h-24 text-gray-400 dark:text-slate-500" />
        )}
      </div>

      {/* Order Info */}
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Order: {displayId}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Expires: {formatExpiryDate(supportCard.expiresAt)}
        </p>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={!supportCard.qrCodeBase64}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        Download
      </button>
    </div>
  );
}

/**
 * Loading Skeleton for QR Code Card
 */
function QRCodeSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 flex flex-col items-center animate-pulse">
      <div className="w-48 h-48 bg-gray-200 dark:bg-slate-700 rounded-lg mb-4" />
      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-9 w-28 bg-gray-200 dark:bg-slate-700 rounded-lg" />
    </div>
  );
}

/**
 * QRCodeDisplay - Displays QR codes with download functionality
 * Uses qrCodeBase64 from backend response directly
 */
export function QRCodeDisplay({
  supportCard,
  supportCards,
  isLoading = false,
  onDownload,
  onBatchDownload,
}: QRCodeDisplayProps): JSX.Element {
  const isBulkMode = supportCards && supportCards.length > 0;
  const cards = isBulkMode ? supportCards : supportCard ? [supportCard] : [];

  const handleBatchDownload = useCallback(() => {
    if (onBatchDownload && supportCards) {
      onBatchDownload(supportCards);
    } else if (supportCards) {
      downloadAllQRCodes(supportCards);
    }
  }, [supportCards, onBatchDownload]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <QRCodeSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <QrCodeIcon className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-slate-400">
          No QR codes generated yet. Select orders and generate support cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isBulkMode && cards.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleBatchDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download All ({cards.length})
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <QRCodeCard
            key={card.orderId}
            supportCard={card}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}

export default QRCodeDisplay;
