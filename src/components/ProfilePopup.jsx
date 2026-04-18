import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWatchHistory, supabase } from "../supabase";
import { Link } from "react-router-dom";

const ProfilePopup = ({ isOpen, onClose }) => {
  const { user, login, register, logout, checkUserStatus } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);


  useEffect(() => {
    if (user && isOpen) {
      fetchHistory();
    }
  }, [user, isOpen]);


  const fetchHistory = async () => {
    const data = await getWatchHistory(user.id);
    setHistory(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      window.location.href = "/";
    } else {
      // Special handling for unconfirmed email
      if (result.error && result.error.toLowerCase().includes("email not confirmed")) {
        setEmailNotConfirmed(true);
      } else {
        setError(result.error || "Login failed. Check your email and password.");
      }
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) { setError("Enter your email address first."); return; }
    setIsLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setEmailNotConfirmed(false);
      setSuccessMessage("Confirmation email resent! Please check your inbox.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    const result = await register(email, password, name);
    setIsLoading(false);
    if (result.success) {
      if (result.session) {
        window.location.href = "/";
      } else {
        setSuccessMessage(result.message || "Please check your email to confirm your account.");
        setEmail("");
        setPassword("");
        setName("");
      }
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
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
                  src={`https://ui-avatars.com/api/?name=${user.user_metadata?.full_name || user.email}&background=800080&color=fff&bold=true&size=128`}
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
                      type="button"
                      onClick={() => setEmail("")}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-[#AB8BFF]/30 transition-all text-sm font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.254 0 2.415.279 3.44.775M18.665 18.825A10.05 10.05 0 0021.542 12c-1.274-4.057-5.064-7-9.542-7-1.254 0-2.415.279-3.44.775M1 1l22 22" />
                      </svg>
                    )}
                  </button>
                </div>


                {error && (
                  <p className="text-red-400 text-[10px] text-center uppercase font-bold tracking-widest">
                    {error}
                  </p>
                )}

                {emailNotConfirmed && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center space-y-3">
                    <p className="text-blue-300 text-xs font-bold leading-relaxed">
                      📧 Your email is not confirmed yet. Please check your inbox and click the confirmation link.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isLoading}
                      className="text-[10px] text-blue-400 uppercase tracking-widest font-black hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Sending..." : "Resend confirmation email"}
                    </button>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                    <p className="text-green-400 text-xs font-bold leading-relaxed">
                      {successMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-[2rem] bg-[#B89FFF] text-[#030014] font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95 mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Please wait..."
                    : activeTab === "login"
                    ? "Sign In"
                    : "Get Started"}
                </button>
              </form>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-3xl font-black text-white mb-1 tracking-tighter">
                {user.user_metadata?.full_name || user.email.split('@')[0]}
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
                    <div className="relative group">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-white text-xs outline-none focus:bg-white/10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                      >
                        {showNewPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.254 0 2.415.279 3.44.775M18.665 18.825A10.05 10.05 0 0021.542 12c-1.274-4.057-5.064-7-9.542-7-1.254 0-2.415.279-3.44.775M1 1l22 22" />
                          </svg>
                        )}
                      </button>
                    </div>

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
                  onClick={async () => {
                    await logout();
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
                        key={item.id}
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
