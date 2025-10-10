import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
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
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

export default function ClassDashboard({ classId = 1 }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/analytics/class/${classId}`)
      .then((res) => res.json())
      .then(setData);
  }, [classId]);

  if (!data) return <p className="text-center p-6">Loading analytics...</p>;

  const scores = data.students.map((s: any) => s.score);
  const studentNames = data.students.map((s: any) => s.name);

  // Charts data
  const barData = {
    labels: data.questions.map((q: any) => q.text),
    datasets: [
      {
        label: "% Correct",
        data: data.questions.map((q: any) => q.correctPercent),
        backgroundColor: "#22C55E"
      }
    ]
  };

  const lineData = {
    labels: studentNames,
    datasets: [
      {
        label: "Student Scores",
        data: scores,
        borderColor: "#16A34A",
        backgroundColor: "#16A34A55",
        tension: 0.3,
        fill: true
      }
    ]
  };

  const pieData = {
    labels: ["A", "B", "C", "D", "F"],
    datasets: [
      {
        data: [5, 8, 4, 2, 1], // dummy distribution
        backgroundColor: ["#16A34A","#65A30D","#EAB308","#F97316","#DC2626"]
      }
    ]
  };

  const heatmapColor = (score: number) =>
    score < 50 ? "bg-red-300" : score < 75 ? "bg-yellow-200" : "bg-green-200";

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      data.heatmap.map((row: any) => {
        const obj: any = { Student: row.student };
        data.questions.forEach((q: any, i: number) => (obj[q.text] = row.scores[i]));
        return obj;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Class Report");
    const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([wbout]), `class_${classId}_report.xlsx`);
  };

  const exportPDF = async () => {
    const input = document.getElementById("class-report");
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`class_${classId}_report.pdf`);
  };

  return (
    <div id="class-report" className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">{data.className} – Performance Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Class Average</h2>
          <p className="text-3xl font-bold text-green-700">{data.classAverage}%</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Topper</h2>
          <p className="text-xl font-bold text-blue-700">{data.topper.name} ({data.topper.score}%)</p>
        </div>
        <div className="p-4 bg-red-50 rounded-2xl shadow">
          <h2 className="text-sm text-gray-600">Weakest</h2>
          <p className="text-xl font-bold text-red-700">{data.weakest.name} ({data.weakest.score}%)</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">Question Accuracy</h3>
          <Bar data={barData} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">Score Distribution</h3>
          <Line data={lineData} />
        </div>
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="text-sm font-medium mb-2 text-gray-600">Grade Segmentation</h3>
          <Pie data={pieData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-700">Student × Question Heatmap</h3>
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Student</th>
              {data.questions.map((q: any) => (
                <th key={q.id} className="p-2 border text-center">{q.text}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.heatmap.map((row: any, i: number) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{row.student}</td>
                {row.scores.map((score: number, j: number) => (
                  <td key={j} className={`p-2 border text-center ${heatmapColor(score)}`}>
                    {score}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-4">
        <Button color="success" onClick={exportExcel}>⬇️ Export Excel</Button>
        <Button color="info" onClick={exportPDF}>⬇️ Export PDF</Button>
      </div>
    </div>
  );
}
