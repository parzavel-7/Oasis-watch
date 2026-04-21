import React from "react";

const Search = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search group transform-gpu transition-all duration-500 hover:scale-[1.01] hover:bg-white/[0.05]">
      <div className="relative flex items-center w-full">
        {/* Search Icon with soft theme glow */}
        <div className="absolute left-4 pointer-events-none transition-transform group-focus-within:scale-110">
          <svg className="w-5 h-5 text-white/50 group-focus-within:text-[#ae8fff] drop-shadow-[0_0_8px_rgba(174,143,255,0.4)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>

        <input
          type="text"
          placeholder="Search for a perfect watch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent py-4 pl-14 pr-12 text-lg text-white font-medium placeholder-white/20 outline-none"
        />

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 text-white/30 hover:text-[#ae8fff] transition-all hover:scale-110 cursor-pointer p-1"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Search;
