'use client';

/**
 * MediaGallery Component
 * Displays media attachments in a grid layout with lightbox support
 *
 * Requirements: 3.2
 * - Display images in grid layout
 * - Support video playback
 * - Implement lightbox for full-size viewing
 */

import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { MediaAttachment } from '@/types/complaint';

export interface MediaGalleryProps {
  /** List of media attachments to display */
  attachments: MediaAttachment[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Play icon for video thumbnails
 */
function PlayIcon() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Close icon for lightbox
 */
function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Navigation arrow icons
 */
function ChevronLeftIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}


/**
 * Lightbox Component
 * Full-screen media viewer with navigation
 */
function Lightbox({
  attachments,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: {
  attachments: MediaAttachment[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const currentMedia = attachments[currentIndex];
  const isVideo = currentMedia.type === 'video';

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={clsx(
          'absolute top-4 right-4 p-2 rounded-full',
          'bg-white/10 hover:bg-white/20',
          'text-white transition-colors duration-200'
        )}
        data-testid="lightbox-close-button"
      >
        <CloseIcon />
      </button>

      {/* Previous button */}
      {attachments.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className={clsx(
            'absolute left-4 p-2 rounded-full',
            'bg-white/10 hover:bg-white/20',
            'text-white transition-colors duration-200'
          )}
          data-testid="lightbox-prev-button"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {/* Media content */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
            data-testid="lightbox-video"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentMedia.url}
            alt={`Attachment ${currentIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            data-testid="lightbox-image"
          />
        )}
      </div>

      {/* Next button */}
      {attachments.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={clsx(
            'absolute right-4 p-2 rounded-full',
            'bg-white/10 hover:bg-white/20',
            'text-white transition-colors duration-200'
          )}
          data-testid="lightbox-next-button"
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* Counter */}
      {attachments.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {attachments.length}
        </div>
      )}
    </div>
  );
}


/**
 * Media Thumbnail Component
 * Displays a single media item in the grid
 */
function MediaThumbnail({
  attachment,
  index,
  onClick,
}: {
  attachment: MediaAttachment;
  index: number;
  onClick: () => void;
}) {
  const isVideo = attachment.type === 'video';

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative aspect-square rounded-lg overflow-hidden',
        'bg-gray-100 dark:bg-slate-700',
        'hover:ring-2 hover:ring-[#ADFF2F] hover:ring-offset-2',
        'dark:hover:ring-offset-slate-800',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]'
      )}
      data-testid={`media-thumbnail-${index}`}
    >
      {isVideo ? (
        <>
          {/* Video thumbnail - use first frame or placeholder */}
          <video
            src={attachment.url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <PlayIcon />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={`Attachment ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* File info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-xs">
        {formatFileSize(attachment.size)}
      </div>
    </button>
  );
}

/**
 * MediaGallery - Displays media attachments in a grid with lightbox
 *
 * Requirements:
 * - 3.2: Display media attachments in a gallery format supporting images and videos
 */
export function MediaGallery({ attachments, className }: MediaGalleryProps): JSX.Element {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goToPrevious = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null;
      return current === 0 ? attachments.length - 1 : current - 1;
    });
  }, [attachments.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null;
      return current === attachments.length - 1 ? 0 : current + 1;
    });
  }, [attachments.length]);

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        No media attachments
      </p>
    );
  }

  return (
    <>
      <div
        className={clsx(
          'grid gap-2',
          attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
          className
        )}
        data-testid="media-gallery"
      >
        {attachments.map((attachment, index) => (
          <MediaThumbnail
            key={`${attachment.url}-${index}`}
            attachment={attachment}
            index={index}
            onClick={() => openLightbox(index)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          attachments={attachments}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </>
  );
}

export default MediaGallery;
