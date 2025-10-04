'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import Modal from '@/components/shared/Modal';
import { Button } from 'react-daisyui';

/** =================== Types =================== */
interface Student {
  id: string;
  name: string;
}

interface EvaluationSubmission {
  id: string;
  status: 'pending' | 'uploaded' | 'absent' | 'evaluated' | 'submitted';
  totalMark?: number;
  scriptPdf?: string;
  student: Student;
}

interface Evaluation {
  id: string;
  name: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  status: string;
  questionPdf?: string;
  submissions: EvaluationSubmission[];
  class?: { name: string };
  section?: { name: string };
  subject?: { name: string };
}

/** =================== Component =================== */
const EvaluationDetailPage = () => {
  // Handler: Unmark absent
  const handleUnmarkAbsent = async (submission: EvaluationSubmission) => {
    await fetch(`/api/ai-evaluations/${evaluationId}/student/${submission.student.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAbsent: false }),
    });
    // Refresh evaluation
    fetch(`/api/ai-evaluations/${evaluationId}`)
      .then((res) => res.json())
      .then((data) => setEvaluation(data));
  };
  const router = useRouter();
  const { evaluationId } = router.query;

  /** =================== State =================== */
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  useEffect(() => {
    if (!evaluationId) return;
    fetch(`/api/ai-evaluations/${evaluationId}`)
      .then((res) => res.json())
      .then((data) => setEvaluation(data));
  }, [evaluationId]);


  /** =================== Columns =================== */
  const columns: ColumnDef<EvaluationSubmission>[] = useMemo(
    () => [
      { accessorKey: 'student.name', header: 'Student Name' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'totalMark', header: 'Score' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const submission = row.original;
          // If evaluated, only show view button
          if (submission.status === 'evaluated' || evaluation?.status === 'completed') {
            return (
              <Button size="sm" color="info" onClick={() => router.push(`/ai-evaluations/${evaluationId}/student/${submission.student.id}`)}>
                View
              </Button>
            );
          }
          // If absent, show 'Absent' and 'Unmark Absent' button if evaluation not completed/evaluated
          if (submission.status === 'absent') {
            if (evaluation?.status !== 'evaluated' && evaluation?.status !== 'completed') {
              return (
                <div className="flex gap-2 items-center">
                  <span className="text-gray-400">Absent</span>
                  <Button size="sm" color="warning" onClick={() => handleUnmarkAbsent(submission)}>
                    Unmark Absent
                  </Button>
                </div>
              );
            }
            return <span className="text-gray-400">Absent</span>;
          }
          // If submitted (initial state), show upload and mark absent buttons
          if (submission.status === 'submitted') {
            return (
              <div className="flex gap-2">
                <Button size="sm" color="primary" onClick={() => handleUpload(submission)}>
                  Upload
                </Button>
                <Button size="sm" color="warning" onClick={() => handleMarkAbsent(submission)}>
                  Mark Absent
                </Button>
              </div>
            );
          }
          // If file uploaded, show view button
          if (submission.scriptPdf) {
            return (
              <Button size="sm" color="info" onClick={() => router.push(`/ai-evaluations/${evaluationId}/student/${submission.student.id}`)}>
                View
              </Button>
            );
          }
          return null;
        },
      },
    ],
    [evaluation]
  );

  // Handler: Upload script
  const handleUpload = (submission: EvaluationSubmission) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('scriptPdf', file);
      // Send to API
      await fetch(`/api/ai-evaluations/${evaluationId}/student/${submission.student.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      // Refresh evaluation
      fetch(`/api/ai-evaluations/${evaluationId}`)
        .then((res) => res.json())
        .then((data) => setEvaluation(data));
    };
    input.click();
  };

  // Handler: Mark absent
  const handleMarkAbsent = async (submission: EvaluationSubmission) => {
    // Call API to mark student as absent
    await fetch(`/api/ai-evaluations/${evaluationId}/student/${submission.student.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAbsent: true }),
    });
    // Refresh evaluation
    fetch(`/api/ai-evaluations/${evaluationId}`)
      .then((res) => res.json())
      .then((data) => setEvaluation(data));
  };

  // Handler: Start AI Evaluation
  const handleStartAIEvaluation = async () => {
    // Call API to start background AI evaluation
    await fetch(`/api/ai-evaluations/${evaluationId}`, { method: 'POST' });
    // Refresh evaluation
    fetch(`/api/ai-evaluations/${evaluationId}`)
      .then((res) => res.json())
      .then((data) => setEvaluation(data));
  };

  /** =================== Render =================== */
  if (!evaluation) return <div>Loading...</div>;
  // Calculate percent completion
  const total = evaluation?.submissions?.length || 0;
  const uploadedOrAbsent = evaluation?.submissions?.filter((s) => s.status === 'uploaded' || s.status === 'absent').length || 0;
  const allReady = total > 0 && uploadedOrAbsent === total;
  const completed = evaluation?.submissions?.filter((s) => s.status === 'evaluated').length || 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-6">
      <div className="mb-4">
        <Button color="ghost" onClick={() => router.back()}>
          ← Go Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold mb-4">📝 {evaluation.name}</h1>
      <p className="mb-2">Class: {evaluation.class?.name} | Section: {evaluation.section?.name} | Subject: {evaluation.subject?.name}</p>
      <p className="mb-2">Status: {evaluation.status} | Completion: {percent}%</p>
      <p className="mb-6">
        Question Paper: <a href={evaluation.questionPdf} target="_blank" className="text-blue-600 underline">View PDF</a>
      </p>
      {allReady && evaluation.status === 'pending' && (
        <Button color="success" className="mb-4" onClick={handleStartAIEvaluation}>
          Start AI Evaluation
        </Button>
      )}
      <DataTable columns={columns} data={evaluation.submissions || []} />
    </div>
  );
};

export default EvaluationDetailPage;
