import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const MovieCard = ({
  movie: {
    id,
    title,
    name,
    vote_average,
    poster_path,
    release_date,
    first_air_date,
    original_language,
  },
  type = "movie",
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    let timer;
    if (isHovering) {
      timer = setTimeout(() => {
        fetchTrailer();
      }, 1000); // 1 second delay
    } else {
      setTrailerUrl(null);
    }
    return () => clearTimeout(timer);
  }, [isHovering]);

  const fetchTrailer = async () => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${type === 'tv' ? 'tv' : 'movie'}/${id}/videos`, {
        headers: { accept: "application/json", Authorization: `Bearer ${API_KEY}` }
      });
      const data = await res.json();
      const trailer = data.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`);
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
    }
  };

  const movie = { id, title, name, vote_average, poster_path, release_date, first_air_date, original_language, media_type: type };
  const inWishlist = isInWishlist(id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(movie);
  };

  return (
    <div 
      className="movie-card group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link to={`/${type === "tv" ? "tv" : "movie"}/${id}`}>
        <div className="relative overflow-hidden rounded-2xl bg-white/5 aspect-[20/27]">
          <img
            src={
              poster_path
                ? `https://image.tmdb.org/t/p/w500/${poster_path}`
                : "/no-movie.png"
            }
            alt={title || name}
            onLoad={() => setIsImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${
              isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
            } group-hover:scale-105 group-hover:opacity-90`}
          />
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
          )}

          {trailerUrl && (
            <div className="absolute inset-0 z-10 animate-in fade-in duration-700 overflow-hidden">
              <iframe
                src={trailerUrl}
                className="absolute top-1/2 left-1/2 w-[300%] h-[100%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                frameBorder="0"
                allow="autoplay; encrypted-media"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}


          {/* Wishlist Button Overlay */}
          <button 
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 ${
              inWishlist 
                ? 'bg-[#b9a0ff] border-[#b9a0ff] text-white shadow-[0_0_15px_rgba(185,160,255,0.4)]' 
                : 'bg-[#b9a0ff]/20 border-white/10 text-white hover:bg-[#b9a0ff]/40 hover:border-white/20'
            }`}
            title={inWishlist ? "Remove from My List" : "Add to My List"}
          >
            {inWishlist ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-4 px-1">
          <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-[#ae8fff] transition-colors">{title || name}</h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm">
              <img src="/star.svg" alt="star icon" className="size-3.5" />
              <p className="font-bold text-white leading-none">{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
            </div>

            <span className="text-white/30 font-bold ml-[-4px]">•</span>
            <p className="text-white/60 font-medium tracking-tight bg-white/5 px-2 py-0.5 rounded-md uppercase text-[10px]">
              {original_language ? original_language.toUpperCase() : "N/A"}
            </p>

            <span className="text-white/30 font-bold ml-[-4px]">•</span>
            <p className="text-white/60 font-medium">
              {release_date || first_air_date
                ? (release_date || first_air_date).split("-")[0]
                : "N/A"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;
