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
  return (
    <div className="movie-card">
      <Link to={`/${type === "tv" ? "tv" : "movie"}/${id}`}>
        <img
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "/no-movie.png"
          }
          alt={title || name}
          className="hover:opacity-80 transition-opacity"
        />

        <div className="mt-4">
          <h3>{title || name}</h3>

          <div className="content">
            <div className="rating">
              <img src="/star.svg" alt="star icon" />

              <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
            </div>

            <span>•</span>
            <p className="lang">{original_language ? original_language.toUpperCase() : "N/A"}</p>

            <span>•</span>
            <p className="year">
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
