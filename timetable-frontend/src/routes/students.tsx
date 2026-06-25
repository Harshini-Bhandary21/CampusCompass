import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Plus, Clock, Smile, Search, Edit, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
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

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — CampusCompass ATS" },
      { name: "description", content: "Student groups, idle-time tracking, and schedule convenience scoring." },
    ],
  }),
  component: StudentsPage,
});

type Row = ReturnType<typeof useCampusData>["students"][number];

function StudentsPage() {
  const { students: studentGroups, addStudentGroup, updateStudentGroup, deleteStudentGroup } = useCampusData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Row | null>(null);

  // Form states
  const [id, setId] = useState("");
  const [program, setProgram] = useState("");
  const [sem, setSem] = useState(3);
  const [count, setCount] = useState(60);
  const [idleHours, setIdleHours] = useState(1.2);
  const [convenience, setConvenience] = useState(90);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setId("");
    setProgram("");
    setSem(3);
    setCount(60);
    setIdleHours(1.2);
    setConvenience(90);
    setIsOpen(true);
  };

  const handleOpenEdit = (g: Row) => {
    setEditingGroup(g);
    setId(g.id);
    setProgram(g.program);
    setSem(g.sem);
    setCount(g.students);
    setIdleHours(g.idleHours);
    setConvenience(g.convenience);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !program) return;

    if (editingGroup) {
      updateStudentGroup({
        id,
        program,
        sem,
        students: count,
        idleHours,
        convenience,
      });
    } else {
      addStudentGroup({
        id,
        program,
        sem,
        students: count,
        idleHours,
        convenience,
      });
    }
    setIsOpen(false);
  };

  // Filter student groups
  const filteredGroups = studentGroups.filter(
    (g) =>
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudentCount = filteredGroups.reduce((acc, curr) => acc + curr.students, 0);
  const averageIdle = (filteredGroups.reduce((acc, curr) => acc + curr.idleHours, 0) / (filteredGroups.length || 1)).toFixed(1);
  const averageConvenience = Math.round(filteredGroups.reduce((acc, curr) => acc + curr.convenience, 0) / (filteredGroups.length || 1));

  const columns: Column<Row>[] = [
    { key: "id", header: "Group", render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "program", header: "Program" },
    { key: "sem", header: "Semester", render: (r) => `Sem ${r.sem}` },
    { key: "students", header: "Students" },
    { key: "idleHours", header: "Avg Idle", render: (r) => `${r.idleHours} h/day` },
    { key: "convenience", header: "Convenience", render: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#534AB7]" style={{ width: `${r.convenience}%` }} />
        </div>
        <span className="text-xs font-medium">{r.convenience}%</span>
      </div>
    )},
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteStudentGroup(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout title="Students" subtitle={`${totalStudentCount.toLocaleString()} students across all programs`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Students" value={totalStudentCount.toLocaleString()} icon={GraduationCap} accent="info" index={0} />
        <MetricCard label="Avg Idle Time" value={`${averageIdle} h`} icon={Clock} accent="warning" index={1} />
        <MetricCard label="Convenience Score" value={`${averageConvenience}%`} icon={Smile} accent="success" index={2} />
      </div>

      <div className="mt-4">
        <SectionCard
          title="Student Groups"
          subtitle="Idle time & convenience by cohort"
          icon={<GraduationCap className="h-4 w-4 text-info" />}
          action={
            <Button
              variant={null as any}
              size="sm"
              onClick={handleOpenAdd}
              className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none text-xs font-semibold px-3 py-1.5 h-8 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Group
            </Button>
          }
        >
          <div className="relative mb-4 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <DataTable columns={columns} data={filteredGroups} />
        </SectionCard>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Edit Student Group" : "Add Student Group"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="id">Group ID</Label>
                  <Input
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. CSE-3C"
                    required
                    disabled={editingGroup !== null}
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
                <Label htmlFor="program">Program Name</Label>
                <Input
                  id="program"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. B.Tech CSE"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="students">Students Count</Label>
                  <Input
                    id="students"
                    type="number"
                    min={10}
                    max={200}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idle">Idle Hours</Label>
                  <Input
                    id="idle"
                    type="number"
                    step="0.1"
                    min={0}
                    max={6}
                    value={idleHours}
                    onChange={(e) => setIdleHours(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="convenience">Convenience (%)</Label>
                  <Input
                    id="convenience"
                    type="number"
                    min={0}
                    max={100}
                    value={convenience}
                    onChange={(e) => setConvenience(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant={null as any} onClick={() => setIsOpen(false)} className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none px-4 py-2 h-9 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="default" className="bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none rounded-xl px-4 py-2 h-9 font-semibold">
                {editingGroup ? "Save Changes" : "Add Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
