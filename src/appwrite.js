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
// Helper to safely list documents by trying common user ID attribute names
const listWithFallback = async (userId, collectionId) => {
  const attributesToTry = ["user_id", "userId"];
  let lastError;

  for (const attr of attributesToTry) {
    try {
      // First try with ordering
      try {
        const result = await database.listDocuments(DATABASE_ID, collectionId, [
          Query.equal(attr, userId),
          Query.orderDesc("timestamp"),
          Query.limit(10),
        ]);
        return { documents: result.documents, activeAttr: attr, hasTimestamp: true };
      } catch (orderError) {
        // If ordering fails, it might be because 'timestamp' attribute is missing or not indexed
        if (orderError.message.includes("Attribute not found") || orderError.message.includes("index")) {
          const result = await database.listDocuments(DATABASE_ID, collectionId, [
            Query.equal(attr, userId),
            Query.limit(10),
          ]);
          return { documents: result.documents, activeAttr: attr, hasTimestamp: false };
        }
        throw orderError;
      }
    } catch (error) {
      lastError = error;
      if (!error.message.includes("Attribute not found")) throw error;
    }
  }
  throw lastError;
};

export const saveWatchHistory = async (userId, movie) => {
  if (!userId) return;
  try {
    let activeAttr = "user_id";
    let existing = { documents: [] };
    
    try {
      const res = await listWithFallback(userId, WATCH_HISTORY_COLLECTION_ID);
      existing = { documents: res.documents.filter(doc => doc.movie_id === movie.id.toString()) };
      activeAttr = res.activeAttr;
    } catch (err) {
      // If we can't search, we just proceed and try to create
      console.warn("Could not check for existing history, will attempt to create new entry.");
    }

    const backdropUrl = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780/${movie.backdrop_path}`
      : `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;

    const baseData = {
      [activeAttr]: userId,
      movie_id: movie.id.toString(),
      movie_title: movie.title,
      poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
      timestamp: new Date().toISOString(),
      last_position: 0,
    };

    const saveOrUpdate = async (data) => {
      if (existing.documents.length > 0) {
        return database.updateDocument(
          DATABASE_ID,
          WATCH_HISTORY_COLLECTION_ID,
          existing.documents[0].$id,
          data
        );
      }
      return database.createDocument(
        DATABASE_ID,
        WATCH_HISTORY_COLLECTION_ID,
        ID.unique(),
        data
      );
    };

    try {
      await saveOrUpdate({ ...baseData, backdrop_url: backdropUrl });
    } catch (schemaError) {
      console.warn("Retrying save without backdrop_url - attribute likely missing from schema.");
      await saveOrUpdate(baseData);
    }
  } catch (error) {
    console.error("Critical Save History Error:", error.message);
    if (error.message.includes("Attribute not found")) {
      const attr = error.message.split(":").pop().trim();
      console.error(`ACTION REQUIRED: Add the missing attribute '${attr}' (String) to your 'watch_history' collection in Appwrite.`);
    }
  }
};

export const getWatchHistory = async (userId) => {
  if (!userId) return [];
  
  if (!DATABASE_ID || !WATCH_HISTORY_COLLECTION_ID) {
    console.error("Appwrite config missing. Check .env.local");
    return [];
  }

  try {
    const { documents, hasTimestamp } = await listWithFallback(userId, WATCH_HISTORY_COLLECTION_ID);
    if (!hasTimestamp) {
      console.warn("Watch history is not ordered by time because the 'timestamp' attribute/index is missing.");
    }
    return documents;
  } catch (error) {
    console.error("Appwrite getWatchHistory error:", error.message);
    if (error.message.includes("Attribute not found")) {
      console.error("ACTION REQUIRED: Ensure your 'watch_history' collection has a 'user_id' (or 'userId') String attribute.");
    }
    return [];
  }
};



