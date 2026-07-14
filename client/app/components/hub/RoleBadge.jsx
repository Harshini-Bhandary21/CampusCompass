'use client';

const ROLE_CONFIG = {
  admin: { label: 'Admin', className: 'bg-teal-100 text-teal-700' },
  teacher: { label: 'Teacher', className: 'bg-purple-100 text-purple-700' },
  student: { label: 'Student', className: 'bg-blue-100 text-blue-700' },
  clubLead: { label: 'Club Lead', className: 'bg-amber-100 text-amber-700' },
}

export default function RoleBadge({ role }) {
  const { label, className } = ROLE_CONFIG[role] || { label: role, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  )
}
