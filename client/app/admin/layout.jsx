"use client"

import { SessionProvider } from "next-auth/react"
import Chatbot from "../components/shared/Chatbot"
import DashboardBackground from "../components/hub/DashboardBackground"

export default function DepartmentLayout({ children }) {
  return (
    <SessionProvider>
      <DashboardBackground />
      {children}
      <Chatbot />
    </SessionProvider>
  )
}
