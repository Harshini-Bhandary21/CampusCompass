import Link from "next/link";
import { Users, Calendar, BookOpen, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const cards = [
    {
      title: "Faculty Information",
      description: "Browse faculty profiles, cabin numbers and contact details.",
      href: "/student/facultyinfo",
      icon: Users,
    },
    {
      title: "Academic Calendar",
      description: "View upcoming academic events and schedules.",
      href: "#",
      icon: Calendar,
    },
    {
      title: "Timetable",
      description: "View your class schedule and important time-bound information.",
      href: "#",
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Student Dashboard
        </h1>

        <p className="text-slate-600 mt-2">
          Welcome to the MITAOE Student Portal
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-900" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {card.title}
              </h2>

              <p className="text-slate-600 mt-2">
                {card.description}
              </p>

              <div className="flex items-center gap-2 mt-5 text-blue-900 font-semibold">
                Open
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}