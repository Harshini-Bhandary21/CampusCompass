// One-off migration: port the static data/faculty.json entries into the
// `teachers` collection so faculty can log in and self-manage their profile
// (the Faculty Directory now reads from Mongo, not the JSON file).
//
// Default password policy matches the rest of the app: teacher password =
// their email address. Faculty can change it from their Profile tab once
// they've logged in, or an admin can set a new one via User Management.
//
// Usage: node scripts/migrate-faculty-json.js

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const UNIVERSITY = 'MIT Academy of Engineering'
const DEPARTMENT = 'First Year'

function extractEmail(raw) {
  if (!raw) return null
  // Some entries embed literal markdown links, e.g. "[a@b.com](mailto:a@b.com), [c@d.com](mailto:c@d.com)"
  const match = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0].toLowerCase() : null
}

function encodeImage(imagePath) {
  if (!imagePath) return null
  const abs = path.join(__dirname, '..', 'public', imagePath.replace(/^\//, ''))
  if (!fs.existsSync(abs)) return null
  const ext = path.extname(abs).slice(1).toLowerCase()
  const mime = ext === 'jpg' ? 'jpeg' : ext
  const base64 = fs.readFileSync(abs).toString('base64')
  return `data:image/${mime};base64,${base64}`
}

async function migrate() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set in .env')

  const facultyData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'faculty.json'), 'utf-8'))

  const client = new MongoClient(uri)
  let migrated = 0
  let skipped = 0

  try {
    await client.connect()
    const db = client.db()

    for (const entry of facultyData) {
      const email = extractEmail(entry.email)
      if (!email) {
        console.warn(`Skipping "${entry.name}" — could not extract a valid email from "${entry.email}"`)
        skipped++
        continue
      }

      const existing = await db.collection('teachers').findOne({ email })
      if (existing) {
        console.log(`Skipping "${entry.name}" — a teacher with email ${email} already exists`)
        skipped++
        continue
      }

      const passwordHash = await bcrypt.hash(email, 12)
      const now = new Date()

      await db.collection('teachers').insertOne({
        name: entry.name,
        email,
        passwordHash,
        department: DEPARTMENT,
        university: UNIVERSITY,
        status: 'active',
        profilePhoto: encodeImage(entry.image),
        phone: entry.contact_no || '',
        designation: entry.designation || '',
        cabinNumber: entry.cabin || '',
        about: entry.overview || '',
        qualification: entry.qualification || '',
        experience: entry.experience || '',
        researchAreas: entry.research_areas || [],
        createdBy: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        createdAt: now,
        updatedAt: now,
      })

      migrated++
      console.log(`Migrated "${entry.name}" (${email})`)
    }

    console.log(`\nDone: ${migrated} migrated, ${skipped} skipped.`)
  } finally {
    await client.close()
  }
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})
