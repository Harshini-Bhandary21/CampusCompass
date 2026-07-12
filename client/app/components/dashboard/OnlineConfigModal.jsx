'use client';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function OnlineConfigModal({ onSubmit, onCancel }) {
  const [config, setConfig] = useState({
    FY: [0, 0, 0, 0, 0, 0],
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (year, dayIndex) => {
    setConfig(prev => ({
      ...prev,
      [year]: prev[year].map((val, idx) => idx === dayIndex ? (val === 1 ? 0 : 1) : val)
    }));
  };

  const years = [{ key: 'FY', label: 'First Year', days: days }];

  if (years.length === 0) {
    onSubmit({});
    return null;
  }

  const handleSubmit = () => {
    const filteredConfig = {};
    years.forEach(year => {
      filteredConfig[year.key] = config[year.key].slice(0, year.days.length);
    });
    onSubmit(filteredConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-primary transform transition-all">
        {/* Header */}
        <div className="bg-primary text-white p-4 relative overflow-hidden">
          <svg className="absolute top-0 right-0 w-32 h-32 text-white/5 -mr-16 -mt-16" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-0 left-0 w-24 h-24 text-white/5 -ml-12 -mb-12" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/2 right-10 w-16 h-16 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors z-10"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 relative z-10">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-base font-semibold">Online Lecture Configuration</h2>
              <p className="text-white/80 text-xs mt-0.5">Select days for online lectures</p>
            </div>
            <svg className="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-160px)] bg-gray-50">
          {years.map((year, yearIdx) => (
            <div key={year.key} className="mb-3 last:mb-0">
              <div className="bg-white rounded-lg p-3 shadow-lg border-2 border-gray-200 transition-all duration-300 relative overflow-hidden">
                <svg className="absolute top-0 right-0 w-20 h-20 text-primary/5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
                      {yearIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{year.label}</h3>
                      <p className="text-[10px] text-gray-500">Configure online days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded-md shadow-md">
                      {config[year.key].slice(0, year.days.length).filter(v => v === 1).length} Online
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap relative z-10">
                  {year.days.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(year.key, idx)}
                      className={`px-4 py-2 rounded-md font-semibold text-xs transition-all shadow-md ${
                        config[year.key][idx] === 1
                          ? 'bg-primary text-white shadow-[0_4px_12px_rgba(124,58,237,0.4)] border-2 border-primary'
                          : 'bg-white text-gray-700 border-2 border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white p-3 border-t-4 border-gray-200 flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md font-medium text-xs border-2 border-gray-400 transition-all text-gray-700 shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-md font-medium text-xs shadow-lg transition-all border-2 border-primary flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Continue to Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}
