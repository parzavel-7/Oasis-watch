import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./Home.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import Explore from "./pages/Explore.jsx";

const App = () => {
  return (
    <AuthProvider>
      <SearchProvider>
        <ToastProvider>
          <WishlistProvider>
            <Router>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/tv/:id" element={<MovieDetails />} />
                <Route path="/explore/:type/:category" element={<Explore />} />
                <Route path="/explore/:type/:category/:id" element={<Explore />} />
              </Routes>
              <Footer />
            </Router>
          </WishlistProvider>
        </ToastProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

export default App;
