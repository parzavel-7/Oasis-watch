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
      className={`flex items-center rounded-full transition-all duration-500 border ${
        isOpen
          ? "w-[220px] bg-white/10 border-white/20 backdrop-blur-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
          : "w-9 bg-transparent border-transparent"
      } overflow-hidden group`}
    >
      {/* Icon button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          if (!isOpen) open();
        }}
        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
          isOpen ? "text-[#ae8fff]" : "text-white/60 hover:text-white"
        }`}
        aria-label="Search"
      >
        <svg
          className="w-5 h-5 drop-shadow-[0_0_8px_rgba(174,143,255,0.4)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </button>

      {/* Input Container */}
      <div
        className={`flex-1 relative flex items-center h-full transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 invisible"}`}
      >
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
          placeholder="Search movies..."
          className="w-full bg-transparent text-white text-xs font-medium placeholder-white/30 outline-none pr-8 h-full"
        />

        {searchTerm && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSearchTerm("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-white/30 hover:text-white transition-colors p-1"
            aria-label="Clear search"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
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
        <nav className="max-w-5xl mx-auto rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
          <div className="px-6 sm:px-10 h-16 flex items-center justify-between relative">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[#ae8fff]/5 pointer-events-none" />

            {/* Left: Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group transition-all relative z-10"
            >
              <img
                src="/logo.png"
                alt="Oasis Watch"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Center: Home Button - Hidden on mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden sm:block">
              <Link
                to="/"
                className="text-white/70 hover:text-white font-medium text-sm uppercase tracking-widest px-6 py-2 rounded-full transition-all hover:bg-white/5 active:scale-95 border border-transparent hover:border-white/10"
              >
                Home
              </Link>
            </div>

            {/* Right: Search + Profile */}
            <div className="flex items-center gap-4 z-10">
              <NavSearch />
              <button
                onClick={() => setIsProfileOpen(true)}
                className="relative flex items-center gap-2 group cursor-pointer outline-none"
              >
                <div className="w-9 h-9 overflow-hidden  transition-all hover:scale-110 hover:border-[#ae8fff]/50 shadow-lg">
                  <img
                    src={
                      user
                        ? `https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || user.email}&background=ae8fff&color=fff`
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
