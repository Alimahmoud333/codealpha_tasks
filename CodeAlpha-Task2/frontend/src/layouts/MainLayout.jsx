import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/navbar/Navbar.jsx";
import { APP_NAME } from "../constants/appConfig.js";

export default function MainLayout() {
  const { pathname } = useLocation();

  // Start each new page at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer__inner">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span>A demo store built for the CodeAlpha Full-Stack internship.</span>
        </div>
      </footer>
    </>
  );
}
