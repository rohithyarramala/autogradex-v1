"use client"
import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import Modal from "@/components/shared/Modal";
import { Button } from "react-daisyui";
import { useSession } from "next-auth/react";

interface Teacher {
  id?: string | number;
  name: string;
  email: string;
  password?: string;
  organizationId?: string;
    subject?: string;
    classes?: number;
    students?: number;
}

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const { data: session } = useSession();
  console.log('Session:', session);

  // Fetch teachers on page load
  useEffect(() => {
    setLoading(true);
    fetch('/api/teachers')
      .then(res => res.json())
      .then(data => setTeachers(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string | number) => {
    setLoading(true);
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setLoading(false);
  };

  const handleSave = async (teacher: Teacher) => {
    setLoading(true);
    if (!teacher.name || !teacher.email || !teacher.password) {
      alert('Name, email, password, and organization are required');
      setLoading(false);
      return;
    }
    const orgId = session?.user?.organizationId;
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...teacher, organizationId: orgId }),
    });
    if (res.ok) {
      const newTeacher = await res.json();
      setTeachers((prev) => [...prev, newTeacher]);
      setOpenModal(false);
      setEditingTeacher(null);
    } else {
      alert('Failed to add teacher');
    }
    setLoading(false);
  };

  const columns: ColumnDef<Teacher>[] = [
    { accessorKey: "name", header: "Teacher Name" },
     { accessorKey: "email", header: "Email" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={() => {
                setEditingTeacher(teacher);
                setOpenModal(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              color="error"
              onClick={() => teacher.id !== undefined && handleDelete(teacher.id)}
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
        <h1 className="text-2xl font-bold">👨‍🏫 Teachers</h1>
        <Button
          color="success"
          onClick={() => {
            setEditingTeacher({ name: "", email: "", password: "", subject: "", classes: 0, students: 0, organizationId: "" });
            setOpenModal(true);
          }}
        >
          ➕ Add Teacher
        </Button>
      </div>

      {loading && <div>Loading...</div>}
      <DataTable columns={columns} data={teachers} />

      {/* Modal */}
      <Modal open={openModal} close={() => setOpenModal(false)}>
        <Modal.Header>
          {editingTeacher?.id ? "Edit Teacher" : "Add Teacher"}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingTeacher?.name || ""}
              onChange={(e) =>
                setEditingTeacher((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded mt-1"
              value={editingTeacher?.email || ""}
              onChange={(e) =>
                setEditingTeacher((prev) => (prev ? { ...prev, email: e.target.value } : null))
              }
            />
          </div>
          {/* Only show password field when adding a new teacher */}
          {!editingTeacher?.id && (
            <div className="mb-4">
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full border p-2 rounded mt-1"
                value={editingTeacher?.password || ""}
                onChange={(e) =>
                  setEditingTeacher((prev) => (prev ? { ...prev, password: e.target.value } : null))
                }
              />
            </div>
          )}
          {/* <div className="mb-4">
            <label className="block text-sm font-medium">Organization ID</label> */}
            {/* Organization ID is set from session, not entered manually */}
          {/* </div> */}
          {/* <div className="mb-4">
            <label className="block text-sm font-medium">Subject</label> */}
              {/* Subject is no longer required */}
          {/* </div> */}
          {/* <div className="mb-4">
            <label className="block text-sm font-medium">Classes</label> */}
              {/* Classes is no longer required */}
          {/* </div> */}
          {/* <div className="mb-4">
            <label className="block text-sm font-medium">Students</label> */}
              {/* Students is no longer required */}
          {/* </div> */}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="ghost"
            onClick={() => {
              setOpenModal(false);
              setEditingTeacher(null);
            }}
          >
            Cancel
          </Button>
          <Button color="primary" onClick={() => editingTeacher && handleSave(editingTeacher)}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeachersPage;
