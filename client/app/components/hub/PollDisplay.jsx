'use client';

import { BarChart3, Check } from 'lucide-react';

export default function PollDisplay({ poll, userId, onVote }) {
  if (!poll || !poll.question) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const userVotedOptions = poll.options
    .filter(opt => opt.votes?.some(v => v === userId || v.toString?.() === userId))
    .map(opt => opt._id);
  const hasVoted = userVotedOptions.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <BarChart3 size={18} className="text-primary" />
        <span>{poll.question}</span>
        {poll.multiSelect && (
          <span className="ml-1 text-[10px] font-medium uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Multi-select
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = userVotedOptions.includes(opt._id);

          return (
            <button
              key={opt._id}
              type="button"
              onClick={() => onVote(opt._id)}
              className={`relative w-full overflow-hidden rounded-lg border text-left transition-colors ${
                isSelected ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-1 text-sm text-gray-800">
                  {isSelected && <Check size={14} className="text-primary" />}
                  {opt.text}
                </span>
                <span className="text-xs text-gray-500">
                  {voteCount} {voteCount === 1 ? 'vote' : 'votes'} &middot; {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-xs text-gray-500">
        {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
        {hasVoted && <span className="text-primary font-medium"> &middot; You voted</span>}
      </div>
    </div>
  );
}
