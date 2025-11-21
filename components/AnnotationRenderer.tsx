// AnnotationRenderer.tsx
import React from 'react';
import { AiOutlineHighlight, AiOutlineCheckCircle, AiOutlineEdit } from 'react-icons/ai';


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


interface AnnotationRendererProps {
  annotation: Annotation;
  pageScale: number;
}

const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({ annotation, pageScale }) => {
  // Annotation coordinates (x, y) are in pixels relative to the page's 
  // current *rendered* size. The pageScale ensures this works correctly.
  
  // You might need to adjust the coordinates based on the scale: 
  // e.g., x * pageScale, y * pageScale, but since the coordinates were captured 
  // on the rendered page, they should work directly if captured correctly.
  
  // For simplicity, we assume the captured (x,y) are relative to the scaled page.

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: annotation.x,
    top: annotation.y,
    transform: 'translate(-50%, -50%)', // Center the symbol/comment container
    pointerEvents: 'none', // Important: don't block clicks on the PDF underneath
  };

  switch (annotation.type) {
    case 'symbol':
      // Symbol annotations (e.g., Check, Edit)
      const SymbolIcon = 
        annotation.symbol === 'check' ? AiOutlineCheckCircle : 
        annotation.symbol === 'edit' ? AiOutlineEdit : AiOutlineHighlight;
      
      return (
        <div style={{ ...baseStyle, transform: 'translate(-50%, -50%)' }}>
          <SymbolIcon 
            className="text-3xl" 
            style={{ color: annotation.color || 'red' }} 
          />
        </div>
      );

    case 'comment':
      // Render a small comment marker icon and a popup on hover/click
      return (
        <div style={{ ...baseStyle, backgroundColor: 'yellow', padding: '5px', borderRadius: '4px' }}>
          {annotation.text}
        </div>
      );

    case 'highlight':
        // For highlights, use the width/height properties
        // The transform needs to be adjusted since it's a box, not a center point
        const highlightStyle: React.CSSProperties = {
            position: 'absolute',
            left: annotation.x,
            top: annotation.y,
            width: annotation.width,
            height: annotation.height,
            backgroundColor: annotation.color || 'rgba(255, 255, 0, 0.5)',
            pointerEvents: 'none', 
            // The highlight is usually drawn from the top-left corner, so no centering transform is needed
        };
        return <div style={highlightStyle} />;

    default:
      return null;
  }
};

export default AnnotationRenderer;