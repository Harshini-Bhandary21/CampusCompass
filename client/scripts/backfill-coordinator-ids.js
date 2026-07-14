// One-off migration: give every department coordinator subdocument a stable,
// unique _id. Previously session.user.id for admins was set to the parent
// university document's _id (client/auth.js), so every coordinator under the
// same university shared one session identity. Run this once before deploying
// the auth.js change that reads department.coordinator._id.
//
// Usage: node scripts/backfill-coordinator-ids.js

require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')

async function backfill() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env')
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db()

    const universities = await db.collection('universities').find({}).toArray()

    let universitiesTouched = 0
    let coordinatorsBackfilled = 0

    for (const university of universities) {
      let changed = false
      const departments = (university.departments || []).map(department => {
        if (department.coordinator && !department.coordinator._id) {
          department.coordinator._id = new ObjectId()
          changed = true
          coordinatorsBackfilled += 1
        }
        return department
      })

      if (changed) {
        await db.collection('universities').updateOne(
          { _id: university._id },
          { $set: { departments } }
        )
        universitiesTouched += 1
      }
    }

    console.log(
      `Backfilled ${coordinatorsBackfilled} coordinator id(s) across ${universitiesTouched} universit${universitiesTouched === 1 ? 'y' : 'ies'}.`
    )
  } finally {
    await client.close()
  }
}

backfill().catch(err => {
  console.error(err)
  process.exit(1)
})
