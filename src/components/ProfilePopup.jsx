import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWatchHistory, account } from "../appwrite";
import { Link } from "react-router-dom";

const ProfilePopup = ({ isOpen, onClose }) => {
  const { user, login, logout, checkUserStatus } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      fetchHistory();
    }
  }, [user, isOpen]);


  const fetchHistory = async () => {
    const data = await getWatchHistory(user.$id);
    setHistory(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(email, password);
    if (result.success) {
      window.location.href = "/"; // Reload and redirect to home
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await account.create("unique()", email, password, name);
      await login(email, password);
      window.location.href = "/"; // Reload and redirect to home
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await account.updatePassword(newPassword);
      setIsChangingPassword(false);
      setNewPassword("");
      alert("Password updated successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#030014]/60 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-[#0f0d23] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all animate-in fade-in zoom-in duration-500">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >
          ✕
        </button>

        {/* Content Section */}
        <div className="px-8 pt-12 pb-10 flex flex-col items-center">
          {/* Header Icon/Avatar (Match the "Large Centered Icon" style) */}
          <div className="relative mb-8 p-1 rounded-[2.5rem] bg-linear-to-br from-[#800080]/20 to-transparent">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-[#1a1635] border border-white/10 shadow-inner flex items-center justify-center">
              {user ? (
                <img
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=800080&color=fff&bold=true&size=128`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-6 opacity-80">
                  <svg
                    className="w-full h-full text-[#AB8BFF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {/* Tiny status indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0f0d23] bg-green-500 shadow-lg" />
          </div>

          {!user ? (
            <div className="w-full">
              {/* Pill-Style Tab Toggle */}
              <div className="flex p-1.5 rounded-full bg-white/5 border border-white/5 mb-8 w-full max-w-[280px] mx-auto">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "login" ? "bg-white text-[#030014] shadow-lg" : "text-white/40 hover:text-white/60"}`}
                >
                  {activeTab === "login" && (
                    <span className="w-4 h-4 rounded-full bg-green-500 inline-flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  )}
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "register" ? "bg-white text-[#030014] shadow-lg" : "text-white/40 hover:text-white/60"}`}
                >
                  {activeTab === "register" && (
                    <span className="w-4 h-4 rounded-full bg-green-500 inline-flex items-center justify-center text-[10px] text-white">
                      ✓
                    </span>
                  )}
                  Signup
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  {activeTab === "login" ? "Welcome Back" : "Join Oasis"}
                </h2>
                <p className="text-xs text-white/40 leading-relaxed px-4">
                  {activeTab === "login"
                    ? "Log in to your account and continue your cinematic journey."
                    : "Create an account to start tracking your watch history today."}
                </p>
              </div>

              <form
                onSubmit={activeTab === "login" ? handleLogin : handleRegister}
                className="space-y-4"
              >
                {activeTab === "register" && (
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-[#AB8BFF]/30 transition-all text-sm font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-[#AB8BFF]/30 transition-all text-sm font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {email && (
                    <button
                      onClick={() => setEmail("")}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-[#AB8BFF]/30 transition-all text-sm font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-red-400 text-[10px] text-center uppercase font-bold tracking-widest">
                    {error}
                  </p>
                )}

                <button className="w-full py-4 rounded-[2rem] bg-[#B89FFF] text-[#030014] font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95 mt-6">
                  {activeTab === "login" ? "Sign In" : "Get Started"}
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-3xl font-black text-white mb-1 tracking-tighter">
                {user.name}
              </h2>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-black mb-8 px-3 py-1 bg-purple-400/10 rounded-full border border-purple-400/20">
                Verified Oasis Watcher
              </p>

              {/* Action Buttons (Pill Style) */}
              <div className="flex flex-col w-full gap-3 mb-10">
                {!isChangingPassword ? (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full py-4 rounded-full bg-white/5 border border-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Modify Password
                  </button>
                ) : (
                  <form
                    onSubmit={handleChangePassword}
                    className="w-full space-y-3 p-4 rounded-[2rem] bg-white/5 border border-white/5"
                  >
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-white text-xs outline-none focus:bg-white/10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 rounded-full bg-[#8BC34A] text-[#030014] text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                        Save
                      </button>
                      <button
                        onClick={() => setIsChangingPassword(false)}
                        className="flex-1 py-3 rounded-full bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    window.location.href = "/";
                  }}
                  className="w-full py-4 rounded-full bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all font-black tracking-tight"
                >
                  Logout
                </button>
              </div>

              {/* Recently Visited Section (Airy Structure) */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Timeline
                  </h3>
                  <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                    Activity
                  </span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <Link
                        key={item.$id}
                        to={`/movie/${item.movie_id}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group relative overflow-hidden"
                      >
                        <div className="w-12 h-16 relative flex-shrink-0">
                          <img
                            src={item.poster_url}
                            alt={item.movie_title}
                            className="w-full h-full object-cover rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate text-xs group-hover:text-[#AB8BFF] transition-colors">
                            {item.movie_title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 group-hover:bg-white/10 transition-all">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M14 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                      No Timeline Data
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
