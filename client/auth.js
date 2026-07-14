import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const client = await clientPromise

          const db = client.db()

          // 1. Check admin (previously "department coordinator")
          const universityWithAdmin = await db.collection('universities').findOne({
            'departments.coordinator.email': credentials.email
          })

          if (universityWithAdmin) {
            const department = universityWithAdmin.departments.find(
              dept => dept.coordinator.email === credentials.email
            )

            if (department && await bcrypt.compare(credentials.password, department.coordinator.passwordHash)) {
              return {
                // Each coordinator now carries its own stable _id (see
                // scripts/backfill-coordinator-ids.js) instead of sharing the
                // parent university's _id across every department coordinator.
                id: (department.coordinator._id || universityWithAdmin._id).toString(),
                email: credentials.email,
                role: 'admin',
                department: department.name,
                university: universityWithAdmin.name
              }
            }
          }

          // 2. Check teacher
          const teacher = await db.collection('teachers').findOne({
            email: credentials.email
          })

          if (teacher) {
            if (teacher.status === 'deleted' || teacher.status === 'blocked') {
              return null
            }

            const match = await bcrypt.compare(
              credentials.password,
              teacher.passwordHash
            )

            if (match) {
              return {
                id: teacher._id.toString(),
                email: teacher.email,
                role: 'teacher',
                name: teacher.name,
                department: teacher.department,
                university: teacher.university,
                status: teacher.status || 'active'
              }
            }
          }

          // 3. Check student
          const student = await db.collection('students').findOne({
            email: credentials.email
          })

          if (student) {
            if (student.status === 'deleted' || student.status === 'blocked') {
              return null
            }

            if (await bcrypt.compare(credentials.password, student.passwordHash)) {
              return {
                id: student._id.toString(),
                email: credentials.email,
                role: 'student',
                name: student.name,
                department: student.department,
                university: student.university,
                status: student.status || 'active'
              }
            }
          }

          return null
        } catch (error) {
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.department = user.department
        token.university = user.university
        token.status = user.status || null
        // profilePhoto is deliberately never added here — it's a base64
        // string that would blow past the JWT cookie's size limit. Fetch it
        // separately via GET /api/users/me instead.
      }
      return token
    },
    async session({ session, token }) {
      if (!session) return session
      if (session.user) {
        session.user.id = token?.id || null
        session.user.role = token?.role || null
        session.user.name = token?.name || null
        session.user.department = token?.department || null
        session.user.university = token?.university || null
        session.user.status = token?.status || null
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  debug: false
})
