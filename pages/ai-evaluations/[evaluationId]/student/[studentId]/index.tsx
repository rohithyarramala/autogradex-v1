'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button, Badge, Card, Progress } from 'react-daisyui';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
});

interface MarkingPoint {
  point: string;
  mark: number;
  status: boolean;
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
  } | null; // Adjusted to match backend structure
  scriptPdf?: string;
  evaluation?: {
    questionPdf?: string;
    keyPaperPdf?: string;
  };
}

// const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4002'; // Frontend env variable

const StudentEvaluationPage = () => {
  const [currentTab, setCurrentTab] = useState<
    'question' | 'model' | 'student' | 'ai'
  >('student');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [paperUrl, setPaperUrl] = useState('');
  const [submission, setSubmission] = useState<SubmissionData | null>(null);

  const router = useRouter();
  const { evaluationId, studentId } = router.query;

  const pdfUrls = {
    question: submission?.evaluation?.questionPdf || '',
    model: submission?.evaluation?.keyPaperPdf || '',
    student: submission?.scriptPdf || '',
    ai: '',
  };
  // console.log(pdfUrls);
  // Fetch submission data
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
      } catch (error) {
        console.error('Error fetching submission:', error);
      }
    };

    fetchData();
  }, [evaluationId, studentId]);

  // Update current question and paper URL
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
    setPaperUrl(pdfUrls[currentTab] || '');
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

    submission.aiResult.ai_data.forEach((item) => {
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

    return { co: coMap, po: poMap, pso: psoMap };
  }, [submission]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

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

      // Create a deep copy of ai_data to avoid mutating state directly
      const newAiData = [...prev.aiResult.ai_data];
      const questionIndex = currentQuestion - 1;
      const newMarkingScheme = [...newAiData[questionIndex].marking_scheme];

      // Update the status of the marking point
      newMarkingScheme[pointIndex].status = newStatus;

      // Calculate new marks awarded for the current question
      let newMarksAwarded = 0;
      newMarkingScheme.forEach((point) => {
        if (point.status) newMarksAwarded += point.mark;
      });

      // Update the current question's data
      newAiData[questionIndex] = {
        ...newAiData[questionIndex],
        marking_scheme: newMarkingScheme,
        marks_awarded: newMarksAwarded,
      };

      // Recalculate totalMarkAwarded for the entire submission
      const newTotalMarkAwarded = newAiData.reduce(
        (total, question) => total + question.marks_awarded,
        0
      );

      return {
        ...prev,
        aiResult: {
          ...prev.aiResult,
          ai_data: newAiData,
          totalMarkAwarded: newTotalMarkAwarded, // Ensure this is updated
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
      console.log('Changes saved:', submission);
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
  };

  useEffect(() => {
    console.log('Current Tab:', currentTab, 'Paper URL:', paperUrl);
    // console.log('Image Index:', imageIndex);
  }, [currentTab, paperUrl]);

  const getContent = useMemo(() => {
    
    if (currentTab === 'ai') {
      if (!submission?.aiResult?.ai_data) {
        return (
          <div className="p-4 text-[var(--primary-text-color)]">
            <Badge color="warning" size="lg" className="mb-2">
              AI Evaluation Not Done
            </Badge>
            <p>Please wait for AI to evaluate or contact admin.</p>
          </div>
        );
      }

      return (
        <div className="p-4 overflow-auto h-full">
          <h2 className="text-xl font-bold mb-4 text-[var(--primary-text-color)]">
            AI Evaluation Report
          </h2>
          {submission.aiResult.ai_data.map((item, idx) => (
            <Card key={idx} className="mb-4 shadow-xl">
              <Card.Body>
                <Card.Title>
                  Question {idx + 1}: {item.question_id}
                </Card.Title>
                <p>{item.question}</p>
                <p>
                  Marks Awarded: {item.marks_awarded}/{item.marks}
                </p>
                <p>Feedback: {item.feedback}</p>
                <p>Difficulty: {item.difficulty}</p>
                <p>Blooms Level: {item.blooms_level}</p>
                <p>Topic: {item.topic}</p>
                <p>CO: {item.co}</p>
                <p>PO: {item.po}</p>
                <p>PSO: {item.pso}</p>
                <p>AI Confidence: {item.ai_confidence}%</p>
                <p>
                  Teacher Intervention:{' '}
                  {item.teacher_intervention_required ? 'Yes' : 'No'}
                </p>
                <h4 className="font-semibold mt-2">Marking Scheme:</h4>
                <ul className="list-disc pl-5">
                  {item.marking_scheme.map((mp, mpi) => (
                    <li key={mpi}>
                      {mp.point} - {mp.mark} mark{mp.mark > 1 ? 's' : ''} -{' '}
                      {mp.status ? 'Awarded' : 'Not Awarded'}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          ))}
          <Card className="shadow-xl">
            <Card.Body>
              <Card.Title>Overall Stats</Card.Title>
              <p>
                Total Marks: {submission?.aiResult?.totalMarkAwarded}/
                {submission?.aiResult?.totalMarks} (
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
                className="progress-primary"
                value={submission?.aiResult?.totalMarkAwarded}
                max={submission?.aiResult?.totalMarks}
              />
              <h4 className="font-semibold mt-4">CO Stats</h4>
              {Object.entries(aggregatedData?.co || {}).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p>
                    {key}: {value.awarded}/{value.total} ({value.count}{' '}
                    questions)
                  </p>
                  <Progress
                    className="progress-primary"
                    value={value.awarded}
                    max={value.total}
                  />
                </div>
              ))}
              <h4 className="font-semibold mt-4">PO Stats</h4>
              {Object.entries(aggregatedData?.po || {}).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p>
                    {key}: {value.awarded}/{value.total} ({value.count}{' '}
                    questions)
                  </p>
                  <Progress
                    className="progress-primary"
                    value={value.awarded}
                    max={value.total}
                  />
                </div>
              ))}
              <h4 className="font-semibold mt-4">PSO Stats</h4>
              {Object.entries(aggregatedData?.pso || {}).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p>
                    {key}: {value.awarded}/{value.total} ({value.count}{' '}
                    questions)
                  </p>
                  <Progress
                    className="progress-primary"
                    value={value.awarded}
                    max={value.total}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
      );
    }

    const imageIndex =
      currentTab === 'student' && currentQuestionData
        ? currentQuestionData.image_index
        : 1;

    return (
      <div className="w-full h-full relative overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {true ? (
            <PdfViewer
              key={`pdf-${paperUrl}-${imageIndex}`}
              url={paperUrl}
              pageNumber={imageIndex}
              scale={1}
            />
          ) : (
            <p className="text-[var(--primary-text-color)]">
              No PDF available for {currentTab} view
            </p>
          )}
        </div>
      </div>
    );
  }, [
    currentTab,
    currentQuestionData,
    paperUrl,
    zoomLevel,
    submission,
    aggregatedData,
  ]);
  const handleFinalize = async () => {
    if (!submission || !evaluationId || !studentId) return;
    try {
      const res = await fetch(
        `/api/ai-evaluations/${evaluationId}/student/${studentId}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error('Failed to finalize');
      alert('Evaluation finalized!');
      // Optionally, update local state to reflect finalized status
    } catch (error) {
      console.error('Error finalizing:', error);
      alert('Failed to finalize');
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-lg flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--primary-text-color)]">
            Student Evaluation
          </h1>
          {submission?.aiResult?.ai_data ? (
            <Badge color="success">AI Evaluated</Badge>
          ) : (
            <Badge color="warning">AI Evaluation Pending</Badge>
          )}
        </div>

        <Button
          color="success"
          size="sm"
          style={{
            backgroundColor: 'var(--alert-color-success)',
            color: 'var(--primary-foreground-color)',
          }}
          onClick={handleSaveChanges}
        >
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['question', 'model', 'student', 'ai'].map((tab) => (
          <Button
            key={tab}
            color={currentTab === tab ? 'primary' : 'ghost'}
            onClick={() => setCurrentTab(tab as typeof currentTab)}
            size="sm"
            style={{
              backgroundColor:
                currentTab === tab ? 'var(--primary-color-500)' : 'transparent',
              color:
                currentTab === tab
                  ? 'var(--primary-foreground-color)'
                  : 'var(--primary-text-color)',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
            {tab === 'question'
              ? 'Paper'
              : tab === 'model'
                ? 'Answer'
                : tab === 'student'
                  ? 'Answer'
                  : 'Report'}
          </Button>
        ))}
      </div>

      {/* Main Content and Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* PDF Viewer for Larger Devices */}
        <div className="hidden lg:block flex-1 px-4">
          <div className="flex justify-end mb-2 space-x-2">
            <Button
              size="sm"
              style={{
                backgroundColor: 'var(--primary-color-500)',
                color: 'var(--primary-foreground-color)',
              }}
              onClick={handleZoomIn}
            >
              Zoom In
            </Button>
            <Button
              size="sm"
              style={{
                backgroundColor: 'var(--primary-color-500)',
                color: 'var(--primary-foreground-color)',
              }}
              onClick={handleZoomOut}
            >
              Zoom Out
            </Button>
          </div>
          <div
            className="border p-2 bg-gray-100 rounded-md shadow-inner h-full overflow-hidden"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {getContent}
          </div>
        </div>

        {/* Sidebar - Question Navigation, Marks, Feedback */}
        <div
          className="w-full lg:w-80 lg:border-l"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <Button
              size="sm"
              style={{
                backgroundColor: 'var(--primary-color-500)',
                color: 'var(--primary-foreground-color)',
              }}
              disabled={currentQuestion === 1 || !submission?.aiResult?.ai_data}
              onClick={() => handleQuestionChange(currentQuestion - 1)}
            >
              Prev
            </Button>
            <span className="text-[var(--primary-text-color)]">
              Question {currentQuestion} / {totalQuestions}
            </span>
            <Button
              size="sm"
              style={{
                backgroundColor: 'var(--primary-color-500)',
                color: 'var(--primary-foreground-color)',
              }}
              disabled={
                currentQuestion === totalQuestions ||
                !submission?.aiResult?.ai_data
              }
              onClick={() => handleQuestionChange(currentQuestion + 1)}
            >
              Next
            </Button>
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-md shadow-sm">
            <h3 className="font-bold text-lg mb-2 text-[var(--primary-text-color)]">
              Question Details
            </h3>
            {!submission?.aiResult?.ai_data || !currentQuestionData ? (
              <p className="text-center text-warning">AI Evaluation Not Done</p>
            ) : (
              <div className="space-y-1">
                {[
                  {
                    label: 'Question ID',
                    value: currentQuestionData?.question_id,
                  },
                  { label: 'Question', value: currentQuestionData?.question },
                  { label: 'Marks', value: currentQuestionData?.marks || 0 },
                  {
                    label: 'Marks Awarded',
                    value: currentQuestionData?.marks_awarded || 0,
                  },
                  {
                    label: 'AI Confidence',
                    value: currentQuestionData?.ai_confidence
                      ? `${currentQuestionData.ai_confidence}%`
                      : '0%',
                  },
                  {
                    label: 'Teacher Intervention',
                    value: currentQuestionData?.teacher_intervention_required
                      ? 'Yes'
                      : 'No',
                  },
                ].map(({ label, value }) => (
                  <p key={label} className="text-sm flex justify-between">
                    <span className="font-semibold">{label}:</span>{' '}
                    <span>{value || '-'}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--primary-text-color)]">
              Marking Scheme
            </h3>
            {!submission?.aiResult?.ai_data || !currentQuestionData ? (
              <p className="text-sm text-[var(--primary-text-color)]">
                No marking scheme available.
              </p>
            ) : (
              <div className="flex flex-col">
                {currentQuestionData?.marking_scheme?.map((item, index) => (
                  <label key={index} className="text-sm mb-1 flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 checkbox checkbox-primary"
                      checked={item.status}
                      onChange={(e) =>
                        handleMarkingPointChange(index, e.target.checked)
                      }
                    />
                    <span className="text-[var(--primary-text-color)]">
                      {item.point} ({item.mark} mark{item.mark > 1 ? 's' : ''})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--primary-text-color)]">
              Feedback
            </h3>
            {!submission?.aiResult?.ai_data || !currentQuestionData ? (
              <p className="text-sm text-[var(--primary-text-color)]">
                No feedback available.
              </p>
            ) : (
              <textarea
                className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color-500)]"
                style={{ borderColor: 'var(--border-color)' }}
                rows={4}
                value={currentQuestionData?.feedback || 'Provide feedback...'}
                onChange={(e) => handleFeedbackChange(e.target.value)}
              />
            )}
          </div>

          <Button
            color="primary"
            className="w-full mb-4"
            style={{
              backgroundColor: 'var(--primary-color-500)',
              color: 'var(--primary-foreground-color)',
            }}
            onClick={handleSaveChanges}
            disabled={!submission?.aiResult?.ai_data}
          >
            Save Changes
          </Button>

          <div className="mb-4">
            <span className="font-bold text-[var(--primary-text-color)]">
              Total Marks: {submission?.aiResult?.totalMarkAwarded || 0}/
              {submission?.aiResult?.totalMarks || 0} (
              {submission?.aiResult?.totalMarks
                ? (
                    (submission?.aiResult?.totalMarkAwarded /
                      submission?.aiResult?.totalMarks) *
                    100
                  ).toFixed(2)
                : 0}
              %)
            </span>
          </div>

          {/* PDF Viewer for Mobile */}
          <div className="lg:hidden border p-4 bg-gray-100 rounded-md shadow-inner max-h-[50vh] overflow-auto">
            <div className="flex justify-end mb-2 space-x-2">
              <Button
                size="sm"
                style={{
                  backgroundColor: 'var(--primary-color-500)',
                  color: 'var(--primary-foreground-color)',
                }}
                onClick={handleZoomIn}
              >
                Zoom In
              </Button>
              <Button
                size="sm"
                style={{
                  backgroundColor: 'var(--primary-color-500)',
                  color: 'var(--primary-foreground-color)',
                }}
                onClick={handleZoomOut}
              >
                Zoom Out
              </Button>
            </div>
            {getContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEvaluationPage;
