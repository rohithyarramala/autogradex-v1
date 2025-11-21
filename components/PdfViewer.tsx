'use client';
import { useState, useEffect, useRef } from 'react';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { Document, Page } from 'react-pdf';
import AnnotationRenderer from './AnnotationRenderer';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Define the data structure for a single annotation
interface Annotation {
  id: string; // Unique ID
  questionId: number; // The question this annotation belongs to
  pageNumber: number; // The PDF page number (1-indexed)
  type: 'highlight' | 'comment' | 'symbol';
  // Coordinates for placement (normalized to 0-1000 for scalability, 
  // or use PDF point/pixel values, but normalization is better for responsiveness)
  x: number; 
  y: number;
  width?: number; // For highlights
  height?: number; // For highlights
  color?: string; // For highlights/symbols
  text?: string; // For comments
  symbol?: 'check' | 'edit' | 'highlight'; // For symbols
}

interface PdfViewerProps {
  url: string;
  pageNumber?: number;
  annotations: Annotation[];
  scale?: number;
}

export default function PdfViewer({ url, pageNumber = 1, scale = 1 ,annotations}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [containerWidth, setContainerWidth] = useState<number>();

  console.log('PdfViewer: Rendering with URL', url, 'and pageNumber', pageNumber);
  console.log(url);

  useEffect(() => {
    console.log('PdfViewer: pageNumber prop changed to', pageNumber); // Debug
    setCurrentPage(Math.max(1, pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      // We only observe one element (containerRef.current)
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          // Use contentRect.width for the inner width without padding/border
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
      // Initialize width immediately
      setContainerWidth(containerRef.current.clientWidth);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

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
        {/* {Array.from({ length: numPages }, (_, index) => (
          <Page
            key={index + 1}
            pageNumber={index + 1}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-4 shadow-sm"
            // width={Math.min(800, window.innerWidth - 40)}
            width={containerWidth}
          />
        ))} */}
        {Array.from({ length: numPages }, (_, index) => {
                    const pageNum = index + 1;
                    const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNum);

                    return (
                        <div
                            key={pageNum}
                            className="relative mb-4 shadow-sm" // Add 'relative' to position annotations
                            // onClick={(e) => handlePageClick(e, pageNum)}
                        >
                            {/* The PDF Page */}
                            <Page
                                pageNumber={pageNum}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                width={containerWidth} // Keep containerWidth for initial fit
                                className="z-0" // Ensure page is in the background
                            />

                            {/* Annotation Overlay */}
                            {pageAnnotations.map((ann) => (
                                <AnnotationRenderer 
                                    key={ann.id}
                                    annotation={ann}
                                    pageScale={scale} // Pass scale for correct placement/size
                                />
                            ))}
                        </div>
                    );
                })}
      </Document>
    </div>
  );
}