'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from 'react-daisyui';
import {
  FiRefreshCw,
  FiArrowLeft,
  FiClipboard,
  FiEye,
  FiUpload,
  FiUserX,
  FiFileText,
} from 'react-icons/fi';
import { DataTable } from '@/components/DataTable';

interface Student {
  id: string;
  name: string;
  rollNo: string;
}

interface Submission {
  id: string;
  student: Student;
  status: string;
  scriptPdf?: string;
  totalMark?: number;
  feedback?: string;
}

interface Evaluation {
  id: string;
  name: string;
  subject: { name: string };
  maxMarks: number;
  uploadedBy: 'teacher' | 'student';
  status: string;
  submissions: Submission[];
}

export default function EvaluationDetailPage() {
  const router = useRouter();
  const { evaluationId } = router.query;
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // ---------------- AUTO REFRESH ----------------
  useEffect(() => {
    fetchEvaluation(true); // initial forced fetch
    const interval = setInterval(() => fetchEvaluation(false), 10000); // check every 5s
    return () => clearInterval(interval);
  }, [evaluationId]);

  const fetchEvaluation = async (force = false) => {
    if (!evaluationId) return;
    try {
      const res = await fetch(`/api/ai-evaluations/${evaluationId}`);
      const data = await res.json();

      // ✅ Only update state if first load OR status changed
      if (force || !evaluation || data.status !== evaluation.status) {
        setEvaluation(data);
      }
    } catch (err) {
      console.error('Error fetching evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAbsent = async () => {
    try {
      const res = await fetch(
        `/api/ai-evaluations/${evaluationId}/mark-all-absent`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) throw new Error('Failed to mark absent');
      fetchEvaluation();
    } catch (err) {
      console.error(err);
    }
  };

  const bulkUploadZip = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !evaluationId) return;
      const formData = new FormData();
      formData.append('zipFile', file);
      try {
        const res = await fetch(
          `/api/ai-evaluations/${evaluationId}/bulk-upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        if (!res.ok) throw new Error('Bulk upload failed');
        fetchEvaluation();
      } catch (err) {
        console.error(err);
      }
    };
    input.click();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/upload/${evaluation?.id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return 'bg-green-100 text-green-700';
      case 'uploaded':
        return 'bg-blue-100 text-blue-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const allReadyForEvaluation = evaluation?.submissions.every(
    (s) => s.status === 'uploaded' || s.status === 'absent'
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!evaluation)
    return <div className="p-8 text-center">Evaluation not found</div>;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <>
        {/* === HEADER === */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Button color="ghost" onClick={() => router.back()}>
              <FiArrowLeft className="mr-2" /> Back
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase">{evaluation.name}</h1>
          </div>
          <div className="flex gap-3">
            <Button
              color="primary"
              onClick={() =>
                router.push(`/ai-evaluations/${evaluation.id}/rubrics`)
              }
            >
              📋 Rubrics
            </Button>
            {evaluation.status === 'evaluated' && (
              <Button
                color="success"
                onClick={() => router.push(`${router.asPath}/analytics`)}
              >
                <FiFileText className="mr-2" /> Generate Report
              </Button>
            )}
          </div>
        </div>

        {/* === EVALUATION DETAILS === */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col p-3 rounded-xl bg-indigo-50">
              <div className="text-sm text-gray-500">Subject</div>
              <div className="font-semibold text-indigo-700 mt-1">
                {evaluation.subject?.name ?? '-'}
              </div>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-emerald-50">
              <div className="text-sm text-gray-500">Max Marks</div>
              <div className="font-semibold text-emerald-700 mt-1">
                {evaluation.maxMarks ?? '-'}
              </div>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-amber-50">
              <div className="text-sm text-gray-500">Uploaded By</div>
              <div className="font-semibold text-amber-700 mt-1 capitalize">
                {evaluation.uploadedBy}
              </div>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-blue-50">
              <div className="text-sm text-gray-500">Status</div>
              <div
                className={`mt-1 font-semibold inline-block px-2 py-1 rounded-md text-sm ${
                  evaluation.status === 'evaluated'
                    ? 'bg-green-100 text-green-700'
                    : evaluation.status === 'evaluating'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {evaluation.status?.replace(/-/g, ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Public Upload Link for Students */}
          {evaluation.uploadedBy === 'student' &&
            evaluation.status !== 'evaluated' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <strong>Public Upload Link:</strong>
                  <code className="bg-white border px-2 py-1 rounded">
                    {`${window.location.origin}/upload/${evaluation.id}`}
                  </code>
                </div>
                <Button
                  color="ghost"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  <FiClipboard /> {copySuccess ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            )}
        </div>

        {/* === SUBMISSIONS TABLE === */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Submissions</h2>

            {evaluation.uploadedBy === 'student' ? (
              <div className="flex gap-2">
                {evaluation.status !== 'evaluated' &&
                  evaluation.status !== 'evaluating' && (
                    <Button color="warning" onClick={markAllAbsent}>
                      <FiUserX className="mr-2" /> Mark Non-Uploads Absent
                    </Button>
                  )}
                {allReadyForEvaluation && (
                  <Button
                    color="success"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/ai-evaluations/${evaluation.id}`,
                          {
                            method: 'POST',
                          }
                        );
                        if (!res.ok)
                          throw new Error('Failed to start evaluation');
                        fetchEvaluation(); // Refresh status
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <FiFileText className="mr-2" /> Evaluate
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button color="primary" onClick={bulkUploadZip}>
                  <FiUpload className="mr-2" /> Bulk Upload ZIP
                </Button>
                {allReadyForEvaluation && (
                  <Button
                    color="success"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/ai-evaluations/${evaluation.id}`,
                          {
                            method: 'POST',
                          }
                        );
                        if (!res.ok)
                          throw new Error('Failed to start evaluation');
                        fetchEvaluation(); // Refresh status
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <FiFileText className="mr-2" /> Evaluate
                  </Button>
                )}
              </div>
            )}
          </div>
          <DataTable
            columns={[
              {
                accessorFn: (row) => row.student.rollNo,
                id: 'rollNo',
                header: 'Roll No',
              },
              {
                accessorFn: (row) => row.student.name,
                id: 'name',
                header: 'Student Name',
              },
              {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-semibold ${statusBadge(
                      row.original.status
                    )}`}
                  >
                    {row.original.status.toUpperCase()}
                  </span>
                ),
              },
              ...(evaluation.uploadedBy === 'teacher' &&
              evaluation.status !== 'evaluated' &&
              evaluation.status !== 'evaluating'
                ? [
                    {
                      id: 'teacherActions',
                      header: 'Teacher Actions',
                      cell: ({ row }) => {
                        const submission = row.original;
                        return (
                          <div className="flex gap-2">
                            {/* Show upload only if student is NOT absent */}
                            {submission.status !== 'absent' && (
                              <Button
                                size="sm"
                                color="primary"
                                onClick={async () => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.pdf'; // only PDF allowed
                                  input.onchange = async (e: any) => {
                                    const file = e.target.files[0];
                                    if (!file || !evaluation.id) return;
                                    if (file.type !== 'application/pdf') {
                                      alert('Only PDF files are allowed!');
                                      return;
                                    }
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append(
                                      'studentId',
                                      submission.student.id
                                    );
                                    try {
                                      const res = await fetch(
                                        `/api/ai-evaluations/${evaluation.id}/student/${submission.student.id}/upload`,
                                        {
                                          method: 'POST',
                                          body: formData,
                                        }
                                      );
                                      if (!res.ok)
                                        throw new Error('Upload failed');
                                      fetchEvaluation(); // refresh table
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <FiUpload /> Upload
                              </Button>
                            )}

                            {/* Mark Absent / Unmark Absent */}
                            <Button
                              size="sm"
                              color={
                                submission.status === 'absent'
                                  ? 'success'
                                  : 'warning'
                              }
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/ai-evaluations/${evaluation.id}/student/${submission.student.id}`,
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        isAbsent:
                                          submission.status !== 'absent',
                                      }),
                                    }
                                  );
                                  if (!res.ok)
                                    throw new Error(
                                      'Failed to update absent status'
                                    );
                                  fetchEvaluation();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              {submission.status === 'absent' ? (
                                <>
                                  <FiUserX /> Unmark Absent
                                </>
                              ) : (
                                <>
                                  <FiUserX /> Mark Absent
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      },
                    },
                  ]
                : []),

              {
                id: 'view',
                header: 'View',
                cell: ({ row }) => {
                  const s = row.original;
                  return s.scriptPdf ? (
                    <Button
                      size="sm"
                      color="info"
                      onClick={() => {
                        if (s.status === 'uploaded') {
                          window.open(s.scriptPdf!, '_blank');
                        } else if (
                          s.status === 'evaluating' ||
                          s.status === 'evaluated'
                        ) {
                          window.open(
                            `/ai-evaluations/${evaluation.id}/student/${s.student.id}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <FiEye /> View
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-sm">Not Uploaded</span>
                  );
                },
              },
            ]}
            data={evaluation.submissions}
          />
        </div>
      </>
    </div>
  );
}
