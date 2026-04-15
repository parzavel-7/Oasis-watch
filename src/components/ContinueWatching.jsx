import React from "react";
import { Link } from "react-router-dom";

const ContinueWatching = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <section className="mt-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-1 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Continue <span className="text-gray-400">watching</span>
        </h2>
      </div>

      <div className="relative group/scroll">
        <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar snap-x scroll-smooth">
          {history.map((item, index) => (
            <Link
              key={item.$id || index}
              to={`/movie/${item.movie_id}`}
              className="flex-none w-[300px] sm:w-[350px] aspect-[16/9] relative rounded-2xl overflow-hidden group shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:ring-2 hover:ring-white/20 snap-start"
            >
              {/* Thumbnail */}
              <img
                src={item.poster_url || "/no-movie.png"}
                alt={item.movie_title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              
              {/* Label Tag */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                <span className="text-[10px] font-black tracking-widest text-white uppercase opacity-80">
                  MOVIE
                </span>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Info Bottom */}
              <div className="absolute bottom-4 left-4 right-4">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white truncate max-w-[70%] drop-shadow-lg">
                      {item.movie_title}
                    </h3>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                      <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] font-bold text-white/80 tabular-nums">
                        {/* Mock time since exact position isn't tracked yet */}
                        {index % 2 === 0 ? "42:10" : "1:15:30"}
                      </span>
                    </div>
                 </div>
                 
                 {/* Progress Bar Container */}
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                      className="h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" 
                      style={{ width: `${60 + (index * 15) % 35}%` }} 
                    />
                 </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Scroll Indicators (Optional but nice) */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-0 group-hover/scroll:opacity-100 transition-opacity pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </div>
        </div>
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover/scroll:opacity-100 transition-opacity pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContinueWatching;
