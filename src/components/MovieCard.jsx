import { useState } from "react";
import { Link } from "react-router-dom";

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

  return (
    <div className="movie-card group">
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
