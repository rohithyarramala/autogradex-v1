import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Button } from "react-daisyui";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

export default function EvaluationDashboard({ evaluationId = 1 }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/analytics/evaluation/${evaluationId}`)
      .then((res) => res.json())
      .then(setData);
  }, [evaluationId]);

  if (!data) return <p className="text-center p-6">Loading evaluation analytics...</p>;

  // Chart Data
  const questionAccuracyData = {
    labels: data.questionStats.map((q: any) => q.text),
    datasets: [
      {
        label: "% Correct",
        data: data.questionStats.map((q: any) => q.correctPercent),
        backgroundColor: "#22C55E",
      },
    ],
  };

  const studentScoresData = {
    labels: data.results.map((r: any) => r.name),
    datasets: [
      {
        label: "Total Score",
        data: data.results.map((r: any) => r.scores.reduce((a: number, b: number) => a + b, 0)),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  // Export functions
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.results.map((r: any) => ({
      Student: r.name,
      Total: r.scores.reduce((a: number, b: number) => a + b, 0),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Evaluation Report");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout]), `evaluation_${data.evaluationId}.xlsx`);
  };

  const exportPDF = async () => {
    const input = document.getElementById("report-section");
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`evaluation_${data.evaluationId}.pdf`);
  };

  return (
    <div id="report-section" className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        {data.evaluationName} – Analytics Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Average Score</h2>
          <p className="text-3xl font-bold text-green-700">
            {data.averageScore}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Topper</h2>
          <p className="text-xl font-bold text-blue-700">
            {data.topper.name} ({data.topper.total})
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Weakest</h2>
          <p className="text-xl font-bold text-red-700">
            {data.weakest.name} ({data.weakest.total})
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Question Accuracy</h3>
          <Bar data={questionAccuracyData} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-medium mb-2">Student Total Scores</h3>
          <Line data={studentScoresData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
        <h3 className="font-medium mb-4">Evaluation Heatmap (Student × Question)</h3>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Student</th>
              {data.questionStats.map((q: any) => (
                <th key={q.id} className="p-2 border text-center">Q{q.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.results.map((r: any, i: number) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{r.name}</td>
                {r.scores.map((s: number, j: number) => {
                  const bg =
                    s < 4 ? "bg-red-200"
                    : s < 7 ? "bg-yellow-200"
                    : "bg-green-200";
                  return (
                    <td key={j} className={`p-2 border text-center ${bg}`}>
                      {s}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-4">
        <Button color="success" onClick={exportExcel}>⬇️ Excel</Button>
        <Button color="info" onClick={exportPDF}>⬇️ PDF</Button>
      </div>
    </div>
  );
}
