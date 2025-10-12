'use client';
import { useEffect, useState } from 'react';
import { Line, Bar, Radar, Pie } from 'react-chartjs-2';
import { Button } from 'react-daisyui';
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
  ArcElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { useParams } from 'next/navigation';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
  Legend
);

interface Evaluation {
  id: string;
  name: string;
  obtainedMarks: number;
  totalMarks: number;
  classAverage: number;
  heatmap: { topic: string; score: number; maxMarks: number }[];
}

interface AnalyticsData {
  studentId: string;
  studentName: string;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  consistency: string;
  rank: number;
  classSize: number;
  evaluations: Evaluation[];
  topics: string[];
  heatmap: { evaluation: string; scores: number[] }[];
  grades: Record<string, number>;
  weaknesses: { topic: string; averageScore: number }[];
}

export default function StudentDashboard() {
  const { studentId } = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch(`/api/analytics/student/${studentId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [studentId]);

  if (!data) return <p className="text-center p-6">Loading analytics...</p>;

  const scores = data.evaluations.map((e) => e.obtainedMarks);
  const evalNames = data.evaluations.map((e) => e.name);

  const lineData = {
    labels: evalNames,
    datasets: [
      {
        label: 'Score Trend',
        data: scores,
        borderColor: '#2563EB',
        backgroundColor: '#93C5FD66',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const vsClassData = {
    labels: evalNames,
    datasets: [
      { label: 'Student', data: scores, backgroundColor: '#16A34A' },
      {
        label: 'Class Avg',
        data: data.evaluations.map((e) => e.classAverage),
        backgroundColor: '#F59E0B',
      },
    ],
  };

  const radarData = {
    labels: data.topics,
    datasets: [
      {
        label: 'Latest Evaluation Topic Performance',
        data: data.heatmap[data.heatmap.length - 1]?.scores ?? [],
        borderColor: '#7C3AED',
        backgroundColor: '#C4B5FD66',
        fill: true,
      },
    ],
  };

  const heatmapColor = (score: number) =>
    score < 50 ? 'bg-red-200' : score < 75 ? 'bg-yellow-200' : 'bg-green-200';

  // Export Excel
  const exportExcel = () => {
    const exportData = data.evaluations.map((e, idx) => {
      const obj: any = {
        Evaluation: e.name,
        'Obtained Marks': e.obtainedMarks,
        'Total Marks': e.totalMarks,
        'Class Average': e.classAverage,
      };
      data.topics.forEach((t, i) => (obj[t] = data.heatmap[idx]?.scores[i] ?? ''));
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout]), `student_${studentId}_analytics.xlsx`);
  };

  const exportPDF = async () => {
    const report = document.getElementById('student-report');
    if (!report) return;
    const canvas = await html2canvas(report, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    while (heightLeft > pageHeight) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`student_${studentId}_analytics.pdf`);
  };

  return (
    <div id="student-report" className="p-6 space-y-6 bg-gray-50 rounded-xl">
      <h1 className="text-2xl font-bold mb-4">{data.studentName} - Analytics</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-3xl font-semibold text-blue-700">{data.avgScore}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-600">Highest Score</p>
          <p className="text-xl font-semibold text-purple-700">{data.highestScore}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-600">Lowest Score</p>
          <p className="text-xl font-semibold text-red-700">{data.lowestScore}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow text-center">
          <p className="text-sm text-gray-600">Consistency</p>
          <p className="text-xl font-semibold text-yellow-700">{data.consistency}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm font-semibold mb-2 text-gray-700">Score Trend</p>
          <Line data={lineData} />
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm font-semibold mb-2 text-gray-700">Marks vs Class Avg</p>
          <Bar data={vsClassData} />
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm font-semibold mb-2 text-gray-700">Topic Performance</p>
          <Radar data={radarData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl shadow p-4 overflow-auto">
        <p className="text-lg font-bold mb-2 text-gray-700">Topic-wise Heatmap</p>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Evaluation</th>
              {data.topics.map((t, i) => (
                <th key={i} className="p-2 border text-center">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row, i) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{row.evaluation}</td>
                {row.scores.map((s, j) => (
                  <td key={j} className={`p-2 border text-center ${heatmapColor(s)}`}>
                    {s}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-4">
        <Button color="success" className="flex items-center gap-2" onClick={exportExcel}>
          <FaFileExcel /> Export Excel
        </Button>
        <Button color="info" className="flex items-center gap-2" onClick={exportPDF}>
          <FaFilePdf /> Export PDF
        </Button>
      </div>
    </div>
  );
}
