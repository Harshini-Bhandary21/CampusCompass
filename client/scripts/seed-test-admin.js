// One-off script to seed a test department coordinator ("admin" role) so you
// can log in locally and verify the Auth.js v5 migration end to end.
// Usage: node scripts/seed-test-admin.js
//
// Reads MONGODB_URI from .env — never hardcode credentials in this file.

require('dotenv').config()
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const TEST_EMAIL = 'firstyearcrazy@gmail.com'
const TEST_PASSWORD = 'firstyearcrazy'
const TEST_UNIVERSITY = 'MIT Academy of Engineering'
const TEST_DEPARTMENT = 'First Year'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env')
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db()

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12)

    const existing = await db.collection('universities').findOne({
      'departments.coordinator.email': TEST_EMAIL,
    })

    if (existing) {
      await db.collection('universities').updateOne(
        { _id: existing._id, 'departments.coordinator.email': TEST_EMAIL },
        {
          $set: {
            'departments.$.coordinator.passwordHash': passwordHash,
            'departments.$.coordinator.plainPassword': TEST_PASSWORD,
          },
        }
      )
      console.log('Updated existing test coordinator password.')
    } else {
      await db.collection('universities').insertOne({
        name: TEST_UNIVERSITY,
        departments: [
          {
            name: TEST_DEPARTMENT,
            code: 'FY',
            coordinator: {
              email: TEST_EMAIL,
              passwordHash,
              plainPassword: TEST_PASSWORD,
            },
            stats: { students: 0, faculty: 0, classes: 0 },
            vision: 'First Year department vision',
            mission: 'First Year department mission',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
      })
      console.log('Inserted new test university + department + coordinator.')
    }

    console.log('\nLog in with:')
    console.log(`  Email:    ${TEST_EMAIL}`)
    console.log(`  Password: ${TEST_PASSWORD}`)
  } finally {
    await client.close()
  }
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
