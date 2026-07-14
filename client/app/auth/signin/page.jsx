'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoginForm from '../../components/auth/LoginForm'

const DASHBOARD_BY_ROLE = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

const STATUS_MESSAGES = {
  blocked: 'This account has been suspended. Contact your department coordinator for help.',
  deleted: 'This account is no longer active.',
}

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

    if (result?.error) {
      let message = 'Invalid email or password'
      try {
        const statusRes = await fetch('/api/auth/status-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const { status } = await statusRes.json()
        if (STATUS_MESSAGES[status]) message = STATUS_MESSAGES[status]
      } catch {
        // fall back to the generic message below
      }
      setError(message)
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

    router.push(DASHBOARD_BY_ROLE[session.user.role] || '/')
  }

  return (
    <div className="min-h-screen">
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
