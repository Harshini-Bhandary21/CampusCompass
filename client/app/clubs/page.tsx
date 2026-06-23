"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Grid, X } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import ClubCard from "@/components/ClubCard";
import clubsData from "@/data/clubs.json";
import { Club } from "@/lib/types";

const clubs = clubsData as Club[];
const CATEGORIES = ["all", "technical", "cultural", "recreational"];

export default function ClubsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.salientFeatures &&
        club.salientFeatures.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory =
      activeCategory === "all" || club.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Header */}
      <SectionHeader
        badge="MITAOE Clubs"
        title="Student-Led Communities"
        subtitle="Explore our 25 student clubs across technical, cultural, and recreational domains. Join a community, learn new skills, and shape your campus experience."
        theme="blue"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white/5 p-6 rounded-2xl border border-slate-200 backdrop-blur-md w-full">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, tags, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 rounded-full hover:bg-black/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block mr-2" />
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === category
                  ? "bg-slate-600 text-white shadow-md shadow-slate-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Stats overlay */}
      <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 self-start">
        <Grid className="w-3.5 h-3.5" />
        Showing {filteredClubs.length} of {clubs.length} clubs
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full min-h-[400px]"
      >
        <AnimatePresence mode="popLayout">
          {filteredClubs.map((club, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={club.id}
            >
              <ClubCard club={club} index={idx} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredClubs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-card rounded-2xl border border-slate-200"
        >
          <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-slate-900 font-display font-bold text-lg mb-1">No clubs found</h3>
          <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
            We couldn't find any student communities matching your query. Try checking your spelling or clear the search filters.
          </p>
        </motion.div>
      )}
    </div>
  );
}