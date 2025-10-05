import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import Modal from "@/components/shared/Modal";
import { Button } from "react-daisyui";

interface Student {
  id: number;
  name: string;
  email: string;
  password?: string;
  rollNo: string;
  classId?: string;
  sectionId?: string;
  className: string;
  section: string;
}

const StudentsPage = () => {
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const fetchStudents = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    setStudents(
      (Array.isArray(data) ? data : []).map((student: any) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo || '',
        classId: student.studentEnrollments?.[0]?.classId || undefined,
        sectionId: student.studentEnrollments?.[0]?.sectionId || undefined,
        className: student.studentEnrollments?.[0]?.class?.name || '',
        section: student.studentEnrollments?.[0]?.section?.name || '',
      }))
    );
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const [openModal, setOpenModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  useEffect(() => {
    // Fetch classes
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data));
    // Fetch sections
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => setSections(data));
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    await fetchStudents();
  };

  const handleSave = async (student: Student) => {
    if (student.id) {
      await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: student.name, email: student.email, rollNo: student.rollNo, sectionId: student.sectionId, classId: student.classId }),
      });
      await fetchStudents();
    } else {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: student.name, email: student.email, password: student.password, rollNo: student.rollNo, sectionId: student.sectionId, classId: student.classId }),
      });
      await fetchStudents();
    }
    setOpenModal(false);
    setEditingStudent(null);
  };

  const columns: ColumnDef<Student>[] = [
    { accessorKey: "name", header: "Student Name" },
    { accessorKey: "rollNo", header: "Roll No" },
    { accessorKey: "className", header: "Class" },
    { accessorKey: "section", header: "Section" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={() => {
                setEditingStudent(student);
                setOpenModal(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              color="error"
              onClick={() => handleDelete(student.id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">👩‍🎓 Students</h1>
        <Button
          color="success"
          onClick={() => {
            setEditingStudent({ id: 0, name: "", email: "", rollNo: "", className: "", section: "" });
            setOpenModal(true);
          }}
        >
          ➕ Add Student
        </Button>
      </div>

      <DataTable columns={columns} data={students} />

      {/* Modal */}
      <Modal open={openModal} close={() => setOpenModal(false)}>
        <Modal.Header>
          {editingStudent?.id ? "Edit Student" : "Add Student"}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingStudent?.name || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded mt-1"
              value={editingStudent?.email || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, email: e.target.value } : null))
              }
            />
          </div>
          {!editingStudent?.id && (
            <div className="mb-4">
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full border p-2 rounded mt-1"
                value={editingStudent?.password || ""}
                onChange={(e) =>
                  setEditingStudent((prev) => (prev ? { ...prev, password: e.target.value } : null))
                }
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium">Roll No</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingStudent?.rollNo || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, rollNo: e.target.value } : null))
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Class</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={editingStudent?.classId || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, classId: e.target.value } : null))
              }
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Section</label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={editingStudent?.sectionId || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, sectionId: e.target.value } : null))
              }
            >
              <option value="">Select Section</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="ghost"
            onClick={() => {
              setOpenModal(false);
              setEditingStudent(null);
            }}
          >
            Cancel
          </Button>
          <Button color="primary" onClick={() => editingStudent && handleSave(editingStudent)}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentsPage;
