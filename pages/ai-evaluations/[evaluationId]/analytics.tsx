'use client';

import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Button, Tooltip } from 'react-daisyui';
import { FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend
);

export default function EvaluationDashboard() {
  const router = useRouter();
  const { evaluationId } = router.query;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!evaluationId) return;
    fetch(`/api/analytics/evaluation/${evaluationId}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to fetch evaluation data:', err));
  }, [evaluationId]);

  if (!data)
    return <p className="text-center p-6">Loading evaluation analytics...</p>;

  // Map scores
  const results = data.results.map((r: any) => {
    const scores = r.aiResult?.ai_data?.map((q: any) => q.marks_awarded ?? 0) ||
      r.scores || [0];
    return { ...r, scores };
  });

  const questionStats = data.questionStats.map((q: any, idx: number) => {
    const total = results.reduce((sum, s) => sum + (s.scores[idx] || 0), 0);
    const correctPercent = (
      (total / (results.length * (q.maxMarks || 1))) *
      100
    ).toFixed(2);
    return { ...q, correctPercent, short: `Q${idx + 1}` };
  });

  const studentTotals = results.map((s: any) => ({
    name: s.name,
    total: s.scores.reduce((a: number, b: number) => a + b, 0),
  }));

  const avgScore =
    studentTotals.reduce((a, b) => a + b.total, 0) /
    (studentTotals.length || 1);
  const topper = studentTotals.reduce((a, b) => (a.total > b.total ? a : b), {
    total: -1,
    name: '-',
  });
  const weakest = studentTotals.reduce((a, b) => (a.total < b.total ? a : b), {
    total: Infinity,
    name: '-',
  });

  // Chart Data with short labels and tooltips
  const questionAccuracyData = {
    labels: questionStats.map((q) => q.short),
    datasets: [
      {
        label: '% Correct',
        data: questionStats.map((q) => parseFloat(q.correctPercent)),
        backgroundColor: '#22C55E',
      },
    ],
  };

  const studentScoresData = {
    labels: results.map((r) => r.name),
    datasets: [
      {
        label: 'Total Score',
        data: results.map((r) =>
          r.scores.reduce((a: number, b: number) => a + b, 0)
        ),
        backgroundColor: '#3B82F6',
      },
    ],
  };

  // Chart options with tooltips for full question text
  const questionOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (tooltipItems: any) => {
            const idx = tooltipItems[0].dataIndex;
            return questionStats[idx].text;
          },
        },
      },
    },
  };

  const exportExcel = () => {
    const wsData = results.map((r: any) => {
      const row: any = { Student: r.name };
      r.scores.forEach((s: number, i: number) => {
        row[`Q${i + 1}`] = s;
      });
      row.Total = r.scores.reduce((a: number, b: number) => a + b, 0);
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluation Report');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout]), `evaluation_${data.evaluationId}.xlsx`);
  };

  const exportPDF = async () => {
    const input = document.getElementById('report-section');
    if (!input) return;

    // Replace all oklch colors in one loop
    input.querySelectorAll('*').forEach((el) => {
      const element = el as HTMLElement;
      const style = window.getComputedStyle(element);
      if (style.backgroundColor?.includes('oklch')) {
        element.style.backgroundColor = '#ffffff';
      }
      if (style.color?.includes('oklch')) {
        element.style.color = '#000000';
      }
    });

    // Ensure DOM updates are applied
    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = 190;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    pdf.save(`evaluation_${data.evaluationId}.pdf`);
  };
  return (
    <div
      id="report-section"
      className="p-6 space-y-6 "
      style={{
        color: '#000', // Force black text
        backgroundColor: '#fff', // Force white background
      }}
    >
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl font-bold mb-4 uppercase">
          {data.evaluationName} – Analytics Dashboard
        </h1>
        <Button color="ghost" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Average Score</h2>
          <p className="text-3xl font-bold text-green-700">
            {avgScore.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Topper</h2>
          <p className="text-xl font-bold text-blue-700">
            {topper.name} ({topper.total})
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Weakest</h2>
          <p className="text-xl font-bold text-red-700">
            {weakest.name} ({weakest.total})
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Question Accuracy</h3>
          <Bar data={questionAccuracyData} options={questionOptions} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Student Total Scores</h3>
          <Line data={studentScoresData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
        <h3 className="font-medium mb-4">
          Evaluation Heatmap (Student × Question)
        </h3>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Student</th>
              {questionStats.map((q, idx) => (
                <th key={idx} className="p-2 border text-center">
                  <Tooltip message={q.text}>
                    <span>{q.short}</span>
                  </Tooltip>
                </th>
              ))}
              <th className="p-2 border text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r: any, i: number) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{r.name}</td>
                {r.scores.map((s: number, j: number) => {
                  const bg =
                    s < 4
                      ? 'bg-red-200'
                      : s < 7
                        ? 'bg-yellow-200'
                        : 'bg-green-200';
                  return (
                    <td key={j} className={`p-2 border text-center ${bg}`}>
                      {s}
                    </td>
                  );
                })}
                <td className="p-2 border font-medium text-center">
                  {r.scores.reduce((a: number, b: number) => a + b, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end gap-4">
        <Button color="success" onClick={exportExcel}>
          <FileSpreadsheet className="w-5 h-5 mr-2" /> Excel
        </Button>
        <Button color="info" onClick={exportPDF}>
          <FileText className="w-5 h-5 mr-2" /> PDF
        </Button>
      </div>
    </div>
  );
}
