"use client";

import { usePathname } from "next/navigation";
import Header from "../landing/Header";

// Only the site root shares the site-wide Header. Dashboard-style routes
// (auth, student, firstyear/*) keep their own separate shell.
export default function SiteChrome({ children }) {
  const pathname = usePathname();

  if (pathname !== "/") {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
