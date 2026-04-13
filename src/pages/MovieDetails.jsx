import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Spinner from "../components/Spinner.jsx";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
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
      const response = await fetch(`${API_BASE_URL}/movie/${id}?append_to_response=credits`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch movie details");
      }

      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setErrorMessage("Could not load movie details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

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

  return (
    <main className="min-h-screen bg-primary pb-20">
      <div className="pattern" />
      <div className="wrapper relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Player Section */}
        <div
          ref={playerContainerRef}
          onDoubleClick={toggleFullScreen}
          className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl mb-12 border border-white/10 cursor-pointer bg-black"
          title="Double click for Fullscreen"
        >
          <iframe
            src={`https://www.vidking.net/embed/movie/${id}`}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>

        {/* Movie Info Section */}
        <div className="flex flex-col md:flex-row gap-10 text-white">
          {/* Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <img
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "/no-movie.png"
              }
              alt={movie.title}
              className="rounded-3xl shadow-2xl w-full border border-white/10 object-cover"
            />
          </div>

          {/* Details */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-xl text-gray-400 italic mb-6">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <img src="/star.svg" alt="rating" className="w-4 h-4" />
                <span className="text-white font-medium">
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
              <span>•</span>
              <span>{movie.release_date.split("-")[0]}</span>
              <span>•</span>
              <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
              <span>•</span>
              <span>{movie.original_language.toUpperCase()}</span>
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="px-4 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="mb-10">
              <h3 className="text-2xl font-semibold mb-3">Overview</h3>
              <p className="text-lg leading-relaxed text-gray-300">
                {movie.overview}
              </p>
            </div>

            {/* Extra Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div>
                <h4 className="text-gray-400 text-sm font-medium mb-1">Status</h4>
                <p className="text-white font-semibold">{movie.status}</p>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm font-medium mb-1">Budget</h4>
                <p className="text-white font-semibold">
                  {movie.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : "N/A"}
                </p>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm font-medium mb-1">Revenue</h4>
                <p className="text-white font-semibold">
                  {movie.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : "N/A"}
                </p>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm font-medium mb-1">Production</h4>
                <p className="text-white font-semibold truncate" title={movie.production_companies?.[0]?.name}>
                  {movie.production_companies?.[0]?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Top Cast Section */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Top Cast</h3>
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {movie.credits.cast.slice(0, 10).map((actor) => (
                    <div key={actor.id} className="flex-none w-[140px] snap-start">
                      <img
                        src={
                          actor.profile_path
                            ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                            : "/no-movie.png"
                        }
                        alt={actor.name}
                        className="w-full h-[210px] object-cover rounded-xl shadow-lg mb-3 bg-white/5 border border-white/5"
                      />
                      <h5 className="font-semibold text-sm text-white truncate" title={actor.name}>
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
