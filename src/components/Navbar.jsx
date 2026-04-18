import { useState } from "react";
import { Link } from "react-router-dom";
import ProfilePopup from "./ProfilePopup.jsx";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className="fixed top-6 left-0 w-full z-[100] px-4">
        <nav className="max-w-5xl mx-auto rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
          <div className="px-6 sm:px-10 h-16 flex items-center justify-between relative">
            {/* Left: Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group transition-all"
            >
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

            {/* Right: Profile Logo */}
            <div className="flex items-center gap-4">
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
