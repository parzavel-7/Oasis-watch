import { Client, Databases, ID, Query, Account } from "appwrite";

const client = new Client()
  .setEndpoint("https://syd.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const database = new Databases(client);
export const account = new Account(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID?.trim();
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID?.trim();
const WATCH_HISTORY_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WATCH_HISTORY_COLLECTION_ID?.trim();

if (!DATABASE_ID || !COLLECTION_ID || !WATCH_HISTORY_COLLECTION_ID) {
  console.error("Appwrite environment variables are missing or incorrectly configured.");
}


export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
      });
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Appwrite update error:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.limit(5),
        Query.orderDesc("count")
    ]);
    return result.documents;
  } catch (error) {
    console.error("Appwrite fetch error:", error);
    return [];
  }
};

// --- AUTHENTICATION ---
export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.log("No active session found");
    return null;
  }
};

export const logout = async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// --- WATCH HISTORY ---
export const saveWatchHistory = async (userId, movie) => {
  if (!userId) return;
  try {
    // Check if movie already in history for this user
    const existing = await database.listDocuments(DATABASE_ID, WATCH_HISTORY_COLLECTION_ID, [
      Query.equal("user_id", userId),
      Query.equal("movie_id", movie.id.toString())
    ]);

    const movieData = {
      user_id: userId,
      movie_id: movie.id.toString(),
      movie_title: movie.title,
      poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
      timestamp: new Date().toISOString(),
      last_position: 0 // Placeholder for exact time
    };

    if (existing.documents.length > 0) {
      // Update existing entry (bring to top/update timestamp)
      await database.updateDocument(DATABASE_ID, WATCH_HISTORY_COLLECTION_ID, existing.documents[0].$id, movieData);
    } else {
      // Create new entry
      await database.createDocument(DATABASE_ID, WATCH_HISTORY_COLLECTION_ID, ID.unique(), movieData);
    }
  } catch (error) {
    console.error("Save history error:", error);
  }
};

export const getWatchHistory = async (userId) => {
  if (!userId) return [];
  try {
    const result = await database.listDocuments(DATABASE_ID, WATCH_HISTORY_COLLECTION_ID, [
      Query.equal("user_id", userId),
      Query.orderDesc("timestamp"),
      Query.limit(10)
    ]);
    return result.documents;
  } catch (error) {
    console.error("Get history error:", error);
    return [];
  }
};
