'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShieldCheckIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import RoleSelection from '../../components/auth/RoleSelection'
import LoginForm from '../../components/auth/LoginForm'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const userResponse = await fetch('/api/auth/session')
    const session = await userResponse.json()

    if (!session?.user?.role) {
      setError('Session error. Please try again.')
      setLoading(false)
      return
    }

    if (session.user.role !== selectedRole) {
      const roleLabels = { student: 'Student', teacher: 'Teacher', admin: 'Admin' }
      setError(`Invalid credentials for ${roleLabels[selectedRole] || selectedRole}. Please select the correct role.`)
      setLoading(false)
      return
    }

    if (session.user.role === 'admin') {
      router.push('/firstyear/dashboard')
    } else if (session.user.role === 'teacher') {
      router.push('/teacher/dashboard')
    } else if (session.user.role === 'student') {
      router.push('/student/dashboard')
    }
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleBack = () => {
    setSelectedRole(null)
    setEmail('')
    setPassword('')
    setError('')
  }

  if (!selectedRole) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />
  }

  const roleConfigs = {
    student: {
      title: 'Student Portal',
      subtitle: 'Student Dashboard',
      icon: AcademicCapIcon,
      gradient: 'from-blue-600 to-blue-700',
      description: 'Access your timetable, course progress, and academic analytics.',
      emailPlaceholder: 'student@mitaoe.ac.in',
      helpTitle: 'Student Access',
      helpText: 'Use your registered student email and password.'
    },
    teacher: {
      title: 'Teacher Portal',
      subtitle: 'Teacher Dashboard',
      icon: UserGroupIcon,
      gradient: 'from-purple-600 to-purple-700',
      description: 'View your teaching schedule, track lectures, and access student analytics.',
      emailPlaceholder: 'faculty@mitaoe.ac.in',
      helpTitle: 'Teacher Access',
      helpText: 'Use your registered faculty email and password.'
    },
    admin: {
      title: 'Admin Portal',
      subtitle: 'Department Management Dashboard',
      icon: ShieldCheckIcon,
      gradient: 'from-teal-600 to-teal-700',
      description: 'Schedule generation, faculty coordination, and resource optimization for your department.',
      emailPlaceholder: 'admin@department.edu',
      helpTitle: 'Admin Access',
      helpText: 'Use the credentials provided for your department.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-purple-100/50"></div>
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loading}
        onSubmit={handleSubmit}
        onBack={handleBack}
        config={roleConfigs[selectedRole]}
      />
    </div>
  )
}
