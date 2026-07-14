// Minimal CSV parser with header-name sniffing — maps flexible column
// headers (e.g. "Full Name", "Student Name") to the canonical fields the
// bulk-load API expects (name/email/prn/department/semester/designation).
const FIELD_ALIASES = {
  name: ['name', 'fullname', 'studentname', 'facultyname', 'teachername'],
  email: ['email', 'emailaddress', 'mail'],
  prn: ['prn', 'prnnumber', 'rollno', 'rollnumber'],
  department: ['department', 'dept', 'branch'],
  semester: ['semester', 'sem'],
  designation: ['designation', 'title', 'position'],
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) return []

  const headerCells = parseCsvLine(lines[0]).map(normalizeHeader)
  const fieldForColumn = headerCells.map(header => {
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(header)) return field
    }
    return null
  })

  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line)
    const row = {}
    fieldForColumn.forEach((field, idx) => {
      if (field && cells[idx] !== undefined) row[field] = cells[idx]
    })
    return row
  })
}
