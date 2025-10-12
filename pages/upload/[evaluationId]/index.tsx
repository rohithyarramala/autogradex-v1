'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Button, Input } from 'react-daisyui';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Home,
} from 'lucide-react';

interface Evaluation {
  id: string;
  name: string;
  status: string;
  uploadedBy: string;
  subject?: { name: string };
}

const UploadPage = () => {
  const router = useRouter();
  const { evaluationId } = router.query;

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollNo, setRollNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** =================== Fetch Evaluation =================== */
  useEffect(() => {
    if (!evaluationId) return;
    const fetchEval = async () => {
      try {
        const res = await fetch(`/api/ai-evaluations/student/${evaluationId}`);
        const data = await res.json();
        if (res.ok) setEvaluation(data.evaluation);
        else throw new Error(data.message || 'Failed to load evaluation');
      } catch (err) {
        setError('Error fetching evaluation. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchEval();
  }, [evaluationId]);

  /** =================== Upload Handler =================== */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !rollNo.trim()) {
      setError('Please enter roll number and select a PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('rollNo', rollNo);
    formData.append('scriptPdf', file);

    try {
      setError(null);
      const res = await fetch(`/api/ai-evaluations/student/${evaluationId}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Upload failed');
      }

      setUploaded(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    }
  };

  console.log(evaluation);
  /** =================== UI States =================== */
  if (!evaluationId)
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
        <AlertCircle className="text-red-500 w-8 h-8" />
        <p>No evaluation found.</p>
      </div>
    );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
        <p>Loading evaluation details...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 flex flex-col items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>{error}</p>
      </div>
    );

  if (!evaluation)
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
        <AlertCircle className="text-gray-400 w-8 h-8" />
        <p>Evaluation not found.</p>
      </div>
    );

  if (evaluation.uploadedBy !== 'student')
    return (
      <div className="p-8 text-center text-red-600 flex flex-col items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>This evaluation is not for student uploads.</p>
      </div>
    );

  if (evaluation.status !== 'upload-pending' && evaluation.status !== 'rubrics-generating')
    return (
      <div className="p-8 text-center text-yellow-600 flex flex-col items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>This evaluation is not open for uploads.</p>
      </div>
    );

  /** =================== Render Upload UI =================== */
  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-gray-800">
            Upload Evaluation Script
          </h1>
        </div>

        <p className="text-gray-500 mb-8">
          <span className="font-medium text-gray-700">{evaluation.name}</span>{' '}
          &nbsp;—&nbsp;
          {evaluation.subject?.name ?? 'No Subject'}
        </p>

        {uploaded ? (
          <div className="p-6 bg-green-50 rounded-xl text-center border border-green-200 animate-fadeIn">
            <CheckCircle className="text-green-600 w-10 h-10 mx-auto mb-3" />
            <p className="text-green-700 font-semibold text-lg">
              Successfully Uploaded!
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Your answer sheet has been submitted for evaluation.
            </p>
            <Button
              color="success"
              className="mt-5 gap-2"
              onClick={() => router.push('/')}
            >
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleUpload}
            className="space-y-6 animate-fadeInSlow"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <Input
                type="text"
                className="w-full"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Enter your roll number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PDF
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}

            <Button
              color="primary"
              className="w-full gap-2"
              type="submit"
              disabled={loading}
            >
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

UploadPage.publicPage = true; // ✅ Public route marker
export default UploadPage;
