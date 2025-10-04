'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import Modal from '@/components/shared/Modal';
import { Button } from 'react-daisyui';

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
  status: 'Not Started' | 'Evaluating' | 'Completed';
  students: Student[];
  questionPaper?: File;
  keyScript?: File;
}

const AiEvaluationPage = () => {
  const { data: session } = useSession();
  const [selectedSectionId, setSelectedSectionId] = useState<string>('0');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('0');
  const [selectedClassId, setSelectedClassId] = useState<string>('0');
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, sectionsRes, subjectsRes, evaluationsRes] = await Promise.all([
          fetch('/api/classes').then((res) => res.json()),
          fetch('/api/sections').then((res) => res.json()),
          fetch('/api/subjects').then((res) => res.json()),
          fetch('/api/ai-evaluations').then((res) => res.json()),
        ]);
        setClasses(classesRes);
        setSections(sectionsRes);
        setSubjects(subjectsRes);
        setEvaluations(evaluationsRes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (editingEval) {
      setSelectedClassId(editingEval.classId ?? '0');
      setSelectedSectionId(editingEval.sectionId ?? '0');
      setSelectedSubjectId(editingEval.subjectId ?? '0');
    } else {
      setSelectedClassId('0');
      setSelectedSectionId('0');
      setSelectedSubjectId('0');
    }
  }, [editingEval]);

  const handleSave = async (evalData: Evaluation) => {
    if (!evalData.name || evalData.classId === '0' || evalData.sectionId === '0' || evalData.subjectId === '0') {
      alert('Please fill in all required fields.');
      return;
    }
    if (!session?.user?.id) {
      alert('User not authenticated. Please log in.');
      return;
    }

    const formData = new FormData();
    formData.append('name', evalData.name);
    formData.append('classId', evalData.classId);
    formData.append('sectionId', evalData.sectionId);
    formData.append('subjectId', evalData.subjectId);
    formData.append('maxMarks', String(evalData.maxMarks));
    if (evalData.questionPaper) formData.append('questionPaper', evalData.questionPaper);
    if (evalData.keyScript) formData.append('keyScript', evalData.keyScript);
    formData.append('createdBy', session.user.id);

    try {
      const response = await fetch('/api/ai-evaluations', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save evaluation');
      }
      const evaluationsRes = await fetch('/api/ai-evaluations').then((res) => res.json());
      setEvaluations(evaluationsRes);
      setOpenModal(false);
      setEditingEval(null);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert(`Failed to save evaluation: ${error}`);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await fetch(`/api/ai-evaluations?id=${id}`, { method: 'DELETE' });
      setEvaluations((prev) => prev.filter((e) => String(e.id) !== String(id)));
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      alert('Failed to delete evaluation.');
    }
  };

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
      { accessorKey: 'status', header: 'Status' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const evalRow = row.original;
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                color="primary"
                onClick={() => {
                  console.log('Editing evaluation:', evalRow);
                  setEditingEval(evalRow);
                  setOpenModal(true);
                }}
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
                onClick={() => {
                  window.location.href = `/ai-evaluations/${evalRow.id}`;
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
      {/* Hidden div to store session.user.id */}
      <div style={{ display: 'none' }} data-user-id={session?.user?.id || 'unauthenticated'}>
        User ID: {session?.user?.id || 'unauthenticated'}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🤖 AI Evaluations</h1>
        <Button
          color="success"
          onClick={() => {
            setEditingEval({
              id: 0,
              name: '',
              classId: '0',
              sectionId: '0',
              subjectId: '0',
              maxMarks: 0,
              status: 'Not Started',
              students: [],
            });
            setSelectedClassId('0');
            setSelectedSectionId('0');
            setSelectedSubjectId('0');
            setOpenModal(true);
          }}
        >
          ➕ Add Evaluation
        </Button>
      </div>

      <DataTable columns={columns} data={evaluations} />

      {/* Modal */}
      <Modal
        open={openModal}
        close={() => {
          setOpenModal(false);
          setEditingEval(null);
        }}
      >
        <Modal.Header>
          {editingEval?.id ? 'Edit Evaluation' : 'Create Evaluation'}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingEval?.name || ''}
              onChange={(e) =>
                setEditingEval((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Max Marks</label>
            <input
              type="number"
              className="w-full border p-2 rounded mt-1"
              value={editingEval?.maxMarks || ''}
              onChange={(e) =>
                setEditingEval((prev) =>
                  prev ? { ...prev, maxMarks: Number(e.target.value) } : null
                )
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Class</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={selectedClassId}
              onChange={(e) => {
                const val = e.target.value;
                console.log('Selected classId:', val);
                setSelectedClassId(val);
                setSelectedSectionId('0');
                setSelectedSubjectId('0');
                setEditingEval((prev) =>
                  prev ? { ...prev, classId: val, sectionId: '0', subjectId: '0' } : null
                );
              }}
            >
              <option value="0">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Section</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={selectedSectionId}
              onChange={(e) => {
                const val = e.target.value;
                console.log('Selected sectionId:', val);
                setSelectedSectionId(val);
                setEditingEval((prev) =>
                  prev ? { ...prev, sectionId: val } : null
                );
              }}
            >
              <option value="0">Select Section</option>
              {sections
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Subject</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={selectedSubjectId}
              onChange={(e) => {
                const val = e.target.value;
                console.log('Selected subjectId:', val);
                setSelectedSubjectId(val);
                setEditingEval((prev) =>
                  prev ? { ...prev, subjectId: val } : null
                );
              }}
            >
              <option value="0">Select Subject</option>
              {subjects
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Question Paper</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setEditingEval((prev) =>
                  prev ? { ...prev, questionPaper: e.target.files?.[0] } : null
                )
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Key Script (Optional)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setEditingEval((prev) =>
                  prev ? { ...prev, keyScript: e.target.files?.[0] } : null
                )
              }
            />
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
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AiEvaluationPage;