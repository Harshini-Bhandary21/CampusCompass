import facultyData from "@/data/faculty.json";
import { Mail,User,GraduationCap, Building2, Phone, MapPin, Briefcase,FlaskConical } from "lucide-react";
import { notFound } from "next/navigation";

export default async function FacultyInfoPage({ params }) {
  const { id } = await params;

  const faculty = facultyData.find(
    (item) => String(item.id) === String(id)
  );

  if (!faculty) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              <img
                src={faculty.image}
                alt={faculty.name}
                className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20"
              />

              <div>
                <h1 className="text-4xl font-bold">
                  {faculty.name}
                </h1>

                <p className="text-blue-100 text-lg mt-2">
                  {faculty.designation}
                </p>

                <span className="inline-block mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
                  {faculty.department}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-8 grid md:grid-cols-2 gap-6">

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="text-blue-900" />
                <span className="font-semibold">Email</span>
              </div>

              <p>{faculty.email}</p>
            </div>
             <div className="bg-slate-50 rounded-2xl p-5">
  <div className="flex items-center gap-3 mb-2">
    <Phone className="w-5 h-5 text-blue-900" />
    <h3 className="font-semibold">Contact Number</h3>
  </div>

  <p>{faculty.contact_no}</p>
</div>
            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="text-blue-900" />
                <span className="font-semibold">Cabin Number</span>
              </div>

              <p>{faculty.cabin}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="text-blue-900" />
                <span className="font-semibold">Experience</span>
              </div>

              <p>{faculty.experience}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="text-blue-900" />
                <span className="font-semibold">Department</span>
              </div>

              <p>{faculty.department}</p>
            </div>
          </div>

   </div>
          <div className="bg-slate-50 rounded-2xl p-5">
  <div className="flex items-center gap-3 mb-3">
    <GraduationCap className="text-blue-900" />
    <span className="font-semibold">Qualification</span>
  </div>

  <p>{faculty.qualification}</p>
</div>

          {/* About */}
          <div className="px-8 pb-8">
            <div className="bg-slate-50 rounded-2xl p-6">
                <User className="w-6 h-6 text-blue-900" />
  <h2 className="text-xl font-bold">
    About Faculty
  </h2>

              <p className="text-slate-600 leading-relaxed">
                {faculty.overview}
              </p>
            </div>
          {/* </div>
           <div className="bg-slate-50 rounded-2xl p-5">
  <div className="flex items-center gap-3 mb-3">
    <Building2 className="text-blue-900" />
    <span className="font-semibold">Qualification</span>
  </div>

  <p>{faculty.qualification}</p>
</div> */}

<div className="px-8 pb-8">
  <div className="bg-slate-50 rounded-2xl p-6">
    <FlaskConical className="w-6 h-6 text-blue-900" />
  <h2 className="text-xl font-bold">
    Research Areas
  </h2>

    <div className="flex flex-wrap gap-2">
      {faculty.research_areas?.map((area, index) => (
        <span
          key={index}
          className="px-3 py-1 rounded-full bg-blue-100 text-blue-900"
        >
          {area}
        </span>
      ))}
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}