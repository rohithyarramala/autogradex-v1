'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Table, Select } from 'react-daisyui';
import { FaArrowLeft, FaSave, FaPlus, FaTimes } from 'react-icons/fa';

interface RubricRow {
  co: string;
  po: string;
  marks: number;
  section: string;
  question: string;
  difficulty: string;
  key_points: string[];
  question_id: string;
  blooms_level: string;
}

const difficultyOptions = ['Easy', 'Medium', 'Hard'];
const bloomsLevelOptions = ['L1', 'L2', 'L3', 'L4', 'L5'];

const RubricRowComponent: React.FC<{
  rubric: RubricRow;
  index: number;
  isDisabled: boolean;
  onChange: (index: number, key: keyof RubricRow, value: any) => void;
  onDelete: (index: number) => void;
}> = ({ rubric, index, isDisabled, onChange, onDelete }) => (
  <tr className="hover:bg-gray-50">
    <td className="p-2">
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        value={rubric.question_id}
        onChange={(e) => onChange(index, 'question_id', e.target.value)}
        disabled={isDisabled}
        placeholder="Q.1 a"
      />
    </td>
    <td className="p-2">
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        value={rubric.question}
        onChange={(e) => onChange(index, 'question', e.target.value)}
        disabled={isDisabled}
        placeholder="Enter question"
      />
    </td>
    <td className="p-2">
      <input
        type="number"
        className="input input-bordered w-20 text-sm"
        value={rubric.marks}
        onChange={(e) => onChange(index, 'marks', parseInt(e.target.value) || 0)}
        disabled={isDisabled}
        placeholder="0"
        min="0"
      />
    </td>
    <td className="p-2">
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        value={rubric.section}
        onChange={(e) => onChange(index, 'section', e.target.value)}
        disabled={isDisabled}
        placeholder="UNIT-1"
      />
    </td>
    <td className="p-2">
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        value={rubric.co}
        onChange={(e) => onChange(index, 'co', e.target.value)}
        disabled={isDisabled}
        placeholder="CO1"
      />
    </td>
    <td className="p-2">
      <input
        type="text"
        className="input input-bordered w-full text-sm"
        value={rubric.po}
        onChange={(e) => onChange(index, 'po', e.target.value)}
        disabled={isDisabled}
        placeholder="1.3.1"
      />
    </td>
    <td className="p-2">
      <Select
        className="w-full text-sm"
        value={rubric.difficulty}
        onChange={(e) => onChange(index, 'difficulty', e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Select Difficulty</option>
        {difficultyOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    </td>
    <td className="p-2">
      <textarea
        className="textarea textarea-bordered w-full text-sm"
        value={rubric.key_points.join('\n')}
        onChange={(e) => onChange(index, 'key_points', e.target.value)}
        disabled={isDisabled}
        placeholder="Enter key points, one per line"
        rows={3}
      />
    </td>
    <td className="p-2">
      <Select
        className="w-full text-sm"
        value={rubric.blooms_level}
        onChange={(e) => onChange(index, 'blooms_level', e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Select Blooms Level</option>
        {bloomsLevelOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    </td>
    {!isDisabled && (
      <td className="p-2">
        <Button
          size="sm"
          color="error"
          onClick={() => onDelete(index)}
          className="flex items-center gap-1"
        >
          <FaTimes />
        </Button>
      </td>
    )}
  </tr>
);

export default function RubricPage() {
  const router = useRouter();
  const { evaluationId } = router.query;
  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRubrics();
  }, [evaluationId]);

  const fetchRubrics = async () => {
    if (!evaluationId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ai-evaluations/${evaluationId}`);
      if (!res.ok) throw new Error('Failed to fetch rubrics');
      const data = await res.json();

      let parsedRubrics: RubricRow[] = [];
      if (data.rubrics) {
        const raw = typeof data.rubrics === 'string' ? JSON.parse(data.rubrics) : data.rubrics;
        parsedRubrics = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.rubrics)
          ? raw.rubrics
          : [];
      }

      setRubrics(parsedRubrics);
      setEvaluationStatus(data.status);
    } catch (err) {
      console.error('Failed to load rubrics', err);
      setError('Failed to load rubrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, key: keyof RubricRow, value: any) => {
    setRubrics((prev) =>
      prev.map((rubric, i) =>
        i === index
          ? {
              ...rubric,
              [key]: key === 'key_points' ? value.split('\n') : value,
            }
          : rubric
      )
    );
  };

  const handleAddRow = () => {
    setRubrics([
      ...rubrics,
      {
        co: '',
        po: '',
        marks: 0,
        section: '',
        question: '',
        difficulty: '',
        key_points: [],
        question_id: '',
        blooms_level: '',
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setRubrics(rubrics.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setError(null);
      const res = await fetch(
        `/api/ai-evaluations/${evaluationId}/update-rubric`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rubric: { rubrics } }),
        }
      );
      if (!res.ok) throw new Error('Failed to save rubric');
      router.push(`/ai-evaluations/${evaluationId}`);
    } catch (err) {
      console.error(err);
      setError('Error saving rubric. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  const isDisabled = evaluationStatus === 'evaluated' || evaluationStatus === 'evaluating';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button
          color="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <FaArrowLeft /> Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase text-center">
          Rubric Editor
        </h1>
        <Button
          color="success"
          disabled={isDisabled}
          onClick={handleSave}
          className="flex items-center gap-2"
        >
          <FaSave /> Save
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow border">
        <Table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs sm:text-sm uppercase">
              <th className="p-2">Question ID</th>
              <th className="p-2">Question</th>
              <th className="p-2">Marks</th>
              <th className="p-2">Section</th>
              <th className="p-2">CO</th>
              <th className="p-2">PO</th>
              <th className="p-2">Difficulty</th>
              <th className="p-2">Key Points</th>
              <th className="p-2">Blooms Level</th>
              {!isDisabled && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rubrics.length > 0 ? (
              rubrics.map((rubric, i) => (
                <RubricRowComponent
                  key={i}
                  rubric={rubric}
                  index={i}
                  isDisabled={isDisabled}
                  onChange={handleChange}
                  onDelete={handleDeleteRow}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={isDisabled ? 9 : 10}
                  className="text-center text-gray-400 py-6"
                >
                  No rubric data available
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {!isDisabled && (
        <Button
          color="primary"
          onClick={handleAddRow}
          className="flex items-center gap-2"
        >
          <FaPlus /> Add Criterion
        </Button>
      )}
    </div>
  );
}