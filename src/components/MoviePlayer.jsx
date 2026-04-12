// src/components/MoviePlayer.jsx
import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useParams, Link } from "react-router-dom";
import { databases, Query } from "../appwrite";
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY; // TMDB v4 token

export default function MoviePlayer() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // 1. Fetch TMDB movie details
        const tmdbRes = await fetch(`${API_BASE_URL}/movie/${movieId}`, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        });
        const movieData = await tmdbRes.json();

        if (movieData.success === false) {
          throw new Error(movieData.status_message || "Movie not found");
        }
        setMovie(movieData);

        // 2. Fetch streaming URL from Appwrite
        const appwriteRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.equal("movie_id", movieId)]
        );

        if (appwriteRes.documents.length > 0) {
          setStreamUrl(appwriteRes.documents[0].stream_url);
        } else {
          // fallback public domain movie
          setStreamUrl(
            "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4"
          );
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Failed to load movie. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="animate-pulse text-lg">Loading movie...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <div className="mb-4">
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>

      {movie && (
        <>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{movie.title}</h1>
          <p className="text-gray-400 mb-6">{movie.overview}</p>

          {streamUrl ? (
            <div className="relative pt-[56.25%] mb-6">
              <ReactPlayer
                url={streamUrl}
                controls
                width="100%"
                height="100%"
                className="absolute top-0 left-0"
              />
            </div>
          ) : (
            <p className="text-red-500">No stream available for this movie.</p>
          )}

          {/* Movie details */}
          <div className="flex flex-wrap gap-4 text-gray-500">
            {movie.release_date && <p>Release: {movie.release_date}</p>}
            {movie.runtime && <p>Duration: {movie.runtime} mins</p>}
            {movie.vote_average && <p>Rating: {movie.vote_average}/10</p>}
          </div>
        </>
      )}
    </div>
  );
}
