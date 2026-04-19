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
  
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  useDebounce(() => setDebouncedSearchTerm(searchTerm || ""), 500, [searchTerm]);

  // Click outside to close dropdown
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
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setMoviesList(data.results || []);

      if (query && data.results.length > 0) {
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
      const res = await fetch(`${API_BASE_URL}/movie/top_rated?language=en-US&page=1`, {
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
      // Fetch strictly the most recent released movies
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];

      const res = await fetch(`${API_BASE_URL}/discover/movie?with_genres=${genreId}&primary_release_date.lte=${dateString}&vote_count.gte=10&sort_by=primary_release_date.desc`, {
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
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
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

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
    loadTopRatedMovies();
    if (user) loadWatchHistory();
  }, [user]);

  useEffect(() => {
    if (selectedGenre) {
      loadGenreMovies(selectedGenre.id);
    }
  }, [selectedGenre]);

  return (
    <main>
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

        {trendingMovies.length > 0 && !searchTerm && (
          <section className="trending">
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
              <h2 className="!mb-0">Trending Movies</h2>
            </div>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <Link to={`/movie/${movie.movie_id}`}>
                    <img src={movie.poster_url} alt={movie.title} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
            <h2 className="!mb-0">{searchTerm ? "Search Results" : "All Movies"}</h2>
          </div>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {/* If searching show all matching, if not search just show 8 movies (2 rows of 4) */}
              {(searchTerm ? moviesList : moviesList.slice(0, 8)).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>

        {!searchTerm && (
          <>
            {/* Top Rated Section */}
            <section className="all-movies !mt-24">
              <div className="flex items-center gap-3 mb-6 px-1">
                <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
                <h2 className="!mb-0">Top Rated</h2>
              </div>
              {isTopRatedLoading ? (
                <Spinner />
              ) : (
                <ul>
                  {/* Just 1 row of 4 movies */}
                  {topRatedMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </ul>
              )}
            </section>

            {/* Genres Section with Custom Dropdown */}
            <section className="all-movies !mt-24">
              <div className="flex items-center gap-3 mb-6 px-1 relative" ref={dropdownRef}>
                <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
                
                <h2 className="!mb-0 flex items-center gap-2 cursor-pointer group" onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}>
                  {selectedGenre.name} 
                  <svg className={`w-6 h-6 text-[#bea7ff] transition-transform duration-300 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </h2>

                {/* Dropdown Menu */}
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

              {isGenreLoading ? (
                <Spinner />
              ) : (
                <ul>
                  {/* Just 1 row of 4 movies */}
                  {genreMovies.slice(0, 4).map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
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
