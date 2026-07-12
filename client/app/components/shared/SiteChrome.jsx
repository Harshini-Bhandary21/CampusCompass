"use client";

import { usePathname } from "next/navigation";
import Header from "../landing/Header";
import Footer from "../landing/Footer";

// Marketing/content routes that share the site-wide Header + Footer.
// Dashboard-style routes (auth, admin, student, [department]/*) keep their
// own separate shell and are intentionally excluded here.
const CHROME_ROUTES = ["/", "/clubs", "/events", "/achievements", "/gallery", "/contact"];

function isChromeRoute(pathname) {
  return CHROME_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`))
  );
}

export default function SiteChrome({ children }) {
  const pathname = usePathname();

  if (!isChromeRoute(pathname)) {
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
