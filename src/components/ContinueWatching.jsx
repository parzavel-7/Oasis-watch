import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { removeFromWatchHistory } from "../supabase";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_API = "https://api.themoviedb.org/3";

const ContinueWatching = ({ history }) => {
  const rowRef = useRef(null);
  const [enrichedHistory, setEnrichedHistory] = useState([]);
  const hasHistory = history && history.length > 0;
  const { user } = useAuth();

  const handleRemove = async (e, movieId, rowId) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically update the UI
    setEnrichedHistory((prev) => prev.filter((item) => item.movie_id !== movieId));

    // Remove from database
    if (user && user.id) {
      await removeFromWatchHistory(user.id, movieId, rowId);
    }
  };

  // Enrich history with backdrops if they are missing
  useEffect(() => {
    if (!hasHistory) return;

    const enrich = async () => {
      const results = await Promise.all(
        history.map(async (item) => {
          if (item.backdrop_url) return item;

          try {
            const res = await fetch(`${TMDB_API}/movie/${item.movie_id}`, {
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${API_KEY}`,
              },
            });
            const data = await res.json();
            return {
              ...item,
              backdrop_url: data.backdrop_path
                ? `https://image.tmdb.org/t/p/w780/${data.backdrop_path}`
                : item.poster_url,
            };
          } catch {
            return { ...item, backdrop_url: item.poster_url };
          }
        })
      );
      setEnrichedHistory(results);
    };

    enrich();
  }, [history, hasHistory]);

  if (!hasHistory) {
     // Elegant "Empty" state instead of mock data
     return (
       <div className="w-full mt-6 mb-12 p-10 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center text-center animate-in fade-in duration-1000">
         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
         </div>
         <h3 className="text-white font-bold text-lg mb-1">Your journey starts here</h3>
         <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-black">Watch a movie to see it in your timeline</p>
       </div>
     );
  }

  const displayItems = enrichedHistory.length > 0 ? enrichedHistory : history;

  const scroll = (direction) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({
        left: direction === "left" ? -420 : 420,
        behavior: "smooth",
      });
    }
  };

  const mockTimes = ["38:20", "12:40", "1:32:20", "1:32:40", "54:10", "1:12:30", "22:05", "47:55"];
  const progressValues = [72, 18, 48, 61, 35, 85, 55, 42];

  return (
    <section className="w-full mt-6 mb-4">
      <div className="flex items-center gap-3 mb-5 px-1">
        <div className="w-[3px] h-7 bg-[#bea7ff] rounded-sm shadow-[0_0_12px_rgba(190,167,255,0.7)]" />
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Continue watching
        </h2>
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -translate-x-5 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:bg-black hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x snap-mandatory"
        >
          {displayItems.map((item, index) => {
            const mockTime = mockTimes[index % mockTimes.length];
            const progress = progressValues[index % progressValues.length];
            const isFirst = index === 0;

            return (
              <Link
                key={item.$id || index}
                to={`/movie/${item.movie_id}`}
                className="flex-none w-[150px] sm:w-[180px] md:w-[210px] snap-start group/card relative rounded-md overflow-hidden bg-[#181818] shadow-2xl transition-all duration-300 hover:scale-[1.04] hover:z-10"
              >
                <div className="w-full aspect-video relative overflow-hidden">
                  <img
                    src={item.backdrop_url || item.poster_url || "/no-movie.png"}
                    alt={item.movie_title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    onError={(e) => {
                      if (e.target.src !== item.poster_url) {
                        e.target.src = item.poster_url || "/no-movie.png";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="text-[8px] sm:text-[9px] font-black tracking-[0.18em] text-white/70 uppercase">
                      MOVIE
                    </span>
                  </div>
                  <div className="absolute bottom-8 left-2 right-10">
                    <p className="text-white text-[11px] sm:text-[12px] font-semibold leading-tight line-clamp-1 drop-shadow-lg">
                      {item.movie_title}
                    </p>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, item.movie_id, item.id || item.$id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover/card:opacity-100 z-30"
                    aria-label="Remove from history"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              </Link>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 translate-x-5 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:bg-black hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default ContinueWatching;
