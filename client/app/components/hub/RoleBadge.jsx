'use client';

const ROLE_CONFIG = {
  admin: { label: 'Admin', className: 'role-badge-admin' },
  teacher: { label: 'Teacher', className: 'role-badge-teacher' },
  student: { label: 'Student', className: 'role-badge-student' },
  clubLead: { label: 'Club Lead', className: 'role-badge-clubLead' },
}

export default function RoleBadge({ role }) {
  const { label, className } = ROLE_CONFIG[role] || { label: role, className: 'role-badge-default' }

  return (
    <span className={`role-badge ${className}`}>
      {label}
    </span>
  )
}
