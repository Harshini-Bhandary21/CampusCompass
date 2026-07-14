// Helpers for resolving "who should be notified" across the teachers/students
// split (there's no single `users` collection to query, unlike HUB) and for
// writing the resulting notification documents.

// Resolve every active teacher/student that should be notified for a given
// announcement target, excluding the author themselves.
export async function resolveTargetRecipients(db, { department, target, targetDepartment, excludeId }) {
  const dept = target === 'department' ? (targetDepartment || department) : department
  const baseFilter = { status: 'active', department: dept }

  const wantsTeachers = target === 'all' || target === 'teachers' || target === 'department'
  const wantsStudents = target === 'all' || target === 'students' || target === 'department'

  const recipients = []

  if (wantsTeachers) {
    const teachers = await db.collection('teachers').find(baseFilter).project({ _id: 1 }).toArray()
    for (const t of teachers) {
      const id = t._id.toString()
      if (id !== excludeId) recipients.push({ id, collection: 'teachers' })
    }
  }

  if (wantsStudents) {
    const students = await db.collection('students').find(baseFilter).project({ _id: 1 }).toArray()
    for (const s of students) {
      const id = s._id.toString()
      if (id !== excludeId) recipients.push({ id, collection: 'students' })
    }
  }

  return recipients
}

export async function insertNotifications(db, recipients, { type, referenceId, message }) {
  if (!recipients || recipients.length === 0) return
  const now = new Date()
  await db.collection('notifications').insertMany(
    recipients.map(r => ({
      recipient: { id: r.id, collection: r.collection },
      type,
      referenceId,
      message,
      isRead: false,
      createdAt: now,
    }))
  )
}
