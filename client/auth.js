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

          console.log("LOGIN EMAIL:", credentials.email)

          const client = await clientPromise
          console.log("Mongo Connected")

          const db = client.db()
          console.log("Database:", db.databaseName)

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
                id: universityWithAdmin._id.toString(),
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


          console.log("Teacher Found:", teacher)

          if (teacher) {
            const match = await bcrypt.compare(
              credentials.password,
              teacher.passwordHash
            )

            console.log("Password Match:", match)

            if (match) {
              return {
                id: teacher._id.toString(),
                email: teacher.email,
                role: 'teacher',
                name: teacher.name,
                department: teacher.department,
                university: teacher.university
              }
            }
          }

          // 3. Check student
          const student = await db.collection('students').findOne({
            email: credentials.email
          })

          if (student && await bcrypt.compare(credentials.password, student.passwordHash)) {
            return {
              id: student._id.toString(),
              email: credentials.email,
              role: 'student',
              name: student.name,
              department: student.department,
              university: student.university
            }
          }

          return null
        } catch (error) {
          console.error('NextAuth authorize error:', error)
          console.error('FULL AUTH ERROR:')
          console.error(error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.name = user.name
        token.department = user.department
        token.university = user.university
      }
      return token
    },
    async session({ session, token }) {
      if (!session) return session
      if (session.user) {
        session.user.role = token?.role || null
        session.user.name = token?.name || null
        session.user.department = token?.department || null
        session.user.university = token?.university || null
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
