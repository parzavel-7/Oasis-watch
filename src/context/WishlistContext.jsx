import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getWishlist, addToWishlist, removeFromWishlist, isInWishlist as checkInWishlist } from '../supabase';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getWishlist(user.id);
      setWishlist(data.map(item => item.movie_data));
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (movie) => {
    if (!user) {
      showToast("Please login to save movies", "info");
      return;
    }

    const isCurrentlyIn = wishlist.some(m => Number(m.id) === Number(movie.id));
    
    // Optimistic Update
    const previousWishlist = [...wishlist];
    if (isCurrentlyIn) {
      setWishlist(prev => prev.filter(m => m.id !== movie.id));
    } else {
      setWishlist(prev => [movie, ...prev]);
    }

    try {
      if (isCurrentlyIn) {
        await removeFromWishlist(user.id, movie.id);
        showToast("Removed from My List", "success");
      } else {
        await addToWishlist(user.id, movie);
        showToast("Added to My List", "success");
      }
    } catch (error) {
      // Rollback on error
      setWishlist(previousWishlist);
      showToast("Error updating wishlist", "error");
    }
  };

  const isInWishlist = useCallback((movieId) => {
    if (!movieId) return false;
    return wishlist.some(m => Number(m.id) === Number(movieId));
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, isLoading, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
