import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/lately", label: "Lately", end: false },
  { to: "/games", label: "Games", end: false },
  { to: "/books", label: "Books", end: false },
  { to: "/other", label: "Other", end: false },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrow, setNarrow] = useState(
    () => window.matchMedia("(max-width: 720px)").matches,
  );
  const location = useLocation();
  const navId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const sync = () => {
      setNarrow(media.matches);
      if (!media.matches) setMenuOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navRef.current?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <NavLink to="/" className="brand" end>
        kris10
      </NavLink>
      <button
        ref={toggleRef}
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls={navId}
        onClick={() => setMenuOpen((value) => !value)}
      >
        <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        <span className="menu-bars" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={menuOpen ? "nav-scrim is-open" : "nav-scrim"}
        aria-label="Close menu"
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => {
          setMenuOpen(false);
          toggleRef.current?.focus();
        }}
      />
      <nav
        ref={navRef}
        id={navId}
        className={menuOpen ? "site-nav is-open" : "site-nav"}
        aria-label="Primary"
        aria-hidden={narrow && !menuOpen}
        inert={narrow && !menuOpen ? true : undefined}
        tabIndex={-1}
      >
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
