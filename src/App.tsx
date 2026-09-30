import { Header } from "./components/layout/header";
import { MovieListPage } from "./pages/movies/movie-list-page";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <Header />
      <MovieListPage />
    </div>
  );
}

export default App;