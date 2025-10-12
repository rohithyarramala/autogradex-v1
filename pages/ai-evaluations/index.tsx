// src/app/ai-evaluations/page.tsx or similar
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable'; // Adjust path as needed
import Modal from '@/components/shared/Modal'; // Adjust path as needed
import { Button } from 'react-daisyui'; // Assuming Button is imported from react-daisyui

// ----------------------------------------------------------------------
// 1. UPDATED INTERFACES (Added specific statuses for queue handling)
// ----------------------------------------------------------------------

interface Student {
  id: number;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
}

interface Evaluation {
  id: number;
  name: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  maxMarks: number;
  // Updated status values to reflect the queue process
  status: 'rubrics-not-generated' | 'rubrics-generating' | 'rubrics-failed' | 'ready-for-evaluation' | 'evaluating' | 'evaluated' | 'Not Started' | 'Evaluating' | 'Completed';
  students: Student[];
  questionPaper?: File;
  keyScript?: File;
  uploadedBy: string;
  rubricsGenerated?: boolean;
}

// Polling interval in milliseconds (e.g., 5 seconds)
const POLLING_INTERVAL = 5000; 

const AiEvaluationPage = () => {
  const { data: session } = useSession();
  const [selectedSectionId, setSelectedSectionId] = useState<string>('0');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('0');
  const [selectedClassId, setSelectedClassId] = useState<string>('0');
  const [uploadedBy, setUploadedBy] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);

  // Initial state for new evaluation
  const newEvaluationInitialState: Evaluation = {
    id: 0,
    name: '',
    classId: '0',
    sectionId: '0',
    subjectId: '0',
    maxMarks: 0,
    status: 'rubrics-not-generated', // Default status for new evaluation
    students: [],
    uploadedBy: '',
    rubricsGenerated: false,
  };


  // --- Core Data Fetching Function ---
  const fetchAllData = async () => {
    try {
      const [classesRes, sectionsRes, subjectsRes, evaluationsRes] =
        await Promise.all([
          fetch('/api/classes').then((res) => res.json()),
          fetch('/api/sections').then((res) => res.json()),
          fetch('/api/subjects').then((res) => res.json()),
          fetch('/api/ai-evaluations').then((res) => res.json()),
        ]);
      setClasses(classesRes);
      setSections(sectionsRes);
      setSubjects(subjectsRes);
      // Ensure data conforms to the Evaluation interface
      setEvaluations(evaluationsRes.map((e: any) => ({
        ...e,
        rubricsGenerated: e.rubricsGenerated ?? false,
        // Map old status to new if necessary, otherwise use API status
        status: e.status || 'Not Started', 
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  // --- Effect 1: Initial Fetch and Polling ---
  useEffect(() => {
    // 1. Run initial fetch immediately
    fetchAllData();

    // 2. Set up polling for status updates
    const intervalId = setInterval(fetchAllData, POLLING_INTERVAL);

    // 3. Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures it runs only once on mount


  // --- Effect 2: Editing State Management ---
  useEffect(() => {
    if (editingEval) {
      setSelectedClassId(editingEval.classId || '0');
      setSelectedSectionId(editingEval.sectionId || '0');
      setSelectedSubjectId(editingEval.subjectId || '0');
      setUploadedBy(editingEval.uploadedBy || '');
    } else {
      setSelectedClassId('0');
      setSelectedSectionId('0');
      setSelectedSubjectId('0');
      setUploadedBy(''); 
    }
  }, [editingEval]);


  // --- Save Handler: Optimistic/Refetched Update ---
  const handleSave = async (evalData: Evaluation) => {
    // Basic validation (same as original)
    if (
      !evalData.name || evalData.classId === '0' || evalData.sectionId === '0' ||
      evalData.subjectId === '0' || evalData.maxMarks <= 0 
    ) {
      alert('Please fill in all required fields correctly (Name, Max Marks, Class, Section, Subject).');
      return;
    }
    if (!session?.user?.id) {
      alert('User not authenticated. Please log in.');
      return;
    }

    const isNew = evalData.id === 0;
    const formData = new FormData();
    formData.append('name', evalData.name);
    formData.append('classId', evalData.classId);
    formData.append('sectionId', evalData.sectionId);
    formData.append('subjectId', evalData.subjectId);
    formData.append('maxMarks', String(evalData.maxMarks));
    formData.append('status', evalData.status);
    formData.append('uploadedBy', evalData.uploadedBy);
    if (evalData.questionPaper) formData.append('questionPaper', evalData.questionPaper);
    if (evalData.keyScript) formData.append('keyScript', evalData.keyScript);
    formData.append('createdBy', session.user.id);
    if (!isNew) formData.append('id', String(evalData.id)); // Add ID for PUT

    try {
      const url = isNew
        ? '/api/ai-evaluations'
        : `/api/ai-evaluations?id=${evalData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${method === 'PUT' ? 'update' : 'create'} evaluation`);
      }
      
      // Instead of relying on a full refetch, we trigger a dedicated update.
      // fetchAllData() will run immediately and also reset the polling timer implicitly.
      await fetchAllData();
      
      setOpenModal(false);
      setEditingEval(null);
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      alert(`Failed to save evaluation: ${error.message || 'An unknown error occurred'}`);
    }
  };


  // --- Delete Handler: Optimistic Update ---
  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this evaluation? This cannot be undone.'))
      return;
    
    // Optimistic UI Update
    const originalEvals = evaluations;
    setEvaluations((prev) => prev.filter((e) => String(e.id) !== String(id)));

    try {
      const response = await fetch(`/api/ai-evaluations?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        // Revert on error
        setEvaluations(originalEvals); 
        throw new Error('Failed to delete evaluation on the server.');
      }
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Failed to delete evaluation. Data reverted.');
    }
  };

  // --- Filtered Data (Corrected) ---
  // const filteredSections = useMemo(() => {
  //   return sections.filter((s) => s.classId === selectedClassId || selectedClassId === '0');
  // }, [selectedClassId, sections]);

  // const filteredSubjects = useMemo(() => {
  //   return subjects.filter((s) => s.classId === selectedClassId || selectedClassId === '0');
  // }, [selectedClassId, subjects]);

  const filteredSections = sections;

  const filteredSubjects = subjects;


  // --- Columns Definition (Enhanced Status Rendering) ---
  const columns: ColumnDef<Evaluation>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Evaluation Name' },
      {
        accessorKey: 'classId',
        header: 'Class',
        cell: ({ row }) =>
          classes.find((c) => c.id === row.original.classId)?.name || '-',
      },
      {
        accessorKey: 'sectionId',
        header: 'Section',
        cell: ({ row }) =>
          sections.find((s) => s.id === row.original.sectionId)?.name || '-',
      },
      {
        accessorKey: 'subjectId',
        header: 'Subject',
        cell: ({ row }) =>
          subjects.find((s) => s.id === row.original.subjectId)?.name || '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          let color = 'badge-info';
          if (status.includes('generating')) color = 'badge-warning';
          else if (status === 'evaluating' || status === 'Evaluating') color = 'badge-warning';
          else if (status === 'evaluated' || status === 'Completed') color = 'badge-success';
          else if (status.includes('failed')) color = 'badge-error';
          
          // Nicer formatting for display
          const displayStatus = status.replace(/-/g, ' '); 

          return <span className={`badge ${color} badge-outline capitalize`}>{displayStatus}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const evalRow = row.original;
          // Use rubricsGenerated status for view button
          const isViewDisabled = (evalRow.rubricsGenerated);

          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                color="primary"
                onClick={() => {
                  setEditingEval(evalRow);
                  setOpenModal(true);
                }}
                disabled={evalRow.status !== 'rubrics-not-generated'}
                title={evalRow.status !== 'rubrics-not-generated' ? 'Evaluation process started, cannot edit.' : 'Edit Evaluation'}
              >
                Edit
              </Button>
              
              <Button
                size="sm"
                color="error"
                onClick={() => handleDelete(evalRow.id)}
              >
                Delete
              </Button>
              <Button
                size="sm"
                color="secondary"
                disabled={isViewDisabled}
                title={
                  isViewDisabled
                    ? `Rubrics not ready. Status: ${evalRow.status.replace(/-/g, ' ')}`
                    : 'View Evaluation Details'
                }
                onClick={() => {
                  if (!isViewDisabled) {
                      window.location.href = `/ai-evaluations/${evalRow.id}`;
                  }
                }}
              >
                View
              </Button>
            </div>
          );
        },
      },
    ],
    [classes, sections, subjects]
  );

  return (
    <div className="p-6">
      {/* Hidden div to store session.user.id (Kept as is) */}
      <div
        style={{ display: 'none' }}
        data-user-id={session?.user?.id || 'unauthenticated'}
      >
        User ID: {session?.user?.id || 'unauthenticated'}
      </div>

      {/* Header and Add Button (UI enhanced with bolder font) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
          🤖 AI Evaluations Management
        </h1>
        <Button
          color="success"
          onClick={() => {
            setEditingEval(newEvaluationInitialState);
            setSelectedClassId('0');
            setSelectedSectionId('0');
            setSelectedSubjectId('0');
            setUploadedBy(''); 
            setOpenModal(true);
          }}
        >
          <span className="font-semibold">➕ Add New Evaluation</span>
        </Button>
      </div>

      {/* Data Table (Kept as is) */}
      <DataTable columns={columns} data={evaluations} />

      {/* Modal - UI ENHANCEMENT HERE */}
      <Modal
        open={openModal}
        close={() => {
          setOpenModal(false);
          setEditingEval(null);
        }}
      >
        <Modal.Header>
          <span className="text-xl font-bold">
            {editingEval?.id && editingEval.id !== 0
              ? 'Edit Evaluation'
              : 'Create New Evaluation'}
          </span>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1: Name and Max Marks */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Evaluation Name <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g., Mid-Term Exam"
                className="input input-bordered w-full"
                value={editingEval?.name || ''}
                onChange={(e) =>
                  setEditingEval((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Max Marks <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="number"
                placeholder="e.g., 100"
                className="input input-bordered w-full"
                value={editingEval?.maxMarks || ''}
                min="1"
                onChange={(e) =>
                  setEditingEval((prev) =>
                    prev
                      ? {
                          ...prev,
                          maxMarks: Math.max(1, Number(e.target.value)),
                        }
                      : null
                  )
                }
                required
              />
            </div>

            {/* Row 2: Class and Subject */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Class <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedClassId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val);
                  // Reset Section and Subject when Class changes
                  setSelectedSectionId('0');
                  setSelectedSubjectId('0');
                  setEditingEval((prev) =>
                    prev
                      ? {
                          ...prev,
                          classId: val,
                          sectionId: '0',
                          subjectId: '0',
                        }
                      : null
                  );
                }}
                required
              >
                <option value="0" disabled>
                  Select Class
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Subject <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedSubjectId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSubjectId(val);
                  setEditingEval((prev) =>
                    prev ? { ...prev, subjectId: val } : null
                  );
                }}
                disabled={selectedClassId === '0'}
                required
              >
                <option value="0" disabled>
                  Select Subject
                </option>
                {/* Use filteredSubjects */}
                {filteredSubjects
                    // .filter(s => s.classId === selectedClassId) // Correct filter logic
                    .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Section and Script Uploaded By */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Section <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedSectionId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSectionId(val);
                  setEditingEval((prev) =>
                    prev ? { ...prev, sectionId: val } : null
                  );
                }}
                disabled={selectedClassId === '0'}
                required
              >
                <option value="0" disabled>
                  Select Section
                </option>
                 {/* Use filteredSections */}
                {filteredSections
                    // .filter(s => s.classId === selectedClassId) // Correct filter logic
                    .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Script Uploaded By <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={uploadedBy}
                onChange={(e) => {
                  const val = e.target.value;
                  setUploadedBy(val);
                  setEditingEval((prev) =>
                    prev ? { ...prev, uploadedBy: val } : null
                  );
                }}
                required
              >
                <option value="" disabled>
                  Select Uploader
                </option>
                <option value="student">Student (via link)</option>
                <option value="teacher">Teacher (Staff)</option>
              </select>
            </div>

            {/* Files are kept in a single column for better vertical flow and space management */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Question Paper (PDF){' '}
                    <span className="text-red-500">
                      {!editingEval?.id || editingEval.id === 0
                        ? '*'
                        : '(Optional for edit)'}
                    </span>
                  </span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="file-input file-input-bordered file-input-sm w-full"
                  onChange={(e) =>
                    setEditingEval((prev) =>
                      prev
                        ? { ...prev, questionPaper: e.target.files?.[0] }
                        : null
                    )
                  }
                  // Required only for new evaluations
                  required={!editingEval?.id || editingEval.id === 0}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Key Script (PDF, Optional)
                  </span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="file-input file-input-bordered file-input-sm w-full"
                  onChange={(e) =>
                    setEditingEval((prev) =>
                      prev ? { ...prev, keyScript: e.target.files?.[0] } : null
                    )
                  }
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="ghost"
            onClick={() => {
              setOpenModal(false);
              setEditingEval(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() => editingEval && handleSave(editingEval)}
            disabled={!editingEval} // Disable save if editingEval is null
          >
            Save Evaluation
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AiEvaluationPage;