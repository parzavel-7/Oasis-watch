import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfilePopup from "./ProfilePopup.jsx";
import { useAuth } from "../context/AuthContext";

/* ── Expanding Search Bar ───────────────────────── */
import { useSearch } from "../context/SearchContext.jsx";

const NavSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { searchTerm, setSearchTerm } = useSearch();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const open = () => setIsOpen(true);

  const close = () => {
    setIsOpen(false);
    // Don't clear searchTerm on close so it persists
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Enter" && searchTerm?.trim()) {
      navigate("/");
      close();
    }
  };

  return (
    <div
      className="flex items-center rounded-full transition-all duration-300"
      style={{
        width: isOpen ? "200px" : "36px",
        border: isOpen ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
        background: isOpen ? "rgba(255,255,255,0.08)" : "transparent",
        backdropFilter: isOpen ? "blur(10px)" : "none",
        overflow: "hidden",
      }}
    >
      {/* Icon button */}
      <button
        onMouseDown={(e) => {
          // Prevent blur from firing before click when input is open
          e.preventDefault();
          if (!isOpen) open();
        }}
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </button>

      {/* Input Container */}
      <div className="flex-1 relative flex items-center h-full">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || ""}
          onChange={(e) => {
             setSearchTerm(e.target.value);
             if (window.location.pathname !== "/") {
                 navigate("/");
             }
          }}
          onKeyDown={handleKeyDown}
          onBlur={close}
          placeholder="Search…"
          className="w-full bg-transparent text-white text-sm placeholder-white/40 outline-none pr-7 transition-opacity duration-200 h-full"
          style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        />

        {isOpen && searchTerm && (
          <button
            onMouseDown={(e) => {
              // Prevent input blur to keep it open
              e.preventDefault();
            }}
            onClick={() => {
              setSearchTerm("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-white/50 hover:text-white transition-colors p-1"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Navbar ─────────────────────────────────────── */
const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className="fixed top-6 left-0 w-full z-[100] px-4">
        <nav className="max-w-5xl mx-auto rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
          <div className="px-6 sm:px-10 h-16 flex items-center justify-between relative">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2 group transition-all">
              <img
                src="/logo.png"
                alt="Oasis Watch"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Center: Home Button */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Link
                to="/"
                className="text-white/80 hover:text-white font-semibold text-base px-6 py-2 rounded-xl transition-all hover:bg-white/10 active:scale-95"
              >
                Home
              </Link>
            </div>

            {/* Right: Search + Profile */}
            <div className="flex items-center gap-3">
              <NavSearch />
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 group cursor-pointer outline-none"
              >
                <div className="w-9 h-9 overflow-hidden transition-all hover:scale-105">
                  <img
                    src={
                      user
                        ? `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || user.email}&background=random`
                        : "/profile.png"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </div>
          </div>
        </nav>
      </div>

      <ProfilePopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default Navbar;
