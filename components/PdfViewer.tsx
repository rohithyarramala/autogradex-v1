'use client';
import { useState, useEffect, useRef } from 'react';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { Document, Page } from 'react-pdf';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  url: string;
  pageNumber?: number;
  scale?: number;
}

export default function PdfViewer({ url, pageNumber = 1, scale = 1 }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('PdfViewer: Rendering with URL', url, 'and pageNumber', pageNumber);
  console.log(url);

  useEffect(() => {
    console.log('PdfViewer: pageNumber prop changed to', pageNumber); // Debug
    setCurrentPage(Math.max(1, pageNumber));
  }, [pageNumber]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PdfViewer: Document loaded with', numPages, 'pages'); // Debug
    setNumPages(numPages);
    setCurrentPage((prev) => Math.min(Math.max(pageNumber, 1), numPages));
  };

  // Scroll to the specified page with retries and delay
  useEffect(() => {
    if (containerRef.current && numPages > 0) {
      const maxRetries = 10;
      let retryCount = 0;

      const scrollToPage = () => {
        const pageElement = containerRef.current?.querySelector(
          `[data-page-number="${currentPage}"]`
        ) as HTMLElement;
        if (pageElement) {
          console.log('PdfViewer: Scrolling to page', currentPage); // Debug
          console.log('PdfViewer: Page element found at offsetTop', pageElement.offsetTop); // Debug
          // Use setTimeout to ensure scroll happens after render
          setTimeout(() => {
            containerRef.current?.scrollTo({
              top: pageElement.offsetTop,
              behavior: 'smooth',
            });
            console.log('PdfViewer: Scroll executed, container scrollTop:', containerRef.current?.scrollTop); // Debug
          }, 100);
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current); // Clear any pending retries
          }
        } else if (retryCount < maxRetries) {
          console.warn(
            'PdfViewer: Page element not found for page',
            currentPage,
            'retrying',
            retryCount + 1,
            'of',
            maxRetries
          ); // Debug
          retryCount++;
          scrollTimeoutRef.current = setTimeout(scrollToPage, 300); // Retry after 300ms
        } else {
          console.error(
            'PdfViewer: Failed to find page element for page',
            currentPage,
            'after',
            maxRetries,
            'retries. Ensure the PDF has at least',
            currentPage,
            'pages.'
          ); // Debug
        }
      };

      scrollToPage();

      // Cleanup on unmount
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [currentPage, numPages]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto"
      style={{ position: 'relative', scrollBehavior: 'smooth' }}
    >
      <Document
        file={url}
        key={url} // Force re-render on URL change
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('PDF load error:', error)}
        error={<div className="text-red-500 text-center p-4">Failed to load PDF file.</div>}
        loading={<div className="text-gray-500 text-center p-4">Loading PDF...</div>}
      >
        {Array.from({ length: numPages }, (_, index) => (
          <Page
            key={index + 1}
            pageNumber={index + 1}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-4 shadow-sm"
            width={Math.min(800, window.innerWidth - 40)}
          />
        ))}
      </Document>
    </div>
  );
}