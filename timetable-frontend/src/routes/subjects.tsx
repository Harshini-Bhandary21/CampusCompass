import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, Download, Search, Edit, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — CampusCompass ATS" },
      { name: "description", content: "Manage courses, credits, lecture types, and faculty assignments." },
    ],
  }),
  component: SubjectsPage,
});

type Row = ReturnType<typeof useCampusData>["subjects"][number];

function SubjectsPage() {
  const { subjects, faculty, addSubject, updateSubject, deleteSubject } = useCampusData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Row | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Theory");
  const [credits, setCredits] = useState(4);
  const [sem, setSem] = useState(3);
  const [instructor, setInstructor] = useState("");

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setCode("");
    setName("");
    setType("Theory");
    setCredits(4);
    setSem(3);
    setInstructor(faculty[0]?.name || "");
    setIsOpen(true);
  };

  const handleOpenEdit = (s: Row) => {
    setEditingSubject(s);
    setCode(s.code);
    setName(s.name);
    setType(s.type);
    setCredits(s.credits);
    setSem(s.sem);
    setInstructor(s.faculty);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    const record = {
      code,
      name,
      type,
      credits,
      sem,
      faculty: instructor,
    };

    if (editingSubject) {
      updateSubject(record);
    } else {
      addSubject(record);
    }
    setIsOpen(false);
  };

  // Filter subjects based on query
  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.faculty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Row>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs font-semibold text-primary">{r.code}</span> },
    { key: "name", header: "Subject", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", render: (r) => <StatusBadge status={r.type} /> },
    { key: "credits", header: "Credits" },
    { key: "sem", header: "Semester", render: (r) => `Sem ${r.sem}` },
    { key: "faculty", header: "Faculty" },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteSubject(r.code)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout title="Subjects" subtitle={`${filteredSubjects.length} courses mapped to curriculum`}>
      <SectionCard
        title="Course Catalog"
        subtitle="Subjects, credits & assignments"
        icon={<BookOpen className="h-4 w-4 text-primary" />}
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
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          </div>
        }
      >
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <DataTable columns={columns} data={filteredSubjects} />
      </SectionCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS304"
                    required
                    disabled={editingSubject !== null}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sem">Semester</Label>
                  <Input
                    id="sem"
                    type="number"
                    min={1}
                    max={8}
                    value={sem}
                    onChange={(e) => setSem(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Compiler Design"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Lecture Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Theory">Theory</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                      <SelectItem value="Elective">Elective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instructor">Assigned Faculty</Label>
                <Select value={instructor} onValueChange={setInstructor}>
                  <SelectTrigger id="instructor">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.name} ({f.dept})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant={null as any} onClick={() => setIsOpen(false)} className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none px-4 py-2 h-9 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="default" className="bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none rounded-xl px-4 py-2 h-9 font-semibold">
                {editingSubject ? "Save Changes" : "Add Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
