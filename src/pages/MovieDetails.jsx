import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Spinner from "../components/Spinner.jsx";
import MovieCard from "../components/MovieCard.jsx";
import { saveWatchHistory } from "../supabase.js";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const type = location.pathname.includes("/tv/") ? "tv" : "movie";

  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // TV Specific States
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [episodeSort, setEpisodeSort] = useState("asc"); // "asc" or "desc"

  const playerContainerRef = useRef(null);

  const toggleFullScreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const fetchMovieDetails = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/${type}/${id}?append_to_response=credits,recommendations`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch details");
      }

      const data = await response.json();

      // Standardize title/date for database saving logic
      if (type === "tv") {
        data.title = data.name;
        // Find the first actual season number (skipping specials if they aren't explicitly requested)
        const firstSeason =
          data.seasons?.find((s) => s.season_number > 0)?.season_number ||
          data.seasons?.[0]?.season_number ||
          1;
        setSelectedSeason(firstSeason);
      }

      setMovie(data);
    } catch (error) {
      console.error("Error fetching details:", error);
      setErrorMessage("Could not load details.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeasonDetails = async (seasonNumber) => {
    if (type !== "tv") return;
    setIsEpisodesLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/tv/${id}/season/${seasonNumber}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data.episodes || []);
      }
    } catch (error) {
      console.error("Error fetching season details:", error);
    } finally {
      setIsEpisodesLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
    window.scrollTo(0, 0);
  }, [id, type]);

  // Separate effect for saving watch history to avoid re-fetching on auth changes
  useEffect(() => {
    if (user && movie && movie.id.toString() === id) {
      saveWatchHistory(user.id, movie);
    }
  }, [user, movie?.id, id]);

  useEffect(() => {
    if (type === "tv" && movie) {
      fetchSeasonDetails(selectedSeason);
    }
  }, [selectedSeason, id, type, movie?.id]);

  if (isLoading)
    return (
      <div className="wrapper h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  if (errorMessage)
    return (
      <div className="wrapper h-screen flex flex-col justify-center items-center">
        <p className="text-red-500 mb-4">{errorMessage}</p>
        <Link to="/" className="text-white bg-blue-600 px-4 py-2 rounded">
          Back to Home
        </Link>
      </div>
    );

  const displayTitle = movie.title || movie.name;
  const displayDate = movie.release_date || movie.first_air_date || "";
  const displayRuntime =
    movie.runtime || (movie.episode_run_time ? movie.episode_run_time[0] : 0);

  return (
    <main className="min-h-screen bg-primary pb-20 overflow-x-hidden">
      <div className="pattern" />
      <div className="wrapper relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-1000">
        {/* Player Section */}
        <div
          ref={playerContainerRef}
          onDoubleClick={toggleFullScreen}
          className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl mb-12 border border-white/10 cursor-pointer bg-black animate-in zoom-in-95 duration-700"
          title="Double click for Fullscreen"
        >
          <iframe
            src={
              type === "tv"
                ? `https://www.vidking.net/embed/tv/${id}/${selectedSeason}/${selectedEpisode}`
                : `https://www.vidking.net/embed/movie/${id}`
            }
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>

        {/* Movie/TV Info Section */}
        <div className="flex flex-col md:flex-row gap-10 text-white">
          {/* Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="relative overflow-hidden rounded-3xl bg-white/5 aspect-[2/3] border border-white/10 shadow-2xl">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/no-movie.png"
                }
                alt={displayTitle}
                onLoad={() => setIsPosterLoaded(true)}
                className={`w-full h-full object-cover transition-all duration-1000 ease-out ${
                  isPosterLoaded
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-110"
                }`}
              />
              {!isPosterLoaded && (
                <div className="absolute inset-0 bg-white/5 animate-pulse" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col pt-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight text-left w-full mr-auto animate-in fade-in slide-in-from-left-2 duration-700">
              {displayTitle}
            </h1>
            {movie.tagline && (
              <p className="text-xl text-gray-400 italic mb-6 animate-in slide-in-from-left-6 duration-700 delay-100">
                {movie.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300 animate-in fade-in duration-1000 delay-200">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                <img src="/star.svg" alt="rating" className="w-4 h-4" />
                <span className="text-white font-medium">
                  {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="opacity-30">•</span>
              <span className="font-medium">
                {displayDate ? displayDate.split("-")[0] : "N/A"}
              </span>

              {displayRuntime > 0 && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="font-medium">
                    {Math.floor(displayRuntime / 60)}h {displayRuntime % 60}m
                  </span>
                </>
              )}

              {movie.original_language && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
                    {movie.original_language.toUpperCase()}
                  </span>
                </>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in duration-1000 delay-300">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-4 py-1.5 bg-[#ae8fff]/10 text-[#ae8fff] border border-[#ae8fff]/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}


            {/* Overview */}
            <div className="mb-10 animate-in fade-in duration-1000 delay-400">
              <h3 className="text-2xl font-bold mb-3 text-white/90">
                Overview
              </h3>
              <p className="text-lg leading-relaxed text-gray-300">
                {movie.overview}
              </p>
            </div>

            {/* Extra Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-6 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700 delay-500">
              <div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Status
                </h4>
                <p className="text-white font-medium">{movie.status}</p>
              </div>

              {type === "movie" ? (
                <>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                      Budget
                    </h4>
                    <p className="text-white font-medium">
                      {movie.budget
                        ? `$${(movie.budget / 1000000).toFixed(1)}M`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                      Revenue
                    </h4>
                    <p className="text-white font-medium">
                      {movie.revenue
                        ? `$${(movie.revenue / 1000000).toFixed(1)}M`
                        : "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                      Seasons
                    </h4>
                    <p className="text-white font-medium">
                      {movie.number_of_seasons || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                      Episodes
                    </h4>
                    <p className="text-white font-medium">
                      {movie.number_of_episodes || "N/A"}
                    </p>
                  </div>
                </>
              )}

              <div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Production
                </h4>
                <p
                  className="text-white font-medium truncate"
                  title={movie.production_companies?.[0]?.name}
                >
                  {movie.production_companies?.[0]?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TV Show Season & Episode Selection - Moved outside the info flex container to span full width */}
        {type === "tv" && movie?.seasons && (
          <div className="mb-12 animate-in fade-in duration-1000 delay-600 border-t border-white/5 pt-12">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-[4px] h-8 bg-[#ad8eff] rounded-full shadow-[0_0_15px_rgba(173,142,255,0.5)]" />
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  Episodes
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Season Select */}
                <div className="relative group">
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(Number(e.target.value));
                      setSelectedEpisode(1);
                    }}
                    className="appearance-none bg-white/[0.05] border border-white/10 text-white text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl outline-none cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20 focus:border-[#ae8fff]/50"
                  >
                    {movie.seasons
                      .filter((s) => s.season_number > 0)
                      .map((season) => (
                        <option
                          key={season.id}
                          value={season.season_number}
                          className="bg-[#030014] text-white"
                        >
                          Season {season.season_number}
                        </option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Episode Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
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
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search episode..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 text-white text-sm font-medium py-2.5 pl-11 pr-4 rounded-xl outline-none transition-all focus:bg-white/[0.08] focus:border-[#ae8fff]/50 placeholder:text-white/20"
                  />
                </div>

                {/* Sort Toggle */}
                <button
                  onClick={() =>
                    setEpisodeSort((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className={`p-2.5 rounded-xl border transition-all ${
                    episodeSort === "desc"
                      ? "bg-[#ae8fff]/20 border-[#ae8fff]/40 text-[#ae8fff]"
                      : "bg-white/[0.05] border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  }`}
                  title={
                    episodeSort === "asc"
                      ? "Sort Descending"
                      : "Sort Ascending"
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-2 hide-scrollbar border-t border-white/5 pt-6">
              {isEpisodesLoading ? (
                <div className="py-20">
                  <Spinner />
                </div>
              ) : (
                episodes
                  .filter((ep) =>
                    ep.name
                      .toLowerCase()
                      .includes(episodeSearch.toLowerCase()),
                  )
                  .sort((a, b) =>
                    episodeSort === "asc"
                      ? a.episode_number - b.episode_number
                      : b.episode_number - a.episode_number,
                  )
                  .map((episode) => (
                    <button
                      key={episode.id}
                      onClick={() => {
                        setSelectedEpisode(episode.episode_number);
                        playerContainerRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }}
                      className={`flex flex-col lg:flex-row items-stretch gap-8 p-5 lg:p-7 rounded-xl border transition-all text-left group/ep relative overflow-hidden min-h-[170px] ${
                        selectedEpisode === episode.episode_number
                          ? "bg-white/[0.05] border-[#ae8fff]/40 shadow-[0_0_30px_rgba(174,143,255,0.1)]"
                          : "bg-[#0a0a0a] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                      }`}
                    >
                      {/* Active Indicator Line */}
                      {selectedEpisode === episode.episode_number && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ad8eff] shadow-[0_0_10px_rgba(173,142,255,0.8)]" />
                      )}

                      {/* Thumbnail */}
                      <div className="relative w-full lg:w-[240px] aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 shadow-lg self-center">
                        <img
                          src={
                            episode.still_path
                              ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                              : "/no-movie.png"
                          }
                          alt={episode.name}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover/ep:scale-105 ${
                            selectedEpisode === episode.episode_number
                              ? "opacity-100"
                              : "opacity-60 group-hover/ep:opacity-100"
                          }`}
                        />

                        {/* Episode Number Badge */}
                        <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white/40 border border-white/10">
                          EP {episode.episode_number}
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 flex flex-col justify-center py-1">
                        <h4
                          className={`text-xl lg:text-2xl font-bold mb-1 transition-colors ${
                            selectedEpisode === episode.episode_number
                              ? "text-[#ae8fff]"
                              : "text-[#ad8eff] group-hover:text-[#ad8eff]/80"
                          }`}
                        >
                          {episode.name}
                        </h4>

                        <div className="flex items-center gap-2 mb-3 text-xs text-white/30 font-medium">
                          {episode.runtime && (
                            <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                              {episode.runtime} min
                            </span>
                          )}
                          {episode.air_date && (
                            <span className="opacity-50 tracking-widest uppercase">
                              {episode.air_date.replaceAll("-", " / ")}
                            </span>
                          )}
                        </div>

                        <p className="text-sm lg:text-base text-white/50 line-clamp-2 leading-relaxed">
                          {episode.overview ||
                            "No description available for this episode."}
                        </p>
                      </div>

                      {/* Download Icon (Far Right) */}
                      <div
                        className={`hidden lg:flex items-center justify-center p-3 self-center transition-all duration-300 ${
                          selectedEpisode === episode.episode_number
                            ? "text-[#ae8fff] scale-105"
                            : "text-white/10 group-hover/ep:text-white/30"
                        }`}
                      >
                        <svg
                          className="w-7 h-7"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Top Cast Section */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <div className="animate-in fade-in duration-1000 delay-700 border-t border-white/5 pt-12">
            <h3 className="text-2xl font-bold mb-6 text-white/90">Top Cast</h3>
            <div className="flex overflow-x-auto gap-5 pb-6 snap-x hide-scrollbar">
              {movie.credits.cast.slice(0, 10).map((actor, idx) => (
                <div
                  key={actor.id}
                  className="flex-none w-[140px] snap-start group/cast"
                >
                  <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/5 aspect-[2/3] mb-3 shadow-lg">
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                          : "/no-movie.png"
                      }
                      alt={actor.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/cast:scale-110"
                    />
                  </div>
                  <h5
                    className="font-bold text-sm text-white truncate group-hover/cast:text-[#ae8fff] transition-colors"
                    title={actor.name}
                  >
                    {actor.name}
                  </h5>
                  <p
                    className="text-xs text-gray-400 truncate"
                    title={actor.character}
                  >
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations Section */}
        {movie.recommendations?.results &&
          movie.recommendations.results.filter((m) => m.poster_path).length > 0 && (
            <div className="animate-in fade-in duration-1000 delay-800 border-t border-white/5 pt-12 mt-12 mb-20 px-0">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-[4px] h-8 bg-[#ad8eff] rounded-full shadow-[0_0_15px_rgba(173,142,255,0.5)]" />
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  You Might Like
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                {movie.recommendations.results
                  .filter((m) => m.poster_path)
                  .slice(0, 12)
                  .map((rec) => (
                    <MovieCard 
                      key={rec.id} 
                      movie={rec} 
                      type={type} 
                    />
                  ))}
              </div>
            </div>
          )}
      </div>
    </main>
  );
};

export default MovieDetails;
