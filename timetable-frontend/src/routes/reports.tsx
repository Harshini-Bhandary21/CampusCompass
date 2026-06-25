import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Plus, Search, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { reportsList as initialReports } from "@/lib/mock-data";
import { toast } from "sonner";
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

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — CampusCompass ATS" },
      { name: "description", content: "Generated timetable reports, analytics exports, and conflict resolution logs." },
    ],
  }),
  component: ReportsPage,
});

type Row = typeof initialReports[number];

function ReportsPage() {
  const [reports, setReports] = useState<Row[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_reports");
      return saved ? JSON.parse(saved) : initialReports;
    }
    return initialReports;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Timetable");

  useEffect(() => {
    localStorage.setItem("cc_reports", JSON.stringify(reports));
  }, [reports]);

  const handleDownload = (report: Row) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Preparing ${report.name} for download...`,
        success: `${report.name} downloaded!`,
        error: "Download failed.",
      }
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const newReport: Row = {
      id: `R-${Math.floor(2000 + Math.random() * 8000)}`,
      name,
      type,
      date: dateStr,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
    };

    setReports((prev) => [newReport, ...prev]);
    setIsOpen(false);
    setName("");
    toast.success(`Report "${name}" generated!`);
  };

  const handleDelete = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report deleted.");
  };

  const filteredReports = reports.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Row>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: "name", header: "Report", render: (r) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></span>
        <span className="font-medium">{r.name}</span>
      </div>
    )},
    { key: "type", header: "Type" },
    { key: "date", header: "Generated" },
    { key: "size", header: "Size" },
    { key: "action", header: "Actions", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleDownload(r)}>
          <Download className="h-4 w-4 mr-1" /> Download
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(r.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )},
  ];

  return (
    <DashboardLayout title="Reports" subtitle="Exports, analytics & generation logs">
      <SectionCard
        title="All Reports"
        subtitle="Downloadable documents"
        icon={<FileText className="h-4 w-4 text-primary" />}
        action={<Button size="sm" className="shadow-glow" onClick={() => setIsOpen(true)}><Plus className="h-4 w-4" /> New Report</Button>}
      >
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <DataTable columns={columns} data={filteredReports} />
      </SectionCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="report-name">Report Title</Label>
                <Input
                  id="report-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Semester 3 Room Utilization Report"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-type">Report Category</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Timetable">Timetable Grid</SelectItem>
                    <SelectItem value="Analytics">Analytics Analysis</SelectItem>
                    <SelectItem value="Log">System Generation Log</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="shadow-glow">
                Create & Compile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
