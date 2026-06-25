import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DoorOpen, Plus, Download, Search, Edit, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — CampusCompass ATS" },
      { name: "description", content: "Manage classrooms, labs, and halls with capacity and utilization tracking." },
    ],
  }),
  component: RoomsPage,
});

type Row = ReturnType<typeof useCampusData>["rooms"][number];

function RoomsPage() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useCampusData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Row | null>(null);

  // Form states
  const [id, setId] = useState("");
  const [type, setType] = useState("Classroom");
  const [building, setBuilding] = useState("Block A");
  const [capacity, setCapacity] = useState(60);
  const [utilization, setUtilization] = useState(0);
  const [status, setStatus] = useState("Active");

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setId("");
    setType("Classroom");
    setBuilding("Block A");
    setCapacity(60);
    setUtilization(0);
    setStatus("Active");
    setIsOpen(true);
  };

  const handleOpenEdit = (r: Row) => {
    setEditingRoom(r);
    setId(r.id);
    setType(r.type);
    setBuilding(r.building);
    setCapacity(r.capacity);
    setUtilization(r.utilization);
    setStatus(r.status);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !building) return;

    const record = {
      id,
      type,
      building,
      capacity,
      utilization,
      status,
    };

    if (editingRoom) {
      updateRoom(record);
    } else {
      addRoom(record);
    }
    setIsOpen(false);
  };

  // Sorting states
  const [sortField, setSortField] = useState<keyof Row>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Row) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderHeader = (field: keyof Row, label: string) => {
    const isSorted = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-foreground font-semibold uppercase tracking-wide cursor-pointer transition select-none text-left"
      >
        {label}
        <span className="text-[10px] opacity-70">
          {isSorted ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    );
  };

  // Filter rooms based on query
  const filteredRooms = rooms.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const columns: Column<Row>[] = [
    { key: "id", header: renderHeader("id", "Room"), render: (r) => <span className="font-semibold">{r.id}</span> },
    { key: "type", header: renderHeader("type", "Type") },
    { key: "building", header: renderHeader("building", "Building") },
    { key: "capacity", header: renderHeader("capacity", "Capacity"), render: (r) => `${r.capacity} seats` },
    { key: "utilization", header: renderHeader("utilization", "Utilization"), render: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#534AB7]" style={{ width: `${r.utilization}%` }} />
        </div>
        <span className="text-xs font-medium">{r.utilization}%</span>
      </div>
    )},
    { key: "status", header: renderHeader("status", "Status"), render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRoom(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout title="Rooms" subtitle={`${filteredRooms.length} rooms across 3 buildings`}>
      <SectionCard
        title="Room Inventory"
        subtitle="Capacity & live utilization"
        icon={<DoorOpen className="h-4 w-4 text-info" />}
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
              <Plus className="h-4 w-4" /> Add Room
            </Button>
          </div>
        }
      >
        <div className="relative mb-4 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <DataTable columns={columns} data={sortedRooms} />
      </SectionCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] glass">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="room-id">Room ID / Name</Label>
                  <Input
                    id="room-id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="e.g. A-205"
                    required
                    disabled={editingRoom !== null}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Capacity (seats)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={5}
                    max={500}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Block A"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="utilization">Current Utilization (%)</Label>
                  <Input
                    id="utilization"
                    type="number"
                    min={0}
                    max={100}
                    value={utilization}
                    onChange={(e) => setUtilization(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="room-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Classroom">Classroom</SelectItem>
                      <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                      <SelectItem value="Seminar Hall">Seminar Hall</SelectItem>
                      <SelectItem value="Auditorium">Auditorium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Overbooked">Overbooked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant={null as any} onClick={() => setIsOpen(false)} className="border border-gray-200 text-[#5F5E5A] hover:bg-gray-50 bg-white shadow-none px-4 py-2 h-9 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="default" className="bg-[#534AB7] hover:bg-[#3C3489] text-white shadow-none rounded-xl px-4 py-2 h-9 font-semibold">
                {editingRoom ? "Save Changes" : "Add Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
