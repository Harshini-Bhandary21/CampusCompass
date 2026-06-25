import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Plus, Download, Edit, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { DataTable, StatusBadge, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { useCampusData } from "@/hooks/useCampusData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty — CampusCompass ATS" },
      { name: "description", content: "Manage faculty profiles, teaching load, and availability for AI timetable generation." },
    ],
  }),
  component: FacultyPage,
});

type Row = ReturnType<typeof useCampusData>["faculty"][number];

function FacultyPage() {
  const { faculty, addFaculty, updateFaculty, deleteFaculty } = useCampusData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Row | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [subjects, setSubjects] = useState(3);
  const [load, setLoad] = useState(16);
  const [status, setStatus] = useState("Optimal");

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setName("");
    setDept("");
    setSubjects(3);
    setLoad(16);
    setStatus("Optimal");
    setIsOpen(true);
  };

  const handleOpenEdit = (f: Row) => {
    setEditingFaculty(f);
    setName(f.name);
    setDept(f.dept);
    setSubjects(f.subjects);
    setLoad(f.load);
    setStatus(f.status);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dept) return;

    if (editingFaculty) {
      updateFaculty({
        id: editingFaculty.id,
        name,
        dept,
        subjects,
        load,
        status,
      });
    } else {
      addFaculty({
        id: `F-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        dept,
        subjects,
        load,
        status,
      });
    }
    setIsOpen(false);
  };

  // Filter faculty based on search query
  const filteredFaculty = faculty.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Row>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Faculty", render: (r) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1EFE8] border border-gray-200/50 text-[11px] font-bold text-[#5F5E5A]">
          {r.name.split(" ").slice(-1)[0][0]}
        </span>
        <span className="font-medium">{r.name}</span>
      </div>
    )},
    { key: "dept", header: "Department" },
    { key: "subjects", header: "Subjects" },
    { key: "load", header: "Weekly Load", render: (r) => `${r.load} hrs` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFaculty(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout title="Faculty" subtitle={`${filteredFaculty.length} active members · workload balanced`}>
      <SectionCard
        title="Faculty Directory"
        subtitle="Profiles, load & availability"
        icon={<Users className="h-4 w-4 text-primary" />}
        action={
          <div className="flex gap-2">
            <Button
              variant={null as any}
              size="sm"
              className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant={null as any}
              size="sm"
              onClick={handleOpenAdd}
              className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Faculty
            </Button>
          </div>
        }
      >
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <DataTable columns={columns} data={filteredFaculty} />
      </SectionCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingFaculty ? "Edit Faculty Member" : "Add Faculty Member"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Anil Mehra"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dept">Department</Label>
                <Input
                  id="dept"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subjects">No. of Subjects</Label>
                  <Input
                    id="subjects"
                    type="number"
                    min={1}
                    max={10}
                    value={subjects}
                    onChange={(e) => setSubjects(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="load">Weekly Load (hrs)</Label>
                  <Input
                    id="load"
                    type="number"
                    min={2}
                    max={40}
                    value={load}
                    onChange={(e) => setLoad(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Workload Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Optimal">Optimal</SelectItem>
                    <SelectItem value="Underloaded">Underloaded</SelectItem>
                    <SelectItem value="Overloaded">Overloaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant={null as any} onClick={() => setIsOpen(false)} className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none px-4 py-2 h-9 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="default" className="bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none rounded-xl px-4 py-2 h-9 font-semibold">
                {editingFaculty ? "Save Changes" : "Add Faculty"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
