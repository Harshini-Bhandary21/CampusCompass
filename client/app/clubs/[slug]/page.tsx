import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Trophy, Award, Mail, Phone, BookOpen, Star, CheckCircle, ShieldCheck } from "lucide-react";
import clubsData from "@/data/clubs.json";
import eventsData from "@/data/events.json";
import { Club, Event } from "@/lib/types";
import { generateFallbackSVG, getClubImage } from "@/lib/imageMap";
import FallbackImage from "@/components/FallbackImage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const clubs = clubsData as Club[];
  return clubs.map((club) => ({
    slug: club.slug,
  }));
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const clubs = clubsData as Club[];
  const club = clubs.find((c) => c.slug === slug);

  if (!club) {
    notFound();
  }

  const events = eventsData as Event[];
  const clubEvents = events.filter((e) => e.club.toLowerCase() === club.id.toLowerCase());
  const fallbackSVG = generateFallbackSVG(club.name, club.category);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Back button */}
      <div>
        <Link
          href="/clubs"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors group font-semibold"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Clubs
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-200 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center justify-between">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/5 rounded-bl-full filter blur-xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
          {/* Mapped SVG Fallback illustration */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-lg bg-white p-4 flex items-center justify-center">
            <FallbackImage
              src={getClubImage(club.id) || fallbackSVG}
              fallbackSrc={fallbackSVG}
              alt={club.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="text-center md:text-left">
            <span className="px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase rounded-full bg-blue-50 border border-blue-200 text-blue-700 mb-4 inline-block">
              {club.category} Society
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-2">
              {club.name}
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-xl font-semibold leading-relaxed">
              {club.fullName}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-12">
          <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Established</span>
            <span className="text-slate-900 font-display font-extrabold text-lg">{club.established}</span>
          </div>
          <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Members</span>
            <span className="text-slate-900 font-display font-extrabold text-lg">{club.memberCount || "50+"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left main: About, Salient Features, Events, Achievements */}
        <div className="lg:col-span-2 flex flex-col gap-12">
          {/* About description */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200">
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-slate-600" />
              About Club
            </h2>
            <div className="text-sm md:text-base text-slate-700 font-medium leading-relaxed space-y-4 whitespace-pre-line">
              {club.description}
            </div>
          </div>

          {/* Salient Features checklist */}
          {club.salientFeatures && club.salientFeatures.length > 0 && (
            <div className="glass-card p-8 rounded-2xl border border-slate-200">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                Salient Features
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {club.salientFeatures.map((feature, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 font-medium items-start">
                    <CheckCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {club.achievements && club.achievements.length > 0 && (
            <div className="glass-card p-8 rounded-2xl border border-slate-200">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Key Achievements
              </h2>
              <ul className="space-y-4">
                {club.achievements.map((achievement, i) => (
                  <li key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600 shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-800 font-semibold leading-relaxed">{achievement}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: Leadership and Club Events */}
        <div className="flex flex-col gap-12">
          {/* Leadership Module */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200 flex flex-col gap-6">
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2.5">
              <Award className="w-5 h-5 text-blue-600" />
              Club Leadership
            </h2>

            {/* Faculty Advisor */}
            {club.facultyAdvisor && club.facultyAdvisor.name && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-blu-600 uppercase mb-2">
                  <Star className="w-3.5 h-3.5 fill-blue-600/10" />
                  Faculty Advisor
                </div>
                <h3 className="text-slate-900 font-display font-bold text-base">{club.facultyAdvisor.name}</h3>
                {club.facultyAdvisor.department && (
                  <p className="text-xs text-slate-500 mt-1">{club.facultyAdvisor.department}</p>
                )}
                {club.facultyAdvisor.email && (
                  <a
                    href={`mailto:${club.facultyAdvisor.email}`}
                    className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors mt-3 pt-3 border-t border-slate-200"
                  >
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="truncate">{club.facultyAdvisor.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Student President */}
            {club.president && club.president.name && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-cyan-600 uppercase mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Student Coordinator
                </div>
                <h3 className="text-slate-900 font-display font-bold text-base">{club.president.name}</h3>
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-200">
                  {club.president.email && (
                    <a
                      href={`mailto:${club.president.email}`}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-cyan-600" />
                      <span className="truncate">{club.president.email}</span>
                    </a>
                  )}
                  {club.president.phone && (
                    <a
                      href={`tel:${club.president.phone}`}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-cyan-600" />
                      <span>{club.president.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Club Specific Events */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-blue-600" />
              Club Events
            </h2>

            {clubEvents.length > 0 ? (
              <div className="flex flex-col gap-4">
                {clubEvents.map((evt) => (
                  <div key={evt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group">
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      evt.status === "upcoming" ? "bg-black-50 text-black-700 border border-purple-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {evt.status}
                    </span>
                    <h3 className="text-slate-900 font-bold text-sm leading-tight pr-12 group-hover:text-purple-600 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">{evt.date}</p>
                    <p className="text-xs text-slate-600 font-medium mt-2 line-clamp-2">{evt.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">No specific events logged.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}