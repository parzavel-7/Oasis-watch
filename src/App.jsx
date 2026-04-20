import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SearchProvider } from "./context/SearchContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./Home.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";

const App = () => {
  return (
    <AuthProvider>
      <SearchProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/tv/:id" element={<MovieDetails />} />
          </Routes>
          <Footer />
        </Router>
      </SearchProvider>
    </AuthProvider>
  );
};

export default App;
