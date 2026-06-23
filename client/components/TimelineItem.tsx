// "use client";

// import { motion } from "framer-motion";
// import { Trophy, Calendar, User } from "lucide-react";
// import { Achievement } from "@/lib/types";
// import { cn } from "@/lib/utils";

// interface TimelineItemProps {
//   item: Achievement;
//   index: number;
// }

// export default function TimelineItem({ item, index }: TimelineItemProps) {
//   const isEven = index % 2 === 0;

//   return (
//     <div className="relative flex flex-col md:flex-row items-stretch md:justify-center w-full mb-12 group">
//       {/* Center Timeline Node Line for Desktop */}
//       <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-slate-200 group-last:bg-gradient-to-b group-last:from-slate-200 group-last:to-transparent flex items-center justify-center">
//         {/* Node Circle */}
//         <motion.div
//           initial={{ scale: 0.8, opacity: 0 }}
//           whileInView={{ scale: 1, opacity: 1 }}
//           viewport={{ once: true, margin: "-50px" }}
//           transition={{ duration: 0.3, delay: 0.05 }}
//           className={cn(
//             "absolute top-6 w-5 h-5 rounded-full border-4 border-[#f6f8fc] z-10 shadow-md flex items-center justify-center",
//             item.category === "technical" && "bg-cyan-500",
//             item.category === "cultural" && "bg-purple-500",
//             item.category === "recreational" && "bg-emerald-500"
//           )}
//         />
//       </div>

//       {/* Left Column — visible only on desktop for even-indexed items */}
//       <div className={cn(
//         "hidden md:flex flex-col justify-start w-1/2 pr-12 text-right",
//         isEven ? "opacity-100" : "opacity-0 pointer-events-none"
//       )}>
//         {isEven && <TimelineContent item={item} isEven={true} />}
//       </div>

//       {/* Right Column — always visible on mobile, visible for odd items on desktop */}
//       <div className={cn(
//         "flex flex-col justify-start w-full md:w-1/2 pl-10 md:pl-12 text-left",
//         !isEven ? "opacity-100" : "md:opacity-0 md:pointer-events-none"
//       )}>
//         {/* On mobile: show for even items (since left column is hidden). On desktop: show for odd items */}
//         <div className={cn(
//           isEven ? "block md:hidden" : "block"
//         )}>
//           <TimelineContent item={item} isEven={false} />
//         </div>
//       </div>
//     </div>
//   );
// }

// function TimelineContent({ item, isEven }: { item: Achievement; isEven: boolean }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, x: isEven ? -20 : 20 }}
//       whileInView={{ opacity: 1, x: 0 }}
//       viewport={{ once: true, margin: "-50px" }}
//       transition={{ duration: 0.4, ease: "easeOut" }}
//       className="glass-card p-6 md:p-8 rounded-2xl border border-slate-200 relative"
//     >
//       {/* Glow border element */}
//       <div className="absolute inset-0 border border-transparent rounded-2xl pointer-events-none group-hover:border-purple-500/20 transition-colors duration-300" />

//       {/* Year badge */}
//       <span className={cn(
//         "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4",
//         item.category === "technical" && "bg-cyan-50 border border-cyan-200 text-cyan-700",
//         item.category === "cultural" && "bg-purple-50 border border-purple-200 text-purple-700",
//         item.category === "recreational" && "bg-emerald-50 border border-emerald-200 text-emerald-700"
//       )}>
//         <Calendar className="w-3.5 h-3.5" />
//         AY {item.year}
//       </span>

//       {/* Achievement title */}
//       <h3 className="text-slate-900 font-display font-extrabold text-lg md:text-xl mb-3 leading-snug group-hover:text-purple-600 transition-colors">
//         {item.title}
//       </h3>

//       {/* Student/Winner details */}
//       <div className={cn(
//         "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-semibold mb-4",
//         isEven ? "md:justify-end" : "justify-start"
//       )}>
//         <span className="flex items-center gap-1">
//           <User className="w-3.5 h-3.5 text-purple-600" />
//           {item.student}
//         </span>
//         <span className="flex items-center gap-1">
//           <Trophy className="w-3.5 h-3.5 text-yellow-600" />
//           Club: <span className="text-slate-800 font-bold uppercase">{item.club}</span>
//         </span>
//       </div>

//       <p className="text-sm text-slate-600 font-medium leading-relaxed font-sans">
//         {item.description}
//       </p>
//     </motion.div>
//   );
// }



"use client";

import { motion } from "framer-motion";
import { Trophy, Calendar, User } from "lucide-react";
import { Achievement } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  item: Achievement;
  index: number;
}

export default function TimelineItem({ item, index }: TimelineItemProps) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative flex flex-col md:flex-row items-stretch md:justify-center w-full mb-12 group">
      {/* Center Timeline Node Line for Desktop */}
      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-slate-200 group-last:bg-gradient-to-b group-last:from-slate-200 group-last:to-transparent flex items-center justify-center">
        {/* Node Circle */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className={cn(
            "absolute top-6 w-5 h-5 rounded-full border-4 border-[#f6f8fc] z-10 shadow-md flex items-center justify-center",
            item.category === "technical" && "bg-cyan-500",
            item.category === "cultural" && "bg-purple-500",
            item.category === "recreational" && "bg-emerald-500"
          )}
        />
      </div>

      {/* Left Column — visible only on desktop for even-indexed items */}
      <div className={cn(
        "hidden md:flex flex-col justify-start w-1/2 pr-12 text-right",
        isEven ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {isEven && <TimelineContent item={item} isEven={true} />}
      </div>

      {/* Right Column — always visible on mobile, visible for odd items on desktop */}
      <div className={cn(
        "flex flex-col justify-start w-full md:w-1/2 pl-10 md:pl-12 text-left",
        !isEven ? "opacity-100" : "md:opacity-0 md:pointer-events-none"
      )}>
        {/* On mobile: show for even items (since left column is hidden). On desktop: show for odd items */}
        <div className={cn(
          isEven ? "block md:hidden" : "block"
        )}>
          <TimelineContent item={item} isEven={false} />
        </div>
      </div>
    </div>
  );
}

function TimelineContent({ item, isEven }: { item: Achievement; isEven: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card p-6 md:p-8 rounded-2xl border border-slate-200 relative"
    >
      {/* Glow border element */}
      <div className="absolute inset-0 border border-transparent rounded-2xl pointer-events-none group-hover:border-purple-500/20 transition-colors duration-300" />

      {/* Year badge */}
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4",
        item.category === "technical" && "bg-cyan-50 border border-cyan-200 text-cyan-700",
        item.category === "cultural" && "bg-purple-50 border border-purple-200 text-purple-700",
        item.category === "recreational" && "bg-emerald-50 border border-emerald-200 text-emerald-700"
      )}>
        <Calendar className="w-3.5 h-3.5" />
        AY {item.year}
      </span>

      {/* Achievement title */}
      <h3 className="text-slate-900 font-display font-extrabold text-lg md:text-xl mb-3 leading-snug group-hover:text-purple-600 transition-colors">
        {item.title}
      </h3>

      {/* Student/Winner details */}
      <div className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-semibold mb-4",
        isEven ? "md:justify-end" : "justify-start"
      )}>
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-purple-600" />
          {item.student}
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-600" />
          Club: <span className="text-slate-800 font-bold uppercase">{item.club}</span>
        </span>
      </div>

      <p className="text-sm text-slate-600 font-medium leading-relaxed font-sans">
        {item.description}
      </p>
    </motion.div>
  );
}

