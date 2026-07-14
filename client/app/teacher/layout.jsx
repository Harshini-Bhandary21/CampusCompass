"use client"

import { SessionProvider } from "next-auth/react"
import DashboardBackground from "../components/hub/DashboardBackground"

export default function TeacherLayout({ children }) {
  return (
    <SessionProvider>
      <DashboardBackground />
      {children}
    </SessionProvider>
  )
}
