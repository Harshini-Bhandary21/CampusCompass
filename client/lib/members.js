import { ObjectId } from 'mongodb'

// Group/club member references are sent by the client as {id, collection}
// pairs (collection: 'teachers' | 'students') since there's no single
// `users` collection to look ids up against. Resolves each pair to an
// active account snapshot, silently dropping anything that doesn't resolve
// (blocked/deleted/unknown accounts).
export async function resolveActiveMembers(db, memberRefs) {
  if (!memberRefs || memberRefs.length === 0) return []

  const byCollection = { teachers: [], students: [] }
  for (const ref of memberRefs) {
    if (byCollection[ref.collection]) byCollection[ref.collection].push(ref.id)
  }

  const resolved = []

  for (const collection of ['teachers', 'students']) {
    const ids = byCollection[collection]
    if (ids.length === 0) continue
    const docs = await db
      .collection(collection)
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) }, status: 'active' })
      .toArray()
    for (const doc of docs) {
      resolved.push({
        id: doc._id.toString(),
        collection,
        role: collection === 'teachers' ? 'teacher' : 'student',
        name: doc.name,
        email: doc.email,
        isLead: false,
      })
    }
  }

  return resolved
}
