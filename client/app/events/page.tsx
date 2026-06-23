"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Filter } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import EventCard from "@/components/EventCard";
import eventsData from "@/data/events.json";
import { Event } from "@/lib/types";

const events = eventsData as Event[];
const FILTERS = ["all", "upcoming", "past"];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredEvents = events.filter((event) => {
    if (activeFilter === "all") return true;
    return event.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Header */}
      <SectionHeader
        badge="MITAOE Events"
        title="Campus Gatherings & Battles"
        subtitle="Stay updated with upcoming hackathons, tech sprints, cultural performance stages, and recreational sports meets hosted by MITAOE clubs."
        theme="cyan"
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-slate-200 backdrop-blur-md w-full">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="w-4 h-4 text-cyan-600" />
          Filter Events
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid list */}
      <motion.div
        layout
        className="flex flex-col gap-8 w-full min-h-[400px]"
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              key={event.id}
            >
              <EventCard event={event} index={idx} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card rounded-2xl border border-slate-200"
        >
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-slate-900 font-display font-bold text-lg mb-1">No events found</h3>
          <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
            There are currently no events logged in this category. Check back later for upcoming club plans!
          </p>
        </motion.div>
      )}
    </div>
  );
}
