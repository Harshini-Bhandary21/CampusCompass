"use client";

import { useEffect, useState } from "react";
import FacultyCard from "@/app/components/landing/FacultyCard";
import { initialsAvatarDataUri } from "@/lib/avatar";
import { Search } from "lucide-react";

const DEPARTMENTS = [
  "All",
  "Computer Engineering",
  "Software Engineering",
  "Information Technology",
  "Artificial Intelligence & Machine Learning",
  "Data Science",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "First Year",
];

export default function FacultyInfoPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  useEffect(() => {
    fetch("/api/users?role=teacher")
      .then((r) => r.json())
      .then((teachers) => {
        setFaculty(
          teachers.map((t) => ({
            id: t._id,
            name: t.name,
            designation: t.designation,
            department: t.department,
            contact_no: t.phone,
            experience: t.experience,
            image: t.profilePhoto || initialsAvatarDataUri(t.name),
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === "All" || f.department === department;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Faculty Information</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-white"
          />
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-300 bg-white"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading faculty...</p>
      ) : filteredFaculty.length === 0 ? (
        <p className="text-slate-500">No faculty found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((f, index) => (
            <FacultyCard key={f.id} faculty={f} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
