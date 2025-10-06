"use client";

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
}

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [emailAvailable, setEmailAvailable] = useState(true);
  const { data: session } = useSession();

  // Fetch teachers on page load
  useEffect(() => {
    setLoading(true);
    fetch("/api/teachers")
      .then((res) => res.json())
      .then((data) => setTeachers(data))
      .finally(() => setLoading(false));
  }, []);

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch (err) {
      console.error("Email check failed", err);
    }
  };

  const handleDelete = async (id: string | number) => {
    setLoading(true);
    await fetch(`/api/teachers/${id}`, { method: "DELETE" });
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setLoading(false);
  };

  const handleSave = async (teacher: Teacher) => {
    // Reset errors
    setErrors({});
    const newErrors: typeof errors = {};

    if (!teacher.name) newErrors.name = "Name is required";
    if (!teacher.email) newErrors.email = "Email is required";
    if (!editingTeacher?.id && !teacher.password) newErrors.password = "Password is required";

    if (!editingTeacher?.id && !emailAvailable) {
      newErrors.email = "Email is already taken";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      if (teacher.id) {
        // Update
        const res = await fetch(`/api/teachers/${teacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: teacher.name, email: teacher.email }),
        });
        if (res.ok) {
          const updatedTeacher = await res.json();
          setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
        } else {
          alert("Failed to update teacher");
        }
      } else {
        // Create
        const orgId = session?.user?.organizationId;
        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...teacher, organizationId: orgId }),
        });
        if (res.ok) {
          const newTeacher = await res.json();
          setTeachers((prev) => [...prev, newTeacher]);
        } else {
          alert("Failed to add teacher");
        }
      }

      setOpenModal(false);
      setEditingTeacher(null);
    } finally {
      setLoading(false);
    }
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
            setEditingTeacher({ name: "", email: "", password: "", organizationId: "" });
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
        <Modal.Header>{editingTeacher?.id ? "Edit Teacher" : "Add Teacher"}</Modal.Header>
        <Modal.Body>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className={`w-full border p-2 rounded mt-1 ${errors.name ? "border-red-500" : ""}`}
              value={editingTeacher?.name || ""}
              onChange={(e) =>
                setEditingTeacher((prev) => (prev ? { ...prev, name: e.target.value } : null))
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
              value={editingTeacher?.email || ""}
              onChange={(e) => {
                const email = e.target.value;
                setEditingTeacher((prev) => (prev ? { ...prev, email } : null));
                checkEmailAvailability(email);
              }}
            />
            {!emailAvailable && <p className="text-red-500 text-sm mt-1">Email is already taken</p>}
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password (only new teacher) */}
          {!editingTeacher?.id && (
            <div className="mb-4">
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                className={`w-full border p-2 rounded mt-1 ${errors.password ? "border-red-500" : ""}`}
                value={editingTeacher?.password || ""}
                onChange={(e) =>
                  setEditingTeacher((prev) => (prev ? { ...prev, password: e.target.value } : null))
                }
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          )}
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
          <Button
            color="primary"
            onClick={() => editingTeacher && handleSave(editingTeacher)}
            disabled={!emailAvailable}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeachersPage;
