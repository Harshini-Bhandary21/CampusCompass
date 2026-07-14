'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: 'Never (permanent)', value: 'never' },
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
  { label: '3 Days', value: '3d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
];

export function calculateExpiryDate(value) {
  if (!value || value === 'never') return null;

  const now = new Date();
  switch (value) {
    case '1h': return new Date(now.getTime() + 1 * 60 * 60 * 1000);
    case '6h': return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '3d': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1m': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export function getExpiryLabel(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Expires in < 1 hour';
  if (hours < 24) return `Expires in ${hours}h`;
  if (days < 7) return `Expires in ${days}d`;
  if (days < 30) return `Expires in ${Math.floor(days / 7)}w`;
  return `Expires in ${Math.floor(days / 30)}mo`;
}

export default function ExpirySelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = EXPIRY_OPTIONS.find(o => o.value === (value || 'never')) || EXPIRY_OPTIONS[0];
  const hasExpiry = value && value !== 'never';

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Auto-delete: ${selectedOption.label}`}
        className={`dashboard-chip ${hasExpiry ? 'dashboard-chip-active' : 'dashboard-chip-muted'}`}
      >
        <Clock size={16} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[170px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">
            Auto-Delete After
          </div>
          {EXPIRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                value === opt.value ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
