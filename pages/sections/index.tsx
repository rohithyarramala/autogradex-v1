import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import Modal from "@/components/shared/Modal";
import { Button } from "react-daisyui";

type Section = {
  id?: string;
  name: string;
};

const SectionsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Fetch sections from API
  useEffect(() => {
    setLoading(true);
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        // Ensure we only set an array into state
        if (Array.isArray(data)) {
          setSections(data);
        } else {
          console.warn('Unexpected sections payload, expected array:', data);
          setSections([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Delete section
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await fetch(`/api/sections/${id}`, { method: "DELETE" });
    setSections((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.filter((s) => s.id !== id);
    });
  };

  // Save section (create or update)
  const handleSave = async (section: Section) => {
    if (section.id) {
      // Update
      const res = await fetch(`/api/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: section.name }),
      });
      const updated = await res.json();
        setSections((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((s) => (s.id === section.id ? updated : s));
        });
    } else {
      // Create
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: section.name }),
      });
      const created = await res.json();
        setSections((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return [...list, created];
        });
    }
    setOpenModal(false);
    setEditingSection(null);
  };

  const columns: ColumnDef<Section>[] = [
    { accessorKey: "name", header: "Section Name" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const section = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="primary"
              onClick={() => {
                setEditingSection(section);
                setOpenModal(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              color="error"
              onClick={() => handleDelete(section.id)}
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
        <h1 className="text-2xl font-bold">📘 Sections</h1>
        <Button
          color="success"
          onClick={() => {
            setEditingSection({ name: "" });
            setOpenModal(true);
          }}
        >
          ➕ Add Section
        </Button>
      </div>

      {loading ? <div>Loading...</div> : <DataTable columns={columns} data={sections} />}

      {/* Modal */}
      <Modal open={openModal} close={() => setOpenModal(false)}>
        <Modal.Header>
          {editingSection?.id ? "Edit Section" : "Add Section"}
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={editingSection?.name || ""}
              onChange={(e) =>
                setEditingSection((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="ghost"
            onClick={() => {
              setOpenModal(false);
              setEditingSection(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() =>
              editingSection ? handleSave(editingSection) : null
            }
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SectionsPage;