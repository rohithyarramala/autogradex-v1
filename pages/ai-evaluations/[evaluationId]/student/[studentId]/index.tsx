'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button, Badge, Card, Progress, Tooltip } from 'react-daisyui';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  AiOutlineQuestionCircle,
  AiOutlineFileText,
  AiOutlineCheckCircle,
  AiOutlineSolution,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
  AiOutlineHighlight,
  AiOutlineEdit,
  AiOutlineSave,
  AiOutlineInfoCircle,
  AiOutlineBarChart,
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
} from 'react-icons/ai'; // Added more icons
import { FaGraduationCap } from 'react-icons/fa'; // For evaluation panel
import { TbPointFilled } from 'react-icons/tb'; // For marking points

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
});

interface MarkingPoint {
  point: string;
  mark: number;
  status: boolean;
  extracted_text?: string; // Add extracted text snippet
  ai_comment?: string; // Add AI comment for this point
}

interface AiDataItem {
  image_index: number;
  section: string;
  question_id: string;
  question: string;
  marks: number;
  marks_awarded: number;
  feedback: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  blooms_level: string;
  topic: string;
  co: string;
  po: string;
  pso: string;
  ai_confidence: number;
  teacher_intervention_required: boolean;
  marking_scheme: MarkingPoint[];
}

interface SubmissionData {
  aiResult?: {
    totalMarkAwarded: number;
    totalMarks: number;
    ai_data: AiDataItem[];
  } | null;
  scriptPdf?: string;
  evaluation?: {
    questionPdf?: string;
    keyPaperPdf?: string;
  };
}

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

// Custom hook for toast notifications
const useToast = () => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | ''>('');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToastMessage(message);
      setToastType(type);
      setTimeout(() => {
        setToastMessage('');
        setToastType('');
      }, 3000);
    },
    []
  );

  const Toast = () =>
    toastMessage ? (
      <div className={`toast toast-end animate-fade-in-up`}>
        <div
          className={`alert ${toastType === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}
        >
          <div>
            <span>{toastMessage}</span>
          </div>
        </div>
      </div>
    ) : null;

  return { showToast, Toast };
};

const StudentEvaluationPage = () => {
  const [currentTab, setCurrentTab] = useState<
    'question' | 'model' | 'student'
  >('student'); // 'ai' tab moved to sidebar/report view
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [paperUrl, setPaperUrl] = useState('');
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [activeFeedbackSuggestion, setActiveFeedbackSuggestion] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analyticsSidebarOpen, setAnalyticsSidebarOpen] = useState(false);
  const { showToast, Toast } = useToast();

  const router = useRouter();
  const { evaluationId, studentId } = router.query;

  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // ----------------------------------------------------
// 1. Save Annotation Method
// ----------------------------------------------------
const saveAnnotation = useCallback((newAnnotation: Omit<Annotation, 'id'>) => {
    // Generate a unique ID (e.g., using a library like uuid or a simple timestamp + random number)
    const newId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const annotationWithId: Annotation = { ...newAnnotation, id: newId };

    setAnnotations((prev) => [...prev, annotationWithId]);
    console.log('Saved annotation:', annotationWithId);
    // useToast({ message: `Annotation saved for Q${newAnnotation.questionId}.` });
    // In a real app, you would also trigger an API call here to persist the data.

}, [showToast]);

// ----------------------------------------------------
// 2. Filter Annotations for the Current View
// ----------------------------------------------------
// Filter annotations to only show those relevant to the currently selected question
const relevantAnnotations = useMemo(() => {
    if (!submission) return [];
    
    // Logic: Only show annotations for the current question in the 'student' view
    if (currentTab === 'student') {
        return annotations.filter(ann => ann.questionId === currentQuestion);
    }
    // You might show all annotations in a 'review' mode, but based on your tabs, 
    // we assume annotations are question-specific in the 'student' view.
    return []; // Don't show annotations on 'question' or 'model' tabs
}, [annotations, currentQuestion, currentTab, submission]); 

// ----------------------------------------------------
// 3. Annotation Tools Handlers
// ----------------------------------------------------
const handleAnnotationToolClick = (type: 'highlight' | 'comment' | 'symbol', symbol?: string) => {
    // This function will set a mode, waiting for the user to click on the PDF.
    console.log(`Annotation mode set to: ${type}`);
    // You'd need a state like [annotationMode, setAnnotationMode] to track this.
    // For simplicity, let's assume clicking a tool enables it until the next click.
    // e.g., setAnnotationMode({ type, symbol });
};

  // Modern Color Palette
  const colors = {
    background: '#f8fafc', // light gray-blue
    primaryButton: '#00B050', // AutoGradeX Green
    accentButton: '#FF3366', // AutoGradeX Pink
    typography: '#1E293B', // dark navy for text
    cardBackground: '#ffffff',
    borderColor: '#e2e8f0',
    successConfidence: '#00B050',
    warningConfidence: '#F7B731', // A warm yellow for 70-90%
    dangerConfidence: '#FF3366', // AutoGradeX Pink for <70%
    neutralText: '#64748b', // Slate gray for secondary text
  };

  const pdfUrls = {
    question: submission?.evaluation?.questionPdf || '',
    model: submission?.evaluation?.keyPaperPdf || '',
    student: submission?.scriptPdf || '',
  };

  useEffect(() => {
    if (!evaluationId || !studentId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/ai-evaluations/${evaluationId}/student/${studentId}`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: SubmissionData = await res.json();
        setSubmission(data);
        // Pre-fill initial paperUrl for 'student' tab
        setPaperUrl(data.scriptPdf || '');
      } catch (error) {
        console.error('Error fetching submission:', error);
      }
    };

    fetchData();
  }, [evaluationId, studentId]);

  useEffect(() => {
    if (!submission?.aiResult?.ai_data) {
      setCurrentQuestion(1);
      setPaperUrl(pdfUrls[currentTab] || '');
      return;
    }

    const totalQuestions = submission.aiResult.ai_data.length;
    const questionIndex = Math.max(
      1,
      Math.min(currentQuestion, totalQuestions)
    );
    setCurrentQuestion(questionIndex);
    setPaperUrl(pdfUrls[currentTab] || ''); // Ensure paperUrl updates with tab change
  }, [submission, currentTab, pdfUrls]);

  const totalQuestions = submission?.aiResult?.ai_data?.length || 0;
  const currentQuestionData =
    submission?.aiResult?.ai_data?.[currentQuestion - 1];

  const aggregatedData = useMemo(() => {
    if (!submission?.aiResult?.ai_data) return null;

    const coMap: {
      [key: string]: { total: number; awarded: number; count: number };
    } = {};
    const poMap: {
      [key: string]: { total: number; awarded: number; count: number };
    } = {};
    const psoMap: {
      [key: string]: { total: number; awarded: number; count: number };
    } = {};
    let teacherOverrideCount = 0;
    let aiAccuracySum = 0;
    let aiCount = 0;

    submission.aiResult.ai_data.forEach((item) => {
      // Assuming a simple heuristic for teacher override: if marks_awarded is different from AI's initial proposal
      // In a real system, you'd likely have a specific flag for this.
      // For now, let's assume if any marking point is changed, it's an override.
      if (item.teacher_intervention_required) {
        // Using the provided flag
        teacherOverrideCount++;
      }

      if (item.ai_confidence !== undefined) {
        aiAccuracySum += item.ai_confidence;
        aiCount++;
      }

      if (item.co) {
        if (!coMap[item.co])
          coMap[item.co] = { total: 0, awarded: 0, count: 0 };
        coMap[item.co].total += item.marks;
        coMap[item.co].awarded += item.marks_awarded;
        coMap[item.co].count += 1;
      }
      if (item.po) {
        if (!poMap[item.po])
          poMap[item.po] = { total: 0, awarded: 0, count: 0 };
        poMap[item.po].total += item.marks;
        poMap[item.po].awarded += item.marks_awarded;
        poMap[item.po].count += 1;
      }
      if (item.pso) {
        if (!psoMap[item.pso])
          psoMap[item.pso] = { total: 0, awarded: 0, count: 0 };
        psoMap[item.pso].total += item.marks;
        psoMap[item.pso].awarded += item.marks_awarded;
        psoMap[item.pso].count += 1;
      }
    });

    const aiAccuracy = aiCount > 0 ? (aiAccuracySum / aiCount).toFixed(2) : 0;
    const evaluationTimeSaved = totalQuestions * 2; // Arbitrary: 2 mins per question saved

    return {
      co: coMap,
      po: poMap,
      pso: psoMap,
      teacherOverrideCount,
      aiAccuracy,
      evaluationTimeSaved,
    };
  }, [submission, totalQuestions]);

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(event.target.value));
  };

  const handleQuestionChange = (newQuestionNumber: number) => {
    if (
      !submission?.aiResult?.ai_data ||
      newQuestionNumber < 1 ||
      newQuestionNumber > totalQuestions
    )
      return;
    setCurrentQuestion(newQuestionNumber);
  };

  const handleMarkingPointChange = (pointIndex: number, newStatus: boolean) => {
    if (!submission?.aiResult?.ai_data) return;

    setSubmission((prev) => {
      if (!prev?.aiResult?.ai_data) return prev;

      const newAiData = [...prev.aiResult.ai_data];
      const questionIndex = currentQuestion - 1;
      const newMarkingScheme = [...newAiData[questionIndex].marking_scheme];

      newMarkingScheme[pointIndex].status = newStatus;

      let newMarksAwarded = 0;
      newMarkingScheme.forEach((point) => {
        if (point.status) newMarksAwarded += point.mark;
      });

      newAiData[questionIndex] = {
        ...newAiData[questionIndex],
        marking_scheme: newMarkingScheme,
        marks_awarded: newMarksAwarded,
        // Mark for teacher intervention if status of any point is changed from AI's initial status
        teacher_intervention_required: true,
      };

      const newTotalMarkAwarded = newAiData.reduce(
        (total, question) => total + question.marks_awarded,
        0
      );

      return {
        ...prev,
        aiResult: {
          ...prev.aiResult,
          ai_data: newAiData,
          totalMarkAwarded: newTotalMarkAwarded,
        },
      };
    });
  };

  const handleFeedbackChange = (newFeedback: string) => {
    if (!submission?.aiResult?.ai_data) return;

    setSubmission((prev) => {
      if (!prev?.aiResult?.ai_data) return prev;
      const newAiData = [...prev.aiResult.ai_data];
      const questionIndex = currentQuestion - 1;
      newAiData[questionIndex] = {
        ...newAiData[questionIndex],
        feedback: newFeedback,
      };
      return { ...prev, aiResult: { ...prev.aiResult, ai_data: newAiData } };
    });
  };

  const handleUseAiSuggestion = (suggestion: string) => {
    if (currentQuestionData) {
      handleFeedbackChange(suggestion);
      setActiveFeedbackSuggestion(null); // Clear active suggestion after use
    }
  };

  const handleSaveChanges = async () => {
    if (!submission) return;
    try {
      const res = await fetch(
        `/api/ai-evaluations/${evaluationId}/student/${studentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiResult: submission.aiResult,
            totalMarkAwarded: submission?.aiResult?.totalMarkAwarded,
            totalMarks: submission?.aiResult?.totalMarks,
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to save changes');
      showToast('Changes saved successfully!', 'success');
      console.log('Changes saved:', submission);
    } catch (error) {
      console.error('Error saving changes:', error);
      showToast('Failed to save changes!', 'error');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handleQuestionChange(currentQuestion - 1);
      } else if (event.key === 'ArrowRight') {
        handleQuestionChange(currentQuestion + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestion, totalQuestions]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return colors.successConfidence;
    if (confidence >= 70) return colors.warningConfidence;
    return colors.dangerConfidence;
  };

  // Sample AI feedback suggestion (can be replaced by actual AI call)
  const aiSuggestedFeedback = currentQuestionData?.feedback
    ? `AI Suggestion: The student provided a good answer but missed a minor detail about ${currentQuestionData.topic}. Partial credit recommended.`
    : `AI Suggestion: The student's answer correctly identifies key aspects. Full credit awarded.`;

  const getContent = useMemo(() => {
    const imageIndex =
      currentTab === 'student' && currentQuestionData
        ? currentQuestionData.image_index
        : 1;

    // Show AI Evaluation Report if sidebar is closed and analyticsSidebarOpen is true
    if (analyticsSidebarOpen && !sidebarOpen) {
      if (!submission?.aiResult?.ai_data) {
        return (
          <div className="p-8 text-center text-xl text-gray-600 animate-fade-in">
            <Badge color="warning" size="lg" className="mb-4">
              AI Evaluation Not Done
            </Badge>
            <p>Please wait for AI to evaluate or contact admin.</p>
          </div>
        );
      }

      return (
        <div className="p-6 overflow-auto h-full bg-white rounded-lg shadow-md animate-fade-in">
          <h2
            className="text-3xl font-extrabold mb-6 text-center"
            style={{ color: colors.typography }}
          >
            Comprehensive AI Evaluation Report
          </h2>
          <p
            className="text-lg text-center mb-8"
            style={{ color: colors.neutralText }}
          >
            Detailed insights into student performance across all questions.
          </p>

          {submission.aiResult.ai_data.map((item, idx) => (
            <Card
              key={idx}
              className="mb-6 shadow-xl border border-gray-100 animate-slide-in-bottom"
            >
              <Card.Body>
                <div className="flex items-center justify-between mb-3">
                  <Card.Title
                    className="text-2xl font-bold"
                    style={{ color: colors.typography }}
                  >
                    Question {idx + 1}: {item.question_id}
                  </Card.Title>
                  <Badge
                    size="lg"
                    style={{
                      backgroundColor: getConfidenceColor(item.ai_confidence),
                      color: 'white',
                    }}
                  >
                    AI Confidence: {item.ai_confidence}%
                  </Badge>
                </div>
                <p
                  className="text-lg mb-2"
                  style={{ color: colors.neutralText }}
                >
                  {item.question}
                </p>
                <div className="grid grid-cols-2 gap-2 text-md mb-4">
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      Marks Awarded:
                    </span>{' '}
                    {item.marks_awarded}/{item.marks}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      Difficulty:
                    </span>{' '}
                    {item.difficulty}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      Blooms Level:
                    </span>{' '}
                    {item.blooms_level}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      Topic:
                    </span>{' '}
                    {item.topic}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      CO:
                    </span>{' '}
                    {item.co}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      PO:
                    </span>{' '}
                    {item.po}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      PSO:
                    </span>{' '}
                    {item.pso}
                  </p>
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: colors.typography }}
                    >
                      Teacher Intervention:
                    </span>{' '}
                    {item.teacher_intervention_required ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="mt-4">
                  <h4
                    className="font-bold text-xl mb-2"
                    style={{ color: colors.typography }}
                  >
                    Feedback:
                  </h4>
                  <p
                    className="text-md leading-relaxed"
                    style={{ color: colors.neutralText }}
                  >
                    {item.feedback}
                  </p>
                </div>

                <div className="mt-4">
                  <h4
                    className="font-bold text-xl mb-2"
                    style={{ color: colors.typography }}
                  >
                    Marking Scheme:
                  </h4>
                  <ul className="list-none space-y-2">
                    {item.marking_scheme.map((mp, mpi) => (
                      <li
                        key={mpi}
                        className="flex items-start text-md"
                        style={{ color: colors.neutralText }}
                      >
                        <TbPointFilled
                          className="mt-1 mr-2"
                          style={{
                            color: mp.status
                              ? colors.successConfidence
                              : colors.dangerConfidence,
                          }}
                        />
                        <span>
                          {mp.point} - {mp.mark} mark{mp.mark > 1 ? 's' : ''} -{' '}
                          <span
                            className={`font-semibold ${mp.status ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {mp.status ? 'Awarded' : 'Not Awarded'}
                          </span>
                          {mp.extracted_text && (
                            <Tooltip message="Student's extracted answer snippet">
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                "{mp.extracted_text}"
                              </span>
                            </Tooltip>
                          )}
                          {mp.ai_comment && (
                            <Tooltip message="AI's comment on this point">
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs">
                                "{mp.ai_comment}"
                              </span>
                            </Tooltip>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card.Body>
            </Card>
          ))}
          <Card className="shadow-xl border border-gray-100 mt-8 animate-slide-in-bottom">
            <Card.Body>
              <Card.Title
                className="text-2xl font-bold mb-4"
                style={{ color: colors.typography }}
              >
                Overall Performance Summary
              </Card.Title>
              <p className="text-lg mb-4" style={{ color: colors.neutralText }}>
                Total Marks:{' '}
                <span className="font-semibold">
                  {submission?.aiResult?.totalMarkAwarded || 0}
                </span>{' '}
                /{' '}
                <span className="font-semibold">
                  {submission?.aiResult?.totalMarks || 0}
                </span>{' '}
                (
                {submission?.aiResult?.totalMarks
                  ? (
                      (submission?.aiResult?.totalMarkAwarded /
                        submission?.aiResult?.totalMarks) *
                      100
                    ).toFixed(2)
                  : 0}
                %)
              </p>
              <Progress
                className="progress-success w-full"
                value={submission?.aiResult?.totalMarkAwarded}
                max={submission?.aiResult?.totalMarks}
                style={{ '--p': colors.primaryButton } as React.CSSProperties}
              />

              <h4
                className="font-bold text-xl mt-6 mb-3"
                style={{ color: colors.typography }}
              >
                CO Attainment
              </h4>
              <div className="space-y-3">
                {Object.entries(aggregatedData?.co || {}).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p
                        className="text-md mb-1"
                        style={{ color: colors.neutralText }}
                      >
                        <span className="font-semibold">{key}:</span>{' '}
                        {value.awarded}/{value.total} ({value.count} questions)
                      </p>
                      <Progress
                        className="progress-info w-full"
                        value={value.awarded}
                        max={value.total}
                        style={
                          { '--p': colors.accentButton } as React.CSSProperties
                        }
                      />
                    </div>
                  )
                )}
              </div>

              <h4
                className="font-bold text-xl mt-6 mb-3"
                style={{ color: colors.typography }}
              >
                PO Attainment
              </h4>
              <div className="space-y-3">
                {Object.entries(aggregatedData?.po || {}).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p
                        className="text-md mb-1"
                        style={{ color: colors.neutralText }}
                      >
                        <span className="font-semibold">{key}:</span>{' '}
                        {value.awarded}/{value.total} ({value.count} questions)
                      </p>
                      <Progress
                        className="progress-warning w-full"
                        value={value.awarded}
                        max={value.total}
                        style={{ '--p': '#F7B731' } as React.CSSProperties}
                      />
                    </div>
                  )
                )}
              </div>

              <h4
                className="font-bold text-xl mt-6 mb-3"
                style={{ color: colors.typography }}
              >
                PSO Attainment
              </h4>
              <div className="space-y-3">
                {Object.entries(aggregatedData?.pso || {}).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p
                        className="text-md mb-1"
                        style={{ color: colors.neutralText }}
                      >
                        <span className="font-semibold">{key}:</span>{' '}
                        {value.awarded}/{value.total} ({value.count} questions)
                      </p>
                      <Progress
                        className="progress-error w-full"
                        value={value.awarded}
                        max={value.total}
                        style={
                          {
                            '--p': colors.dangerConfidence,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative overflow-hidden bg-white rounded-lg shadow-md border border-gray-200">
        {!paperUrl ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="ml-2">Loading PDF...</p>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center p-4 transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            <PdfViewer
              key={`pdf-${paperUrl}-${imageIndex}`}
              url={paperUrl}
              pageNumber={imageIndex}
              scale={1} // Pass 1 here as zoom is handled by parent container
              annotations={relevantAnnotations}
            />
            {/* Annotation tools could be overlaid here */}
           <div className="absolute top-4 right-4 flex space-x-2">
              <Button size="sm" onClick={() => handleAnnotationToolClick('highlight')} /* ... */><AiOutlineHighlight className="text-xl" /></Button>
              <Button size="sm" onClick={() => handleAnnotationToolClick('symbol', 'check')} /* ... */><AiOutlineCheckCircle className="text-xl text-green-500" /></Button>
              <Button size="sm" onClick={() => handleAnnotationToolClick('comment')} /* ... */><AiOutlineEdit className="text-xl" /></Button>
            </div>
          </div>
        )}
      </div>
    );
  }, [
    currentTab,
    currentQuestionData,
    paperUrl,
    zoomLevel,
    submission,
    aggregatedData,
    analyticsSidebarOpen,
    sidebarOpen,
    colors.typography,
    colors.neutralText,
    colors.primaryButton,
    colors.accentButton,
    colors.dangerConfidence,
    colors.successConfidence,
  ]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <Toast />
      {/* Header Bar */}
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <FaGraduationCap
            className="text-3xl"
            style={{ color: colors.primaryButton }}
          />
          <h1
            className="text-2xl font-bold"
            style={{ color: colors.typography }}
          >
            AutoGradeX AI Evaluation Panel
          </h1>
          <Badge
            color="success"
            className="font-semibold text-sm py-2 px-3"
            style={{ backgroundColor: colors.primaryButton, color: 'white' }}
          >
            AI Evaluation – Completed
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className="text-md font-medium"
            style={{ color: colors.typography }}
          >
            Question {currentQuestion}/{totalQuestions}
          </span>
          <Progress
            className="progress w-40"
            value={currentQuestion}
            max={totalQuestions}
            style={{ '--p': colors.primaryButton } as React.CSSProperties}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
       <aside
  className={`bg-white shadow-lg p-4 flex flex-col transition-all duration-300 ease-in-out z-20 ${
    sidebarOpen ? 'w-64' : 'w-20'
  } lg:relative absolute left-0 top-0 h-full`}
  style={{ borderColor: colors.borderColor }}
>
  {/* Toggle button */}
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
    style={{ color: colors.typography }}
  >
    {sidebarOpen ? (
      <AiOutlineMenuFold size={20} />
    ) : (
      <AiOutlineMenuUnfold size={20} />
    )}
  </button>

  <nav className="mt-12 flex-1 flex flex-col space-y-2">
    {[
      { id: 'student', label: 'Student Answer', icon: AiOutlineFileText },
      { id: 'question', label: 'Question Paper', icon: AiOutlineQuestionCircle },
      { id: 'model', label: 'Model Answer', icon: AiOutlineSolution },
    ].map((item) => {
      const isActive = currentTab === item.id;
      return (
        <Button
          key={item.id}
          color={isActive ? 'primary' : 'ghost'}
          onClick={() => {
            setCurrentTab(item.id as typeof currentTab);
            setPaperUrl(pdfUrls[item.id as keyof typeof pdfUrls] || '');
            setAnalyticsSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-center ${
            sidebarOpen ? 'justify-start px-3' : 'justify-center'
          } py-3 transition-all duration-200 ${isActive ? 'font-semibold' : ''}`}
          style={{
            backgroundColor: isActive ? colors.primaryButton : 'transparent',
            color: isActive ? 'white' : colors.typography,
          }}
        >
          <item.icon size={20} />
          {sidebarOpen && <span className="ml-3 flex-1">{item.label}</span>}
        </Button>
      );
    })}

    {/* Analytics Button */}
    <Button
      color={analyticsSidebarOpen ? 'primary' : 'ghost'}
      onClick={() => {
        setAnalyticsSidebarOpen(!analyticsSidebarOpen);
        if (sidebarOpen) setSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-center ${
        sidebarOpen ? 'justify-start px-3' : 'justify-center'
      } py-3 transition-all duration-200 ${
        analyticsSidebarOpen ? 'font-semibold' : ''
      }`}
      style={{
        backgroundColor: analyticsSidebarOpen ? colors.accentButton : 'transparent',
        color: analyticsSidebarOpen ? 'white' : colors.typography,
      }}
    >
      <AiOutlineBarChart size={20} />
      {sidebarOpen && <span className="ml-3 flex-1">AI Report & Analytics</span>}
    </Button>
  </nav>
</aside>


        {/* Main Panel */}
        <main
          className={`flex-1 p-6 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-0' : 'ml-0'}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left side: Student Answer Image Card */}
            <Card
              className="lg:col-span-2 shadow-xl rounded-lg overflow-hidden flex flex-col"
              style={{
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor,
              }}
            >
              <Card.Body className="p-0 flex flex-col flex-1">
                <div
                  className="flex items-center justify-between p-4 border-b"
                  style={{ borderColor: colors.borderColor }}
                >
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: colors.typography }}
                  >
                    {analyticsSidebarOpen
                      ? 'AI Evaluation Report'
                      : currentTab === 'student'
                        ? 'Student Answer Sheet'
                        : currentTab === 'question'
                          ? 'Question Paper'
                          : 'Model Answer'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={zoomLevel}
                      onChange={handleZoomChange}
                      className="range range-xs w-24"
                      style={
                        {
                          '--range-shdw': colors.primaryButton,
                        } as React.CSSProperties
                      }
                    />
                    <Button
                      size="sm"
                      className="btn-ghost"
                      onClick={() =>
                        setZoomLevel((prev) => Math.min(prev + 0.1, 2.0))
                      }
                      style={{ color: colors.typography }}
                    >
                      <AiOutlineZoomIn size={20} />
                    </Button>
                    <Button
                      size="sm"
                      className="btn-ghost"
                      onClick={() =>
                        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))
                      }
                      style={{ color: colors.typography }}
                    >
                      <AiOutlineZoomOut size={20} />
                    </Button>
                  </div>
                </div>
                <div
                  className="flex-1 relative overflow-auto"
                  style={{ backgroundColor: colors.background }}
                >
                  {getContent}
                </div>
              </Card.Body>
            </Card>

            {/* Right side: Question Details & Evaluation Card */}
            {!analyticsSidebarOpen && (
              <Card
                className="shadow-xl rounded-lg overflow-hidden flex flex-col animate-fade-in"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor,
                }}
              >
                <Card.Body className="p-6 flex flex-col flex-1">
                  <h3
                    className="font-bold text-2xl mb-4 text-center"
                    style={{ color: colors.typography }}
                  >
                    AI Evaluation & Teacher Override
                  </h3>
                  {!submission?.aiResult?.ai_data || !currentQuestionData ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-center text-lg text-red-500 font-medium">
                        AI Evaluation Not Done or Data Missing.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2">
                      {/* AI Confidence Visualization */}
                      <div className="text-center">
                        <div
                          className="radial-progress text-white font-bold text-lg mx-auto"
                          style={
                            {
                              '--value': currentQuestionData.ai_confidence,
                              '--size': '5rem',
                              '--thickness': '8px',
                              backgroundColor: getConfidenceColor(
                                currentQuestionData.ai_confidence
                              ),
                              color: 'white',
                            } as React.CSSProperties
                          }
                          role="progressbar"
                        >
                          {currentQuestionData.ai_confidence}%
                        </div>
                        <p
                          className="text-sm mt-2"
                          style={{ color: colors.neutralText }}
                        >
                          AI Confidence
                        </p>
                      </div>

                      {/* Question Details */}
                      <div
                        className="space-y-2 border-b pb-4"
                        style={{ borderColor: colors.borderColor }}
                      >
                        <h4
                          className="font-semibold text-lg"
                          style={{ color: colors.typography }}
                        >
                          Question Details
                        </h4>
                        <p>
                          <span
                            className="font-medium"
                            style={{ color: colors.neutralText }}
                          >
                            ID:
                          </span>{' '}
                          {currentQuestionData?.question_id}
                        </p>
                        <p>
                          <span
                            className="font-medium"
                            style={{ color: colors.neutralText }}
                          >
                            Description:
                          </span>{' '}
                          {currentQuestionData?.question}
                        </p>
                        <p
                          className="text-xl font-bold"
                          style={{ color: colors.primaryButton }}
                        >
                          Marks: {currentQuestionData?.marks_awarded || 0}/
                          {currentQuestionData?.marks || 0}
                        </p>
                        {currentQuestionData?.teacher_intervention_required && (
                          <Badge color="warning" className="text-xs">
                            Teacher Intervention Applied
                          </Badge>
                        )}
                      </div>

                      {/* Marking Scheme Interaction */}
                      <div>
                        <h4
                          className="font-semibold text-lg mb-3"
                          style={{ color: colors.typography }}
                        >
                          Marking Scheme
                        </h4>
                        <div className="space-y-3">
                          {currentQuestionData?.marking_scheme?.map(
                            (item, index) => (
                              <Card
                                key={index}
                                className="shadow-sm rounded-md border border-gray-100 p-3"
                              >
                                <label className="flex items-center cursor-pointer justify-between">
                                  <div className="flex-1">
                                    <p
                                      className="font-medium text-sm"
                                      style={{ color: colors.typography }}
                                    >
                                      {item.point} ({item.mark} mark
                                      {item.mark > 1 ? 's' : ''})
                                    </p>
                                    {item.extracted_text && (
                                      <p className="text-xs mt-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
                                        Student's Answer: "{item.extracted_text}
                                        "
                                      </p>
                                    )}
                                    {item.ai_comment && (
                                      <p className="text-xs mt-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded-md">
                                        AI Comment: "{item.ai_comment}"
                                      </p>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="toggle toggle-success toggle-sm"
                                    checked={item.status}
                                    onChange={(e) =>
                                      handleMarkingPointChange(
                                        index,
                                        e.target.checked
                                      )
                                    }
                                  />
                                </label>
                              </Card>
                            )
                          )}
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div>
                        <h4
                          className="font-semibold text-lg mb-3"
                          style={{ color: colors.typography }}
                        >
                          Teacher Feedback
                        </h4>
                        <textarea
                          className="textarea textarea-bordered w-full"
                          rows={4}
                          placeholder="Provide feedback..."
                          value={currentQuestionData?.feedback || ''}
                          onChange={(e) => handleFeedbackChange(e.target.value)}
                          style={{
                            borderColor: colors.borderColor,
                            color: colors.typography,
                          }}
                        />
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="btn-outline btn-ghost text-xs"
                            onClick={() =>
                              setActiveFeedbackSuggestion(aiSuggestedFeedback)
                            }
                            style={{ color: colors.neutralText }}
                          >
                            <AiOutlineInfoCircle /> AI Suggestion
                          </Button>
                          {activeFeedbackSuggestion && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-sm">
                              <p className="mb-2">{activeFeedbackSuggestion}</p>
                              <Button
                                size="sm"
                                className="btn-success btn-xs"
                                onClick={() =>
                                  handleUseAiSuggestion(
                                    activeFeedbackSuggestion.replace(
                                      'AI Suggestion: ',
                                      ''
                                    )
                                  )
                                }
                                style={{
                                  backgroundColor: colors.primaryButton,
                                  color: 'white',
                                }}
                              >
                                Use This
                              </Button>
                              <Button
                                size="sm"
                                className="btn-ghost btn-xs ml-2"
                                onClick={() =>
                                  setActiveFeedbackSuggestion(null)
                                }
                                style={{ color: colors.neutralText }}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Analytics Summary Sidebar (Collapsible) */}
            {analyticsSidebarOpen && (
              <Card
                className="shadow-xl rounded-lg overflow-hidden flex flex-col animate-fade-in"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor,
                }}
              >
                <Card.Body className="p-6 flex flex-col flex-1">
                  <h3
                    className="font-bold text-2xl mb-4 text-center"
                    style={{ color: colors.typography }}
                  >
                    Performance Overview
                  </h3>
                  <div
                    className="space-y-4 text-md"
                    style={{ color: colors.neutralText }}
                  >
                    <p className="flex justify-between items-center">
                      <span className="font-medium">
                        Total Questions Evaluated:
                      </span>{' '}
                      <Badge className="text-sm py-1 px-2">
                        {totalQuestions}
                      </Badge>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-medium">AI Accuracy Avg.:</span>{' '}
                      <Badge
                        className="text-sm py-1 px-2"
                        style={{
                          backgroundColor: getConfidenceColor(
                            Number(aggregatedData?.aiAccuracy || 0)
                          ),
                          color: 'white',
                        }}
                      >
                        {aggregatedData?.aiAccuracy || 0}%
                      </Badge>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-medium">Teacher Overrides:</span>{' '}
                      <Badge className="badge-warning text-sm py-1 px-2">
                        {aggregatedData?.teacherOverrideCount || 0}
                      </Badge>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="font-medium">Est. Time Saved:</span>{' '}
                      <Badge className="badge-info text-sm py-1 px-2">
                        {aggregatedData?.evaluationTimeSaved || 0} mins
                      </Badge>
                    </p>
                  </div>

                  <div className="mt-8">
                    <h4
                      className="font-bold text-xl mb-3"
                      style={{ color: colors.typography }}
                    >
                      Overall Progress
                    </h4>
                    <Progress
                      className="progress progress-success w-full"
                      value={submission?.aiResult?.totalMarkAwarded}
                      max={submission?.aiResult?.totalMarks}
                      style={
                        { '--p': colors.primaryButton } as React.CSSProperties
                      }
                    />
                    <p
                      className="text-center text-lg font-bold mt-2"
                      style={{ color: colors.typography }}
                    >
                      {submission?.aiResult?.totalMarkAwarded || 0} /{' '}
                      {submission?.aiResult?.totalMarks || 0} Marks
                    </p>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Footer - Fixed Navigation */}
      <footer
        className="bg-white shadow-lg py-4 px-6 flex items-center justify-between sticky bottom-0 z-10"
        style={{ borderColor: colors.borderColor }}
      >

        <div className="flex space-x-4 items-center ">
          {totalQuestions > 0 && (
            <>
              {/* Previous */}
              <Button
                size="sm"
                onClick={() => handleQuestionChange(currentQuestion - 1)}
                disabled={
                  currentQuestion === 1 || !submission?.aiResult?.ai_data
                }
              >
                Prev
              </Button>

              {/* Dynamic question numbers */}
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const qNum = idx + 1;
                const showDot =
                  qNum === 1 ||
                  qNum === totalQuestions ||
                  (qNum >= currentQuestion - 2 && qNum <= currentQuestion + 2);

                if (!showDot) {
                  // Insert ellipsis before next shown number
                  const prevNum = idx === 0 ? 0 : idx;
                  if (
                    prevNum === currentQuestion - 3 ||
                    prevNum === currentQuestion + 2
                  ) {
                    return <span key={qNum}>...</span>;
                  }
                  return null;
                }

                const qData = submission?.aiResult?.ai_data?.[idx];
                let dotColor = 'bg-gray-300';
                if (qData) {
                  if (qData.teacher_intervention_required)
                    dotColor = 'bg-red-500';
                  else if (qData.ai_confidence >= 90) dotColor = 'bg-green-500';
                  else if (qData.ai_confidence >= 70)
                    dotColor = 'bg-yellow-500';
                  else dotColor = 'bg-orange-500';
                }

                return (
                  <Button
                    key={qNum}
                    size="sm"
                    shape="circle"
                    className={`${qNum === currentQuestion ? 'ring-2 ring-offset-2' : ''} ${dotColor}`}
                    onClick={() => handleQuestionChange(qNum)}
                  >
                    {qNum}
                  </Button>
                );
              })}

              {/* Next */}
              <Button
                size="sm"
                onClick={() => handleQuestionChange(currentQuestion + 1)}
                disabled={
                  currentQuestion === totalQuestions ||
                  !submission?.aiResult?.ai_data
                }
              >
                Next
              </Button>
            </>
          )}
        </div>

        <Button
          className="btn-primary"
          onClick={handleSaveChanges}
          disabled={!submission?.aiResult?.ai_data}
          style={{ backgroundColor: colors.primaryButton, color: 'white' }}
        >
          <AiOutlineSave className="mr-2" /> Save Changes
        </Button>
      </footer>
    </div>
  );
};

export default StudentEvaluationPage;
