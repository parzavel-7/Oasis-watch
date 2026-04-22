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


const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const TMDB_GENRES = [
  { id: 35, name: "Comedy", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 28, name: "Action", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  { id: 18, name: "Drama", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 27, name: "Horror", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> },
  { id: 10749, name: "Romance", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { id: 12, name: "Adventure", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z" /></svg> },
  { id: 878, name: "Science Fiction", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
  { id: 53, name: "Thriller", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
  { id: 16, name: "Animation", icon: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
];

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
        endpoint = `${API_BASE_URL}/search/${allType}?query=${encodeURIComponent(query)}`;
      } else {
        endpoint = `${API_BASE_URL}/discover/${allType}?sort_by=popularity.desc`;
      }

      const res = await fetch(endpoint, {
        method: "GET",
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` },
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setMoviesList(data.results || []);

      if (query && data.results.length > 0 && allType === 'movie') {
        await updateSearchCount(query, data.results[0]);
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
                <MovieCard key={movie.id} movie={movie} type={allType} />
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
