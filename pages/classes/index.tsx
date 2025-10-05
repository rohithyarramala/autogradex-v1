"use client";
import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import Modal from "@/components/shared/Modal";
import { Button } from "react-daisyui";
import { useSession } from "next-auth/react";

type ClassType = {
  id?: string;
  name: string;
  orgId: string;
};

const ClassesPage = () => {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const { data: session } = useSession();

  // Fetch classes from API
  useEffect(() => {
    setLoading(true);
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .finally(() => setLoading(false));
  }, []);

  // Delete class
  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    await fetch(`/api/classes/${id}`, { method: "DELETE" });
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setLoading(false);
  };

  // Save class (create or update)
  const handleSave = async (classObj: ClassType) => {
    setLoading(true);
    if (classObj.id) {
      // Update
      const res = await fetch(`/api/classes/${classObj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: classObj.name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClasses((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      }
    } else {
      // Create
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: classObj.name }),
      });
      if (res.ok) {
        const created = await res.json();
        setClasses((prev) => [...prev, created]);
      }
    }
    setOpenModal(false);
    setEditingClass(null);
    setLoading(false);
  };

   const columns: ColumnDef<ClassType>[] = [
    { accessorKey: "name", header: "Class Name" },
    // Removed Organization ID column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const classObj = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={() => {
                setEditingClass(classObj);
                setOpenModal(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              color="error"
              onClick={() => handleDelete(classObj.id)}
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
        <h1 className="text-2xl font-bold">🏫 Classes</h1>
        <Button
          color="success"
          onClick={() => {
            setEditingClass({
              name: "",
              orgId: session?.user?.organizationId || "",
            });
            setOpenModal(true);
          }}
        >
          ➕ Add Class
        </Button>
      </div>

      {loading && <div>Loading...</div>}
      <DataTable columns={columns} data={classes} />

      {/* Modal */}
      <Modal open={openModal} close={() => setOpenModal(false)}>
        <Modal.Header>
          {editingClass?.id ? "Edit Class" : "Add Class"}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingClass?.name || ""}
              onChange={(e) =>
                setEditingClass((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </div>
          {/* Organization ID is set from session, not editable */}
          <input
            type="hidden"
            value={editingClass?.orgId || ""}
            readOnly
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="ghost"
            onClick={() => {
              setOpenModal(false);
              setEditingClass(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() =>
              editingClass ? handleSave(editingClass) : null
            }
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClassesPage;