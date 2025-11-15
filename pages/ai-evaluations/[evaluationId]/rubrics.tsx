'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Input, Collapse, Table, Badge, Select } from 'react-daisyui';
import {
  FaArrowLeft,
  FaSave,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

interface KeyPoint {
  text: string;
}

interface RubricRow {
  question_id: string;
  question: string;
  marks: number;
  topic?: string;
  co?: string;
  po?: string;
  section?: string;
  difficulty?: string;
  blooms_level?: string;
  key_points: KeyPoint[];
}

export default function RubricPage() {
  const router = useRouter();

  const { evaluationId } = router.query;

  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const isDisabled =
    evaluationStatus === 'evaluated' || evaluationStatus === 'evaluating';

  // 🔹 Fetch Rubrics
  useEffect(() => {
    if (evaluationId) fetchRubrics();
  }, [evaluationId]);

  const fetchRubrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-evaluations/${evaluationId}`);
      if (!res.ok) throw new Error('Failed to fetch rubrics');
      const data = await res.json();


      console.log(data);

      let parsed: RubricRow[] = [];
      if (data.rubrics) {
        const raw =
          typeof data.rubrics === 'string'
            ? JSON.parse(data.rubrics)
            : data.rubrics;
        parsed = Array.isArray(raw) ? raw : raw.rubrics || [];
      }

      // Normalize key points (no marks now)
      const normalized = parsed.map((r) => ({
        ...r,
        key_points: (r.key_points || []).map((kp: any) =>
          typeof kp === 'string' ? { text: kp } : { text: kp.text ?? '' }
        ),
      }));

      setRubrics(normalized);
      setEvaluationStatus(data.status || '');
    } catch (err) {
      console.error(err);
      setError('Failed to load rubric data');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update question-level fields
  const handleChange = (
    index: number,
    key: keyof RubricRow,
    value: string | number
  ) => {
    setRubrics((prev) => {
      const updated = [...prev];
      (updated[index] as any)[key] = value;
      return updated;
    });
  };

  // 🔹 Update key point text
  const handleKeyPointChange = (
    rowIndex: number,
    kpIndex: number,
    value: string
  ) => {
    setRubrics((prev) => {
      const updated = [...prev];
      updated[rowIndex].key_points[kpIndex].text = value;
      return updated;
    });
  };

  // 🔹 Add key point
  const handleAddKeyPoint = (rowIndex: number) => {
    setRubrics((prev) => {
      const updated = [...prev];
      updated[rowIndex].key_points.push({ text: '' });
      return updated;
    });
  };

  // 🔹 Delete key point
  const handleDeleteKeyPoint = (rowIndex: number, kpIndex: number) => {
    setRubrics((prev) => {
      const updated = [...prev];
      updated[rowIndex].key_points.splice(kpIndex, 1);
      return updated;
    });
  };

  // 🔹 Save rubrics
  const handleSave = async () => {
    if (!evaluationId) return;
    try {
      setSaving(true);
      

      const res = await fetch(`/api/ai-evaluations/${evaluationId}/update-rubric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubric:rubrics }),
      });

      if (!res.ok) throw new Error('Failed to save rubrics');
      alert('Rubrics saved successfully 🎯');
    } catch (err) {
      console.error(err);
      alert('Error saving rubrics');
    } finally {
      setSaving(false);
    }
  };

  // 🔹 UI states
  if (loading)
    return <div className="flex justify-center items-center h-96">Loading...</div>;

  if (error)
    return <div className="text-red-600 font-semibold text-center mt-8">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button color="ghost" onClick={() => router.back()}>
            <FaArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Rubric Evaluation</h1>
        </div>
        <Button color="primary" onClick={handleSave} disabled={isDisabled || saving}>
          <FaSave className="mr-2" />
          {saving ? 'Saving...' : 'Save Rubrics'}
        </Button>
      </div>

      {/* Rubric Table */}
      <div className="space-y-4">
        {rubrics.map((row, index) => (
          <div key={row.question_id} className="border rounded-lg shadow-md bg-base-100">
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-base-200 transition-all"
              onClick={() => setOpenRow(openRow === index ? null : index)}
            >
              <div>
                <h2 className="font-semibold text-lg">
                  {row.question_id}. {row.question}
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge color="info">{row.topic || 'No Topic'}</Badge>
                  <Badge color="secondary">{row.section || 'No Section'}</Badge>
                  <Badge color="accent">CO: {row.co || '-'}</Badge>
                  <Badge color="primary">PO: {row.po || '-'}</Badge>
                  <Badge color="warning">{row.blooms_level || '-'}</Badge>
                  <Badge color="success">{row.difficulty || '-'}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={row.marks}
                  disabled={isDisabled}
                  onChange={(e) => handleChange(index, 'marks', Number(e.target.value))}
                  className="w-24"
                />
                {openRow === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>

            <Collapse open={openRow === index}>
              <Collapse.Content className="p-4 border-t bg-base-200 space-y-4">
                {/* Editable Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Section"
                    value={row.section || ''}
                    onChange={(e) => handleChange(index, 'section', e.target.value)}
                    disabled={isDisabled}
                  />

                  {/* CO Dropdown */}
                  <Select
                    value={row.co || ''}
                    onChange={(e) => handleChange(index, 'co', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">Select CO</option>
                    <option value="CO1">CO1</option>
                    <option value="CO2">CO2</option>
                    <option value="CO3">CO3</option>
                    <option value="CO4">CO4</option>
                    <option value="CO5">CO5</option>
                  </Select>

                  {/* PO Dropdown */}
                  <Select
                    value={row.po || ''}
                    onChange={(e) => handleChange(index, 'po', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">Select PO</option>
                    <option value="PO1">PO1</option>
                    <option value="PO2">PO2</option>
                    <option value="PO3">PO3</option>
                    <option value="PO4">PO4</option>
                    <option value="PO5">PO5</option>
                  </Select>

                  {/* Bloom’s Level */}
                  <Select
                    value={row.blooms_level || ''}
                    onChange={(e) => handleChange(index, 'blooms_level', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">Bloom’s Level</option>
                    <option value="Remember">Remember</option>
                    <option value="Understand">Understand</option>
                    <option value="Apply">Apply</option>
                    <option value="Analyze">Analyze</option>
                    <option value="Evaluate">Evaluate</option>
                    <option value="Create">Create</option>
                  </Select>

                  {/* Difficulty */}
                  <Select
                    value={row.difficulty || ''}
                    onChange={(e) => handleChange(index, 'difficulty', e.target.value)}
                    disabled={isDisabled}
                  >
                    <option value="">Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Select>
                </div>

                {/* Key Points */}
                <Table zebra>
                  <Table.Head>
                    <span>Key Point</span>
                    <span>Action</span>
                  </Table.Head>
                  <Table.Body>
                    {row.key_points.map((kp, kpIndex) => (
                      <Table.Row key={kpIndex}>
                        <span>
                          <Input
                            type="text"
                            value={kp.text}
                            disabled={isDisabled}
                            onChange={(e) =>
                              handleKeyPointChange(index, kpIndex, e.target.value)
                            }
                            className="w-full"
                          />
                        </span>
                        <span>
                          <Button
                            size="sm"
                            color="error"
                            onClick={() => handleDeleteKeyPoint(index, kpIndex)}
                            disabled={isDisabled}
                          >
                            <FaTrash />
                          </Button>
                        </span>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>

                <Button
                  size="sm"
                  color="success"
                  onClick={() => handleAddKeyPoint(index)}
                  disabled={isDisabled}
                  className="mt-2"
                >
                  <FaPlus className="mr-2" /> Add Key Point
                </Button>
              </Collapse.Content>
            </Collapse>
          </div>
        ))}
      </div>
    </div>
  );
}
