'use client';

import { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';

export default function PollCreator({ poll, onChange }) {
  const [question, setQuestion] = useState(poll?.question || '');
  const [options, setOptions] = useState(poll?.options || ['', '']);
  const [multiSelect, setMultiSelect] = useState(poll?.multiSelect || false);

  const updatePoll = (q, opts, multi) => {
    onChange({
      question: q,
      options: opts.filter(o => o.trim()),
      multiSelect: multi,
    });
  };

  const addOption = () => {
    if (options.length >= 10) return;
    const newOpts = [...options, ''];
    setOptions(newOpts);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== index);
    setOptions(newOpts);
    updatePoll(question, newOpts, multiSelect);
  };

  const updateOption = (index, value) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
    updatePoll(question, newOpts, multiSelect);
  };

  const updateQuestion = (value) => {
    setQuestion(value);
    updatePoll(value, options, multiSelect);
  };

  const toggleMultiSelect = () => {
    const newMulti = !multiSelect;
    setMultiSelect(newMulti);
    updatePoll(question, options, newMulti);
  };

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <BarChart3 size={18} />
        <span>Create Poll</span>
      </div>

      <input
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => updateQuestion(e.target.value)}
      />

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => removeOption(idx)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        {options.length < 10 && (
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-primary transition-colors"
            onClick={addOption}
          >
            <Plus size={14} /> Add Option
          </button>
        )}
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={multiSelect}
            onChange={toggleMultiSelect}
            className="accent-current text-primary"
          />
          <span>Allow multiple selections</span>
        </label>
      </div>
    </div>
  );
}
