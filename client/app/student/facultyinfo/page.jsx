"use client";

import { useState } from "react";
import facultyData from "@/data/faculty.json";
import FacultyCard from "@/app/components/landing/FacultyCard";
import { Search } from "lucide-react";

export default function FacultyInfoPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  const filteredFaculty = facultyData.filter((faculty) => {
    const matchesSearch =
      faculty.name.toLowerCase().includes(search.toLowerCase()) ||
      faculty.department.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      department === "All" ||
      faculty.department === department;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Faculty Information
      </h1>

      {/* Search + Filter */}
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
         <option>All</option>
<option>Computer Engineering</option>
<option>Software Engineering</option>
<option>Information Technology</option>
<option>Artificial Intelligence & Machine Learning</option>
<option>Data Science</option>
<option>Electronics & Telecommunication</option>
<option>Mechanical Engineering</option>
<option>Civil Engineering</option>
<option>Chemical Engineering</option>
        </select>

      </div>

      {/* Faculty Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((faculty, index) => (
          <FacultyCard
            key={faculty.id}
            faculty={faculty}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
