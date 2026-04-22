import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { getTrendingMovies, updateSearchCount, getWatchHistory } from "./supabase.js";
import { useAuth } from "./context/AuthContext.jsx";
import ContinueWatching from "./components/ContinueWatching.jsx";
import { useSearch } from "./context/SearchContext.jsx";
import { TMDB_GENRES } from "./constants.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const TabToggle = ({ activeType, setType }) => {
  const isMovie = activeType === 'movie';

  return (
    <div 
      onClick={() => setType(isMovie ? 'tv' : 'movie')}
      className="relative w-32 h-11 flex items-center cursor-pointer rounded-full bg-white/5 backdrop-blur-xl border border-white/20 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6),0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-500 group overflow-hidden"
    >
      {/* Neon Glow Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 opacity-20 bg-[#ae8fff] blur-3xl`} />
      <div className={`absolute inset-0 transition-shadow duration-500 shadow-[0_0_12px_rgba(174,143,255,0.2)]`} />

      {/* Sliding Glass Thumb */}
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

      {/* Text Labels */}
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

const Home = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const [moviesList, setMoviesList] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  
  const [selectedGenre, setSelectedGenre] = useState(TMDB_GENRES[0]);
  const [watchHistory, setWatchHistory] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTopRatedLoading, setIsTopRatedLoading] = useState(false);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  
  // Section Types
  const [trendingType, setTrendingType] = useState('movie');
  const [allType, setAllType] = useState('movie');
  const [topRatedType, setTopRatedType] = useState('movie');
  const [genreType, setGenreType] = useState('movie');

  const dropdownRef = useRef(null);
  const { user } = useAuth();

  useDebounce(() => setDebouncedSearchTerm(searchTerm || ""), 500, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      let endpoint;
      if (query) {
        // Use multi-search to include both movies and series
        endpoint = `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}`;
      } else {
        endpoint = `${API_BASE_URL}/discover/${allType}?sort_by=popularity.desc`;
      }

      const res = await fetch(endpoint, {
        method: "GET",
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` },
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      
      // Filter and standardize results if it's a multi-search
      const filteredResults = query 
        ? (data.results || []).filter(item => item.media_type === "movie" || item.media_type === "tv")
        : (data.results || []);

      setMoviesList(filteredResults);

      if (query && filteredResults.length > 0) {
        // Update search count for the first result regardless of type
        await updateSearchCount(query, filteredResults[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching movies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopRatedMovies = async () => {
    setIsTopRatedLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${topRatedType}/top_rated?language=en-US&page=1`, {
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` }
      });
      const data = await res.json();
      setTopRatedMovies(data.results || []);
    } catch (err) {
      console.error("Error fetching top rated:", err);
    } finally {
      setIsTopRatedLoading(false);
    }
  };

  const loadGenreMovies = async (genreId) => {
    setIsGenreLoading(true);
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const dateFilter = genreType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte';
      const sortFilter = genreType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
      
      const res = await fetch(`${API_BASE_URL}/discover/${genreType}?with_genres=${genreId}&${dateFilter}=${dateString}&vote_count.gte=10&sort_by=${sortFilter}`, {
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` }
      });
      const data = await res.json();
      setGenreMovies(data.results || []);
    } catch (err) {
      console.error("Error fetching genre movies:", err);
    } finally {
      setIsGenreLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/trending/${trendingType}/day?language=en-US`, {
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` }
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setTrendingMovies(data.results.slice(0, 5) || []);
    } catch (err) {
      console.error("Error fetching trending movies:", err);
    }
  };

  const loadWatchHistory = async () => {
    if (!user) return;
    try {
      const history = await getWatchHistory(user.id);
      setWatchHistory(history);
    } catch (err) {
      console.error("Error fetching watch history:", err);
    }
  };

  // Triggers for specific type changes
  useEffect(() => { fetchMovies(debouncedSearchTerm); }, [debouncedSearchTerm, allType]);
  useEffect(() => { loadTopRatedMovies(); }, [topRatedType]);
  useEffect(() => { loadTrendingMovies(); }, [trendingType]);
  useEffect(() => { if (selectedGenre) loadGenreMovies(selectedGenre.id); }, [selectedGenre, genreType]);

  useEffect(() => {
    if (user) loadWatchHistory();
  }, [user]);

  return (
    <main className="overflow-x-hidden">
      <div className="pattern" />
      <div className="wrapper">
        <header className="hero">
          <img src="./hero.png" alt="Hero" />
          <h1>
            Find Your <span className="text-gradient">Perfect Watch</span> Here
            with Oasis.
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {user && !searchTerm && (
            <div className="mt-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <ContinueWatching history={watchHistory} />
            </div>
          )}
        </header>

        {/* Atmosphere Mesh Gradient - Starts from Latest Entertainment to footer with natural blending */}
        {!searchTerm && (
          <div 
            className="absolute top-[1000px] -left-[10%] w-[120%] bottom-0 pointer-events-none -z-10 overflow-hidden opacity-25"
            style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_10%,#7F3AA1_0%,transparent_50%),radial-gradient(circle_at_95%_20%,#0F083B_0%,transparent_50%),radial-gradient(circle_at_10%_50%,#0C0516_0%,transparent_60%),radial-gradient(circle_at_90%_80%,#5416B5_0%,transparent_60%),radial-gradient(circle_at_50%_95%,#7F3AA1_0%,transparent_50%)] blur-[140px] animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          </div>
        )}

        {trendingMovies.length > 0 && !searchTerm && (
          <section className="trending relative">
            {/* Atmosphere Background Text */}
            <div className="absolute -top-12 -left-4 pointer-events-none select-none -z-10">
              <span className="text-[120px] font-bold text-white/[0.04] leading-none uppercase tracking-tighter">Trending</span>
            </div>
            
            <div className="flex items-center justify-between gap-3 mb-2 px-1 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
                <h2 className="!mb-0">Trending</h2>
                <Link 
                  to={`/explore/${trendingType}/trending`}
                  className="text-[#ae8fff] text-xs font-bold uppercase tracking-wider hover:underline ml-2 flex items-center gap-1 group"
                >
                  See More
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <TabToggle activeType={trendingType} setType={setTrendingType} />
            </div>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <Link to={`/${trendingType}/${movie.id}`}>
                    <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} alt={movie.title || movie.name} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies relative">
          {/* Atmosphere Background Text */}
          <div className="absolute -top-12 -left-4 pointer-events-none select-none -z-10">
            <span className="text-[120px] font-bold text-white/[0.04] leading-none uppercase tracking-tighter">
              {searchTerm ? "Search" : "Latest"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 mb-6 px-1 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
              <h2 className="!mb-0">{searchTerm ? "Search Results" : "Latest Entertainment"}</h2>
              {!searchTerm && (
                <Link 
                  to={`/explore/${allType}/popular`}
                  className="text-[#ae8fff] text-xs font-bold uppercase tracking-wider hover:underline ml-2 flex items-center gap-1 group"
                >
                  See More
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
            {!searchTerm && <TabToggle activeType={allType} setType={setAllType} />}
          </div>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {(searchTerm ? moviesList : moviesList.slice(0, 8)).map((movie) => (
                <MovieCard key={movie.id} movie={movie} type={movie.media_type || allType} />
              ))}
            </ul>
          )}
        </section>

        {!searchTerm && (
          <>
            {/* Top Rated Section */}
            <section className="all-movies !mt-24 relative">
              {/* Atmosphere Background Text */}
              <div className="absolute -top-12 -left-4 pointer-events-none select-none -z-10">
                <span className="text-[120px] font-bold text-white/[0.04] leading-none uppercase tracking-tighter">Top Rated</span>
              </div>
              
              <div className="flex items-center justify-between gap-3 mb-6 px-1 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
                  <h2 className="!mb-0">Top Rated</h2>
                  <Link 
                    to={`/explore/${topRatedType}/top_rated`}
                    className="text-[#ae8fff] text-xs font-bold uppercase tracking-wider hover:underline ml-2 flex items-center gap-1 group"
                  >
                    See More
                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <TabToggle activeType={topRatedType} setType={setTopRatedType} />
              </div>
              {isTopRatedLoading ? (
                <Spinner />
              ) : (
                <ul className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {topRatedMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} type={topRatedType} />
                  ))}
                </ul>
              )}
            </section>

            {/* Genres Section with Custom Dropdown */}
            <section className="all-movies !mt-24 relative">
              {/* Atmosphere Background Text */}
              <div className="absolute -top-12 -left-4 pointer-events-none select-none -z-10">
                <span className="text-[120px] font-bold text-white/[0.04] leading-none uppercase tracking-tighter">Genres</span>
              </div>
              
              <div className="flex items-center justify-between gap-3 mb-6 px-1 flex-wrap" ref={dropdownRef}>
                <div className="flex items-center gap-3 relative">
                  <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
                  
                  <h2 className="!mb-0 flex items-center gap-2 cursor-pointer group" onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}>
                    {selectedGenre.name} 
                    <svg className={`w-6 h-6 text-[#bea7ff] transition-transform duration-300 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </h2>

                  <Link 
                    to={`/explore/${genreType}/genre/${selectedGenre.id}`}
                    className="text-[#ae8fff] text-xs font-bold uppercase tracking-wider hover:underline ml-2 flex items-center gap-1 group"
                  >
                    See More
                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {isGenreDropdownOpen && (
                    <div className="absolute top-10 left-4 z-50 w-56 bg-[#0a0a0f] border border-white/5 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-72 overflow-y-auto hide-scrollbar">
                        {TMDB_GENRES.map((genre) => {
                          const isSelected = selectedGenre.id === genre.id;
                          return (
                            <button
                              key={genre.id}
                              onClick={() => {
                                setSelectedGenre(genre);
                                setIsGenreDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-white/5"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 ${isSelected ? 'text-[#bea7ff] bg-[#bea7ff]/20' : 'text-white/60'}`}>
                                <genre.icon />
                              </div>
                              <span className={`text-sm font-medium ${isSelected ? 'text-[#bea7ff]' : 'text-white/80'}`}>
                                {genre.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <TabToggle activeType={genreType} setType={setGenreType} />
              </div>

              {isGenreLoading ? (
                <Spinner />
              ) : (
                <ul className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {genreMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} type={genreType} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Home;
