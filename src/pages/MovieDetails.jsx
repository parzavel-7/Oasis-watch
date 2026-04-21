import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Spinner from "../components/Spinner.jsx";
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
      const response = await fetch(`${API_BASE_URL}/${type}/${id}?append_to_response=credits`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch details");
      }

      const data = await response.json();
      
      // Standardize title/date for database saving logic
      if (type === "tv") {
        data.title = data.name;
        // Find the first actual season number (skipping specials if they aren't explicitly requested)
        const firstSeason = data.seasons?.find(s => s.season_number > 0)?.season_number || data.seasons?.[0]?.season_number || 1;
        setSelectedSeason(firstSeason);
      }
      
      setMovie(data);

      // Save to watch history if user is logged in
      if (user) {
        saveWatchHistory(user.id, data);
      }
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
      const response = await fetch(`${API_BASE_URL}/tv/${id}/season/${seasonNumber}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      });
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
  }, [id, type, user]);

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
  const displayRuntime = movie.runtime || (movie.episode_run_time ? movie.episode_run_time[0] : 0);

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
            src={type === 'tv' ? `https://www.vidking.net/embed/tv/${id}/${selectedSeason}/${selectedEpisode}` : `https://www.vidking.net/embed/movie/${id}`}
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
                  isPosterLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
                }`}
              />
              {!isPosterLoaded && (
                <div className="absolute inset-0 bg-white/5 animate-pulse" />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col pt-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight animate-in slide-in-from-left-4 duration-700">{displayTitle}</h1>
            {movie.tagline && (
              <p className="text-xl text-gray-400 italic mb-6 animate-in slide-in-from-left-6 duration-700 delay-100">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300 animate-in fade-in duration-1000 delay-200">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                <img src="/star.svg" alt="rating" className="w-4 h-4" />
                <span className="text-white font-medium">
                  {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="opacity-30">•</span>
              <span className="font-medium">{displayDate ? displayDate.split("-")[0] : "N/A"}</span>
              
              {displayRuntime > 0 && (
                <>
                  <span className="opacity-30">•</span>
                  <span className="font-medium">{Math.floor(displayRuntime / 60)}h {displayRuntime % 60}m</span>
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
                  <span key={genre.id} className="px-4 py-1.5 bg-[#ae8fff]/10 text-[#ae8fff] border border-[#ae8fff]/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="mb-10 animate-in fade-in duration-1000 delay-400">
              <h3 className="text-2xl font-bold mb-3 text-white/90">Overview</h3>
              <p className="text-lg leading-relaxed text-gray-300">
                {movie.overview}
              </p>
            </div>

            {/* Extra Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-6 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700 delay-500">
              <div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Status</h4>
                <p className="text-white font-medium">{movie.status}</p>
              </div>
              
              {type === 'movie' ? (
                <>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Budget</h4>
                    <p className="text-white font-medium">
                      {movie.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Revenue</h4>
                    <p className="text-white font-medium">
                      {movie.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Seasons</h4>
                    <p className="text-white font-medium">
                      {movie.number_of_seasons || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Episodes</h4>
                    <p className="text-white font-medium">
                      {movie.number_of_episodes || "N/A"}
                    </p>
                  </div>
                </>
              )}
              
              <div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Production</h4>
                <p className="text-white font-medium truncate" title={movie.production_companies?.[0]?.name}>
                  {movie.production_companies?.[0]?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* TV Show Season & Episode Selection */}
            {type === 'tv' && movie?.seasons && (
              <div className="mb-12 animate-in fade-in duration-1000 delay-600">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white/90">Seasons & Episodes</h3>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-sm">
                    {movie.seasons
                      .filter(s => s.season_number > 0)
                      .map((season) => (
                        <button
                          key={season.id}
                          onClick={() => {
                            setSelectedSeason(season.season_number);
                            setSelectedEpisode(1);
                          }}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            selectedSeason === season.season_number
                              ? "bg-[#ae8fff] text-white shadow-[0_0_15px_rgba(174,143,255,0.4)]"
                              : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          S{season.season_number}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar border-t border-white/5 pt-6">
                  {isEpisodesLoading ? (
                    <div className="col-span-full py-10">
                      <Spinner />
                    </div>
                  ) : (
                    episodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode.episode_number);
                          playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all text-left group/ep ${
                          selectedEpisode === episode.episode_number
                            ? "bg-[#ae8fff]/10 border-[#ae8fff]/40 shadow-[0_0_20px_rgba(174,143,255,0.1)]"
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                          selectedEpisode === episode.episode_number ? "bg-[#ae8fff] text-white" : "bg-white/10 text-white/40 group-hover/ep:text-white"
                        }`}>
                          {episode.episode_number}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-bold text-sm truncate ${selectedEpisode === episode.episode_number ? "text-white" : "text-white/70 group-hover/ep:text-white"}`}>
                            {episode.name}
                          </span>
                          <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                            {episode.air_date ? episode.air_date.split("-")[0] : "N/A"}
                          </span>
                        </div>
                        {selectedEpisode === episode.episode_number && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 rounded-full bg-[#ae8fff] animate-pulse shadow-[0_0_8px_rgba(174,143,255,0.8)]" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Top Cast Section */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
              <div className="animate-in fade-in duration-1000 delay-700">
                <h3 className="text-2xl font-bold mb-6 text-white/90">Top Cast</h3>
                <div className="flex overflow-x-auto gap-5 pb-6 snap-x hide-scrollbar">
                  {movie.credits.cast.slice(0, 10).map((actor, idx) => (
                    <div key={actor.id} className="flex-none w-[140px] snap-start group/cast">
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
                      <h5 className="font-bold text-sm text-white truncate group-hover/cast:text-[#ae8fff] transition-colors" title={actor.name}>
                        {actor.name}
                      </h5>
                      <p className="text-xs text-gray-400 truncate" title={actor.character}>
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MovieDetails;
