import { useEffect, useState } from 'react';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import { Button } from 'react-daisyui';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

export default function StudentDashboard({ studentId = 1 }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/analytics/student/${studentId}`)
      .then((res) => res.json())
      .then(setData);
  }, [studentId]);

  if (!data) return <p className="text-center p-6">Loading analytics...</p>;

  const scores = data.evaluations.map((e: any) => e.obtainedMarks);
  const evalNames = data.evaluations.map((e: any) => e.name);

  // Low / Medium / High color
  const heatmapColor = (score: number) =>
    score < 50 ? 'bg-red-300' : score < 75 ? 'bg-yellow-200' : 'bg-green-200';

  // Line chart
  const lineData = {
    labels: evalNames,
    datasets: [
      {
        label: 'Score Trend',
        data: scores,
        borderColor: '#16A34A',
        backgroundColor: '#16A34A55',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Student vs Class average
  const vsClassData = {
    labels: evalNames,
    datasets: [
      { label: 'Student', data: scores, backgroundColor: '#22C55E' },
      {
        label: 'Class Avg',
        data: data.evaluations.map((e: any) => e.classAverage),
        backgroundColor: '#facc15',
      },
    ],
  };

  // Radar → topic performance latest evaluation
  const radarData = {
    labels: data.topics,
    datasets: [
      {
        label: 'Topic Scores (Latest Eval)',
        data: data.heatmap[data.heatmap.length - 1].scores,
        borderColor: '#f43f5e',
        backgroundColor: '#f43f5e33',
        fill: true,
      },
    ],
  };

  const gradeLabels = data.grades
    ? Object.keys(data.grades)
    : ['A', 'B', 'C', 'D', 'F'];
  const gradeValues = data.grades
    ? Object.values(data.grades)
    : [10, 50, 20, 30, 20];
  const pieData = {
    labels: gradeLabels,
    datasets: [
      {
        data: gradeValues,
        backgroundColor: [
          '#16A34A',
          '#65A30D',
          '#EAB308',
          '#F97316',
          '#DC2626',
        ],
      },
    ],
  };

  // Export Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.evaluations.map((e: any, idx: number) => {
        const obj: any = {
          Evaluation: e.name,
          'Obtained Marks': e.obtainedMarks,
          'Class Avg': e.classAverage,
        };
        data.topics.forEach(
          (t: string, i: number) => (obj[t] = data.heatmap[idx].scores[i])
        );
        return obj;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Report');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout]), `student_${studentId}_report.xlsx`);
  };

  // Export PDF
  const exportPDF = async () => {
    const input = document.getElementById('student-report');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save(`student_${studentId}_report.pdf`);
  };

  return (
    <div id="student-report" className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        {data.studentName} – Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-green-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Avg Score</h2>
          <p className="text-3xl font-bold text-green-700">{data.avgScore}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Class Rank</h2>
          <p className="text-xl font-bold text-blue-700">
            {data.rank}/{data.classSize}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Weak Topics</h2>
          <ul className="text-red-700">
            {data.weaknesses.map((w: any, i: number) => (
              <li key={i}>
                {w.topic} ({w.averageScore}%)
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-purple-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Highest Score</h2>
          <p className="text-xl font-bold text-purple-700">
            {data.highestScore}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Lowest Score</h2>
          <p className="text-xl font-bold text-orange-700">
            {data.lowestScore}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Consistency</h2>
          <p className="text-xl font-bold text-yellow-700">
            {data.consistency}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">
            Score Trend
          </h3>
          <Line data={lineData} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">
            Marks vs Class Avg
          </h3>
          <Bar data={vsClassData} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">
            Topic Performance
          </h3>
          <Radar data={radarData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">
            Grade Distribution
          </h3>
          <Pie data={pieData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-700">
          Topic-wise Heatmap
        </h3>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Evaluation</th>
              {data.topics.map((t: string, i: number) => (
                <th key={i} className="p-2 border text-center">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row: any, i: number) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{row.evaluation}</td>
                {row.scores.map((s: number, j: number) => (
                  <td
                    key={j}
                    className={`p-2 border text-center ${heatmapColor(60 * s)}`}
                  >
                    {10 * s}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-4">
        <Button color="success" onClick={exportExcel}>
          ⬇️ Export Excel
        </Button>
        <Button color="info" onClick={exportPDF}>
          ⬇️ Export PDF
        </Button>
      </div>
    </div>
  );
}
