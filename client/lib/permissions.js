import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Get the current session server-side
export async function getSession() {
  return await auth()
}

// Require authentication - throws if not logged in
export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

// Role checks
export function isAdmin(session) {
  return session?.user?.role === 'admin'
}

export function isTeacher(session) {
  return session?.user?.role === 'teacher'
}

export function isStudent(session) {
  return session?.user?.role === 'student'
}

// Require specific roles
export async function requireAdmin() {
  const session = await requireAuth()
  if (!isAdmin(session)) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function requireTeacher() {
  const session = await requireAuth()
  if (!isTeacher(session)) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function requireAdminOrTeacher() {
  const session = await requireAuth()
  if (!isAdmin(session) && !isTeacher(session)) {
    throw new Error('FORBIDDEN')
  }
  return session
}

// Every person-reference stored on a document (group/club member, message
// sender, announcement author, notification recipient) is a denormalized
// {id, collection, ...} snapshot rather than a Mongoose ref — there's no
// single `users` collection to populate against (admin lives inside
// universities.departments[].coordinator, teacher/student have their own
// collections). This resolves "who is the current session, as a
// snapshot-comparable identity" once, so callers never compare bare ids
// across collections.
export function identityOf(session) {
  const role = session?.user?.role
  const id = session?.user?.id
  if (!role || !id) return null
  const collection = role === 'admin' ? 'admin' : role === 'teacher' ? 'teachers' : role === 'student' ? 'students' : null
  return collection ? { id, collection } : null
}

// Like identityOf, but throws a clean, mappable error instead of returning
// null. A missing id/role on an authenticated session means the JWT
// predates a session-shape change (e.g. was minted before `id` was added to
// the token) — the fix is re-authenticating, not silently degrading, so
// routes that need an identity should call this instead of identityOf.
export function requireIdentity(session) {
  const identity = identityOf(session)
  if (!identity) {
    throw new Error('STALE_SESSION')
  }
  return identity
}

// Group permission helpers
export function isGroupMember(group, session) {
  const me = identityOf(session)
  if (!me) return false
  return group.members?.some(m => m.id === me.id && m.collection === me.collection)
}

export function isGroupLead(group, session) {
  const me = identityOf(session)
  if (!me) return false
  return group.members?.some(m => m.id === me.id && m.collection === me.collection && m.isLead)
}

export function canMessageInGroup(group, session) {
  const role = session?.user?.role

  // Admin can always message
  if (role === 'admin') return true

  // Teacher members of the group can always message
  if (role === 'teacher' && isGroupMember(group, session)) return true

  // In open mode, any member can message
  if (group.messagingMode === 'open' && isGroupMember(group, session)) return true

  // In restricted mode, only teachers + student leads can message
  if (group.messagingMode === 'restricted') {
    if (role === 'teacher' && isGroupMember(group, session)) return true
    if (isGroupLead(group, session)) return true
  }

  return false
}

// Club permission helpers
export function isClubCoordinator(club, session) {
  const me = identityOf(session)
  if (!me || !club.facultyCoordinator) return false
  return club.facultyCoordinator.id === me.id
}

export function isClubLead(club, session) {
  const me = identityOf(session)
  if (!me || !club.studentLead) return false
  return club.studentLead.id === me.id
}

// Helper to create API error responses
export function apiError(message, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

// Helper to handle permission errors
export function handleAuthError(error) {
  if (error.message === 'UNAUTHORIZED') {
    return apiError('Not authenticated', 401)
  }
  if (error.message === 'FORBIDDEN') {
    return apiError('Not authorized', 403)
  }
  if (error.message === 'STALE_SESSION') {
    return apiError('Your session is out of date — please sign out and sign in again', 401)
  }
  console.error('API Error:', error)
  return apiError(error.message || 'Internal server error', 500)
}
