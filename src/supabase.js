import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- SEARCH / TRENDING ---

/**
 * Updates search count in Supabase. Uses RPC or upsert.
 */
export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // Check if entry exists
    const { data: existing, error: fetchError } = await supabase
      .from("movie_search_counts")
      .select("*")
      .eq("search_term", searchTerm)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 is 'no rows'
      throw fetchError;
    }

    if (existing) {
      await supabase
        .from("movie_search_counts")
        .update({ count: existing.count + 1, last_searched_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("movie_search_counts")
        .insert({
          search_term: searchTerm,
          count: 1,
          movie_id: movie.id,
          poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
        });
    }
  } catch (error) {
    console.error("Supabase updateSearchCount error:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const { data, error } = await supabase
      .from("movie_search_counts")
      .select("*")
      .order("count", { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase getTrendingMovies error:", error);
    return [];
  }
};

// --- AUTHENTICATION HELPERS ---

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch (error) {
    return null;
  }
};

// --- WATCH HISTORY ---

export const saveWatchHistory = async (userId, movie, mediaType = "movie", lastSeason = 1, lastEpisode = 1) => {
  if (!userId) return;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w780/${movie.backdrop_path}`
    : `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;

  try {
    // Find existing entry regardless of media_type to prevent duplicates from legacy data
    const { data: existing } = await supabase
      .from("watch_history")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movie.id.toString())
      .maybeSingle();

    const historyData = {
      user_id: userId,
      movie_id: movie.id.toString(),
      movie_title: movie.title || movie.name,
      poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
      backdrop_url: backdropUrl,
      timestamp: new Date().toISOString(),
      last_position: 0,
      media_type: mediaType,
      last_season: mediaType === "tv" ? lastSeason : null,
      last_episode: mediaType === "tv" ? lastEpisode : null
    };

    let result;
    if (existing) {
      result = await supabase.from("watch_history").update(historyData).eq("id", existing.id);
    } else {
      result = await supabase.from("watch_history").insert(historyData);
    }

    // If save failed (e.g. missing last_season/last_episode columns), retry without those fields
    if (result.error) {
      const { last_season, last_episode, ...basicData } = historyData;
      if (existing) {
        await supabase.from("watch_history").update(basicData).eq("id", existing.id);
      } else {
        await supabase.from("watch_history").insert(basicData);
      }
    }
  } catch (error) {
    console.error("Supabase saveWatchHistory error:", error);
  }
};

export const getWatchHistory = async (userId) => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase getWatchHistory error:", error);
    return [];
  }
};

export const removeFromWatchHistory = async (userId, movieId, rowId, mediaType = "movie") => {
  if (!userId || !movieId) return;
  try {
    if (rowId) {
      // Direct primary key deletion is the most robust target mechanism
      const { error } = await supabase.from("watch_history").delete().eq("id", rowId);
      if (error) throw error;
      return;
    }

    // Try deleting with string type fallback
    const { error } = await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .eq("media_type", mediaType);

    if (error) throw error;
  } catch (error) {
    console.error("Supabase removeFromWatchHistory error:", error);
  }
};

// --- WISHLIST / MY LIST ---

export const addToWishlist = async (userId, movie) => {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("wishlist")
      .upsert({
        user_id: userId,
        movie_id: movie.id.toString(),
        movie_data: movie, // Store full movie data for easier retrieval
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, movie_id'
      });
    if (error) throw error;
  } catch (error) {
    console.error("Supabase addToWishlist error:", error);
    throw error;
  }
};

export const removeFromWishlist = async (userId, movieId) => {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId.toString());
    if (error) throw error;
  } catch (error) {
    console.error("Supabase removeFromWishlist error:", error);
    throw error;
  }
};

export const getWishlist = async (userId) => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase getWishlist error:", error);
    return [];
  }
};

export const isInWishlist = async (userId, movieId) => {
  if (!userId || !movieId) return false;
  try {
    const { data, error } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movieId.toString())
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return !!data;
  } catch (error) {
    console.error("Supabase isInWishlist error:", error);
    return false;
  }
};

