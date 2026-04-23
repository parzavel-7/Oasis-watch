import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard.jsx";
import Spinner from "../components/Spinner.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { TMDB_GENRES } from "../constants.jsx";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const TabToggle = ({ activeType, setType }) => {
  const isMovie = activeType === 'movie';

  return (
    <div 
      onClick={() => setType(isMovie ? 'tv' : 'movie')}
      className="relative w-32 h-11 flex items-center cursor-pointer rounded-full bg-white/5 backdrop-blur-xl border border-white/20 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6),0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-500 group overflow-hidden"
    >
      <div className={`absolute inset-0 transition-opacity duration-500 opacity-20 bg-[#ae8fff] blur-3xl`} />
      <div 
        className={`absolute left-1 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-3xl border border-white/40 shadow-[0_4px_20px_rgba(174,143,255,0.4),inset_0_0_12px_rgba(255,255,255,0.3)] transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] z-20 ${isMovie ? 'translate-x-0' : 'translate-x-[5.25rem]'}`}
      >
        <div className="absolute inset-0 rounded-full bg-[#ae8fff]/20 blur-sm animate-pulse" />
        {isMovie ? (
          <svg className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none text-[10px] font-black text-white uppercase tracking-[0.1em] z-10">
        <span className={`pl-[2px] transition-all duration-500 w-1/2 ${!isMovie ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(174,143,255,0.8)]' : 'opacity-20 scale-90 -translate-x-2'}`}>
          Series
        </span>
        <span className={`pr-[2px] text-right transition-all duration-500 w-1/2 ${isMovie ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(174,143,255,0.8)]' : 'opacity-20 scale-90 translate-x-2'}`}>
          Movies
        </span>
      </div>
    </div>
  );
};

const Explore = () => {
  const { type, category, id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("popularity.desc");

  const sortOptions = [
    { label: "Most Popular", value: "popularity.desc" },
    { label: "Top Rated", value: "vote_average.desc" },
    { label: "Newest", value: "primary_release_date.desc" },
    { label: "Oldest", value: "primary_release_date.asc" }
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy);

  const currentGenre = TMDB_GENRES.find((g) => g.id.toString() === id) || TMDB_GENRES[0];

  const getTitle = () => {
    const typeLabel = type === "tv" ? "Series" : "Movies";
    switch (category) {
      case "trending": return `Trending ${typeLabel}`;
      case "top_rated": return `Top Rated ${typeLabel}`;
      case "popular": return `Latest ${typeLabel}`;
      case "genre": return `${currentGenre.name} ${typeLabel}`;
      default: return `${typeLabel}`;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const allResults = [];
      const totalPagesToFetch = category === "genre" ? 8 : 5; // Fetch more for genres
      
      for (let page = 1; page <= totalPagesToFetch; page++) {
        let endpoint = "";
        if (category === "trending") {
          endpoint = `${API_BASE_URL}/trending/${type}/day?page=${page}`;
        } else if (category === "top_rated") {
          endpoint = `${API_BASE_URL}/${type}/top_rated?page=${page}`;
        } else if (category === "genre") {
          endpoint = `${API_BASE_URL}/discover/${type}?with_genres=${id}&page=${page}&sort_by=${sortBy}&vote_count.gte=10`;
        } else {
          endpoint = `${API_BASE_URL}/discover/${type}?page=${page}&sort_by=${sortBy}`;
        }

        const res = await fetch(endpoint, {
          headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` }
        });
        const data = await res.json();
        if (data.results) {
          allResults.push(...data.results);
        }
        if (data.total_pages < page) break;
      }
      setItems(allResults);
    } catch (error) {
      console.error("Error fetching explorer items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    window.scrollTo(0, 0);
  }, [type, category, id, sortBy]);

  const handleTypeChange = (newType) => {
    navigate(`/explore/${newType}/${category}${id ? `/${id}` : ""}`);
  };

  const handleGenreChange = (genreId) => {
    navigate(`/explore/${type}/genre/${genreId}`);
    setIsGenreDropdownOpen(false);
  };

  return (
    <main className="min-h-screen bg-primary pb-20 overflow-x-hidden">
      <div className="pattern" />
      
      <div className="wrapper relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-white hover:text-[#ae8fff] transition-all group w-fit"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-bold text-[10px] uppercase tracking-widest">Back to Home</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-[5px] h-12 bg-[#ae8fff] rounded-full shadow-[0_0_20px_rgba(174,143,255,0.6)]" />
                <div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                    {getTitle()}
                  </h1>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-4 self-start md:self-end">
              {category === "genre" && (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                    className="h-11 px-5 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="text-[#ae8fff]">
                      <currentGenre.icon />
                    </div>
                    <span className="text-white font-bold text-sm">{currentGenre.name}</span>
                    <svg className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isGenreDropdownOpen && (
                    <div className="absolute top-14 left-0 z-50 w-64 bg-[#0a0a0f] border border-white/5 rounded-2xl shadow-2xl py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl">
                      <div className="max-h-80 overflow-y-auto pr-1 hide-scrollbar">
                        {TMDB_GENRES.map((genre) => {
                          const isSelected = currentGenre.id === genre.id;
                          return (
                            <button
                              key={genre.id}
                              onClick={() => handleGenreChange(genre.id)}
                              className="w-full px-4 py-3 flex items-center gap-4 text-left transition-all hover:bg-[#ae8fff]/10 group/item"
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'text-[#ae8fff] bg-[#ae8fff]/20' : 'text-white/40 bg-white/5 group-hover/item:bg-white/10'}`}>
                                <genre.icon />
                              </div>
                              <span className={`text-sm font-bold tracking-tight ${isSelected ? 'text-[#ae8fff]' : 'text-white/70 group-hover/item:text-white'}`}>
                                {genre.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <TabToggle activeType={type} setType={handleTypeChange} />

              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="h-11 px-5 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <svg className="w-4 h-4 text-[#ae8fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="text-white font-bold text-sm truncate max-w-[80px] sm:max-w-none">{currentSort.label}</span>
                  <svg className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute top-14 right-0 z-50 w-48 bg-[#0a0a0f] border border-white/5 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-bold transition-all hover:bg-[#ae8fff]/10 ${sortBy === opt.value ? 'text-[#ae8fff]' : 'text-white/60 hover:text-white'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ae8fff] animate-pulse" />
            <p className="text-white/40 text-sm font-medium tracking-wide">Showing {items.length} curated results</p>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
            {Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {items.map((item) => (
              <div key={item.id} className="transition-transform duration-500 hover:z-10">
                <MovieCard movie={item} type={type} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Explore;
