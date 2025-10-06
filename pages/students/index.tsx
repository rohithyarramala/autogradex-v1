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
  const [openModal, setOpenModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Fetch students
  const fetchStudents = async () => {
    const res = await fetch("/api/students");
    const data = await res.json();
    setStudents(
      (Array.isArray(data) ? data : []).map((student: any) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo || "",
        classId: student.studentEnrollments?.[0]?.classId || undefined,
        sectionId: student.studentEnrollments?.[0]?.sectionId || undefined,
        className: student.studentEnrollments?.[0]?.class?.name || "",
        section: student.studentEnrollments?.[0]?.section?.name || "",
      }))
    );
  };

  useEffect(() => {
    fetchStudents();
    // Fetch classes and sections
    fetch("/api/classes").then((res) => res.json()).then(setClasses);
    fetch("/api/sections").then((res) => res.json()).then(setSections);
  }, []);

  // Email check
  const checkEmailAvailability = async (email: string) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch (err) {
      console.error("Email check failed", err);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const handleSave = async (student: Student) => {
    // Validate
    const newErrors: typeof errors = {};
    if (!student.name) newErrors.name = "Name is required";
    if (!student.email) newErrors.email = "Email is required";
    if (!editingStudent?.id && !student.password) newErrors.password = "Password is required";
    if (!editingStudent?.id && !emailAvailable) newErrors.email = "Email is already taken";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (student.id) {
        await fetch(`/api/students/${student.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: student.name,
            email: student.email,
            rollNo: student.rollNo,
            sectionId: student.sectionId,
            classId: student.classId,
          }),
        });
      } else {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: student.name,
            email: student.email,
            password: student.password,
            rollNo: student.rollNo,
            sectionId: student.sectionId,
            classId: student.classId,
          }),
        });
      }
      fetchStudents();
      setOpenModal(false);
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
    }
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
            <Button size="sm" color="error" onClick={() => handleDelete(student.id)}>
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

      <Modal open={openModal} close={() => setOpenModal(false)}>
        <Modal.Header>{editingStudent?.id ? "Edit Student" : "Add Student"}</Modal.Header>
        <Modal.Body>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className={`w-full border p-2 rounded mt-1 ${errors.name ? "border-red-500" : ""}`}
              value={editingStudent?.name || ""}
              onChange={(e) =>
                setEditingStudent((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className={`w-full border p-2 rounded mt-1 ${errors.email ? "border-red-500" : ""}`}
              value={editingStudent?.email || ""}
              onChange={(e) => {
                const email = e.target.value;
                setEditingStudent((prev) => (prev ? { ...prev, email } : null));
                checkEmailAvailability(email);
              }}
            />
            {!emailAvailable && <p className="text-red-500 text-sm mt-1">Email is already taken</p>}
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          {!editingStudent?.id && (
            <div className="mb-4">
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className={`w-full border p-2 rounded mt-1 ${errors.password ? "border-red-500" : ""}`}
                value={editingStudent?.password || ""}
                onChange={(e) =>
                  setEditingStudent((prev) => (prev ? { ...prev, password: e.target.value } : null))
                }
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Roll No */}
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

          {/* Class */}
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

          {/* Section */}
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
          <Button
            color="primary"
            onClick={() => editingStudent && handleSave(editingStudent)}
            disabled={!emailAvailable}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentsPage;
