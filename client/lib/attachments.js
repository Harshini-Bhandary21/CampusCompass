// Attachments/photos are stored as base64 strings directly inside MongoDB
// documents (matching the precedent already set by
// app/api/coordinators/get-department/route.js for timetable Excel blobs).
// These are separate small documents rather than one shared university doc,
// so the ceiling is more generous, but still capped well under Mongo's 16MB
// per-document limit.
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024 // 5MB per file, matches the client-side cap
export const MAX_TOTAL_ATTACHMENTS_BYTES = 12 * 1024 * 1024 // total per document

export function base64ByteLength(base64) {
  if (!base64) return 0
  const commaIndex = base64.indexOf(',')
  const raw = commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64
  return Math.round((raw.length * 3) / 4)
}

// Returns an error message string if attachments are too large, else null.
export function validateAttachmentSizes(attachments) {
  if (!attachments || attachments.length === 0) return null

  let total = 0
  for (const att of attachments) {
    const bytes = base64ByteLength(att.data)
    if (bytes > MAX_ATTACHMENT_BYTES) {
      return `"${att.name}" is too large (${Math.round(bytes / 1024 / 1024)}MB). Max ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB per file.`
    }
    total += bytes
  }

  if (total > MAX_TOTAL_ATTACHMENTS_BYTES) {
    return `Attachments are too large combined (${Math.round(total / 1024 / 1024)}MB). Max ${Math.round(MAX_TOTAL_ATTACHMENTS_BYTES / 1024 / 1024)}MB total.`
  }

  return null
}
