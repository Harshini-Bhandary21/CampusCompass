'use client';
import { useState } from 'react';
import Modal from '@/app/components/shared/Modal';

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
    <Modal
      onClose={onCancel}
      title="Online Lecture Configuration"
      subtitle="Select days for online lectures"
      size="xl"
      bodyClassName="p-4 bg-gray-50"
      footer={
        <>
          <button
            onClick={onCancel}
            className="dashboard-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="dashboard-btn-primary flex-1"
          >
            Continue to Next Step →
          </button>
        </>
      }
    >
      {years.map((year, yearIdx) => (
        <div key={year.key} className="mb-3 last:mb-0">
          <div className="bg-white rounded-lg p-3 shadow-lg border-2 border-gray-200 transition-all duration-300 relative overflow-hidden">
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
                      ? 'bg-primary text-white border-2 border-primary'
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
    </Modal>
  );
}
