'use client';
import { useState, useEffect, useRef } from 'react';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { Document, Page } from 'react-pdf';
import AnnotationRenderer from './AnnotationRenderer';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Annotation {
  id: string;
  questionId: number;
  pageNumber: number;
  type: 'highlight' | 'comment' | 'symbol';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  symbol?: 'check' | 'edit' | 'highlight';
}

interface PdfViewerProps {
  url: string;
  pageNumber?: number;
  annotations: Annotation[];
  scale?: number; // Controlled from parent (optional)
  onScaleChange?: (newScale: number) => void; // Optional callback
}

export default function PdfViewer({
  url,
  pageNumber = 1,
  annotations = [],
  scale: controlledScale,
  onScaleChange,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Local scale if not controlled
  const [localScale, setLocalScale] = useState(1);
  const scale = controlledScale ?? localScale;

  const isZoomed = scale > 1.05;

  // Zoom limits
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3.0;
  const ZOOM_STEP = 0.2;

  // Auto-scroll to page
  useEffect(() => {
    if (!containerRef.current || !numPages) return;
    const pageEl = containerRef.current.querySelector(
      `[data-page-number="${pageNumber}"]`
    ) as HTMLElement;
    if (pageEl) {
      containerRef.current.scrollTo({
        top: pageEl.offsetTop - 100,
        behavior: 'smooth',
      });
    }
  }, [pageNumber, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Mouse Wheel Zoom (Google Maps Style)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl/Cmd + scroll
      e.preventDefault();

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      let newScale = scale + delta;

      // Clamp
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      // Zoom toward cursor
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const scrollLeftBefore = container.scrollLeft;
      const scrollTopBefore = container.scrollTop;

      // Update scale
      if (controlledScale === undefined) {
        setLocalScale(newScale);
      }
      onScaleChange?.(newScale);

      // Adjust scroll to keep cursor in same visual position
      requestAnimationFrame(() => {
        const ratioX = x / rect.width;
        const ratioY = y / rect.height;

        container.scrollLeft = scrollLeftBefore + (x - rect.width * ratioX) * (newScale / scale - 1);
        container.scrollTop = scrollTopBefore + (y - rect.height * ratioY) * (newScale / scale - 1);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, controlledScale, onScaleChange]);

  // Mouse Drag-to-Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isZoomed && e.button === 0) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX + container.scrollLeft,
        y: e.clientY + container.scrollTop,
      });
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      container.scrollLeft = dragStart.x - e.clientX;
      container.scrollTop = dragStart.y - e.clientY;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (isZoomed) container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isZoomed]);

  // Touch Pinch-to-Zoom + Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0, startY = 0;
    let initialScale = scale;
    let initialDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialScale = scale;
      } else if (e.touches.length === 1) {
        // Pan
        const touch = e.touches[0];
        startX = touch.clientX + container.scrollLeft;
        startY = touch.clientY + container.scrollTop;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const newScale = initialScale * (distance / initialDistance);
        const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        if (controlledScale === undefined) {
          setLocalScale(clampedScale);
        }
        onScaleChange?.(clampedScale);
      } else if (e.touches.length === 1 && (isZoomed || e.touches[0].clientX)) {
        const touch = e.touches[0];
        container.scrollLeft = startX - touch.clientX;
        container.scrollTop = startY - touch.clientY;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale, isZoomed, controlledScale, onScaleChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto bg-gray-100"
      style={{
        cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        scrollBehavior: 'smooth',
      }}
    >
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="flex items-center justify-center h-full text-gray-500">Loading PDF...</div>}
      >
        <div className="inline-block min-w-full text-center py-8">
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            const pageAnnotations = annotations.filter(a => a.pageNumber === pageNum);

            return (
              <div
                key={pageNum}
                data-page-number={pageNum}
                className="my-12 inline-block"
              >
                <div className="relative bg-white shadow-2xl rounded-lg overflow-visible">
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-none block"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    {pageAnnotations.map((ann) => (
                      <AnnotationRenderer key={ann.id} annotation={ann} pageScale={scale} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Document>
    </div>
  );
}