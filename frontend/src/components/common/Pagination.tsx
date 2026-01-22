import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
}) => {
  // Generate page numbers to display
  const generatePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (showFirstLast && currentPage > siblingCount + 1) {
      pages.push(1);
    }

    if (shouldShowLeftEllipsis) {
      pages.push('ellipsis');
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    if (shouldShowRightEllipsis) {
      pages.push('ellipsis');
    }

    if (showFirstLast && currentPage < totalPages - siblingCount) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pages = generatePages();

  const buttonBaseStyles =
    'flex items-center justify-center h-10 min-w-[40px] px-3 rounded-lg text-sm font-medium transition-colors';

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          buttonBaseStyles,
          'text-secondary-600 hover:bg-secondary-100',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center h-10 w-10 text-secondary-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                buttonBaseStyles,
                isActive
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          buttonBaseStyles,
          'text-secondary-600 hover:bg-secondary-100',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;
