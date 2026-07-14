import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { initialsAvatarDataUri } from "@/lib/avatar";
import { Mail, User, GraduationCap, Building2, Phone, MapPin, Briefcase, FlaskConical } from "lucide-react";
import { notFound } from "next/navigation";

async function getTeacher(id) {
  if (!ObjectId.isValid(id)) return null;
  const client = await clientPromise;
  const db = client.db();
  const teacher = await db.collection("teachers").findOne(
    { _id: new ObjectId(id), status: "active" },
    { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
  );
  return teacher;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const teacher = await getTeacher(id);

  if (!teacher) {
    return { title: "Faculty Not Found" };
  }

  return {
    title: teacher.name,
    description: `${teacher.name}, ${teacher.designation} in ${teacher.department}. ${teacher.about || ""}`,
    alternates: { canonical: `/student/facultyinfo/${id}` },
  };
}

export default async function FacultyInfoPage({ params }) {
  const { id } = await params;
  const teacher = await getTeacher(id);

  if (!teacher) {
    notFound();
  }

  const image = teacher.profilePhoto || initialsAvatarDataUri(teacher.name);

  return (
    <div className="min-h-screen pt-32 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 to-emerald-700 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <img
                src={image}
                alt={teacher.name}
                className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20"
              />

              <div>
                <h1 className="text-4xl font-bold">{teacher.name}</h1>
                <p className="text-blue-100 text-lg mt-2">{teacher.designation}</p>
                <span className="inline-block mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
                  {teacher.department}
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
              <p>{teacher.email}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-blue-900" />
                <h3 className="font-semibold">Contact Number</h3>
              </div>
              <p>{teacher.phone || "—"}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="text-blue-900" />
                <span className="font-semibold">Cabin Number</span>
              </div>
              <p>{teacher.cabinNumber || "—"}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="text-blue-900" />
                <span className="font-semibold">Experience</span>
              </div>
              <p>{teacher.experience || "—"}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="text-blue-900" />
                <span className="font-semibold">Department</span>
              </div>
              <p>{teacher.department}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="text-blue-900" />
                <span className="font-semibold">Qualification</span>
              </div>
              <p>{teacher.qualification || "—"}</p>
            </div>
          </div>

          {/* About */}
          <div className="px-8 pb-8">
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-6 h-6 text-blue-900" />
                <h2 className="text-xl font-bold">About Faculty</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">{teacher.about || "No bio provided yet."}</p>
            </div>
          </div>

          {/* Research areas */}
          {teacher.researchAreas?.length > 0 && (
            <div className="px-8 pb-8">
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FlaskConical className="w-6 h-6 text-blue-900" />
                  <h2 className="text-xl font-bold">Research Areas</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teacher.researchAreas.map((area, index) => (
                    <span key={index} className="px-3 py-1 rounded-full bg-blue-100 text-blue-900">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
