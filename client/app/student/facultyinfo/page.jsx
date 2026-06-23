// import facultyData from "@/data/faculty.json";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   Mail,
//   MapPin,
//   Building2,
//   Briefcase,
//   GraduationCap,
//   Clock,
// } from "lucide-react";
// import { notFound } from "next/navigation";

// export default function FacultyInfoPage({ params }) {
//   const faculty = facultyData.find(
//     (item) => String(item.id) === String(params.id)
//   );

//   if (!faculty) {
//     notFound();
//   }

//   return (
//     <main className="min-h-screen bg-slate-50 pt-28 pb-16">
//       <div className="max-w-6xl mx-auto px-6">

//         {/* Back Button */}
//         <Link
//           href="/faculty"
//           className="inline-flex items-center gap-2 mb-6 text-blue-900 font-semibold hover:gap-3 transition-all"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to Faculty Directory
//         </Link>

//         {/* Main Card */}
//         <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">

//           {/* Hero Section */}
//           <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 px-8 py-10">
//             <div className="flex flex-col md:flex-row gap-8 items-center">

//               <img
//                 src={faculty.image}
//                 alt={faculty.name}
//                 className="w-44 h-44 rounded-2xl object-cover border-4 border-white/20"
//               />

//               <div className="text-white">
//                 <h1 className="text-4xl font-bold">
//                   {faculty.name}
//                 </h1>

//                 <p className="text-xl text-blue-100 mt-2">
//                   {faculty.designation}
//                 </p>

//                 <span className="inline-block mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium">
//                   {faculty.department}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Info Cards */}
//           <div className="grid md:grid-cols-2 gap-5 p-8">

//             <div className="bg-slate-50 rounded-2xl p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <Mail className="w-5 h-5 text-blue-900" />
//                 <h3 className="font-semibold">Email</h3>
//               </div>
//               <p>{faculty.email}</p>
//             </div>

//             <div className="bg-slate-50 rounded-2xl p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <MapPin className="w-5 h-5 text-blue-900" />
//                 <h3 className="font-semibold">Cabin Number</h3>
//               </div>
//               <p>{faculty.cabin}</p>
//             </div>

//             <div className="bg-slate-50 rounded-2xl p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <Briefcase className="w-5 h-5 text-blue-900" />
//                 <h3 className="font-semibold">Experience</h3>
//               </div>
//               <p>{faculty.experience}</p>
//             </div>

//             <div className="bg-slate-50 rounded-2xl p-5">
//               <div className="flex items-center gap-3 mb-2">
//                 <Building2 className="w-5 h-5 text-blue-900" />
//                 <h3 className="font-semibold">Department</h3>
//               </div>
//               <p>{faculty.department}</p>
//             </div>

//             {faculty.qualification && (
//               <div className="bg-slate-50 rounded-2xl p-5">
//                 <div className="flex items-center gap-3 mb-2">
//                   <GraduationCap className="w-5 h-5 text-blue-900" />
//                   <h3 className="font-semibold">Qualification</h3>
//                 </div>
//                 <p>{faculty.qualification}</p>
//               </div>
//             )}

//             {faculty.officeHours && (
//               <div className="bg-slate-50 rounded-2xl p-5">
//                 <div className="flex items-center gap-3 mb-2">
//                   <Clock className="w-5 h-5 text-blue-900" />
//                   <h3 className="font-semibold">Office Hours</h3>
//                 </div>
//                 <p>{faculty.officeHours}</p>
//               </div>
//             )}
//           </div>

//           {/* About Section */}
//           <div className="px-8 pb-8">
//             <div className="bg-slate-50 rounded-2xl p-6">
//               <h2 className="text-2xl font-bold mb-4">
//                 About Faculty
//               </h2>

//               <p className="text-slate-600 leading-relaxed">
//                 {faculty.bio}
//               </p>
//             </div>
//           </div>

//           {/* Subjects */}
//           {faculty.subjects && faculty.subjects.length > 0 && (
//             <div className="px-8 pb-8">
//               <div className="bg-slate-50 rounded-2xl p-6">
//                 <h2 className="text-2xl font-bold mb-4">
//                   Subjects Taught
//                 </h2>

//                 <div className="flex flex-wrap gap-3">
//                   {faculty.subjects.map((subject, index) => (
//                     <span
//                       key={index}
//                       className="px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-medium"
//                     >
//                       {subject}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     </main>
//   );
// }


"use client";

import { useState } from "react";
import facultyData from "@/data/faculty.json";
import FacultyCard from "@/components/FacultyCard";
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
