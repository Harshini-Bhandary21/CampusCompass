"use client";

import { usePathname } from "next/navigation";
import Header from "../landing/Header";
import Footer from "../landing/Footer";

// Only the site root shares the site-wide Header/Footer. Dashboard-style
// routes (auth, student, firstyear/*) keep their own separate shell.
export default function SiteChrome({ children }) {
  const pathname = usePathname();

  if (pathname !== "/") {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
