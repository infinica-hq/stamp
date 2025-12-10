import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { init } from "./hooks/useMiniApp";
import { Home } from "./ui/home";
import { Proof } from "./ui/proof";

function App() {
  const location = useLocation();

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to={"/"}>
          <h1 className="app-title">Proof Stamp</h1>
        </Link>

        <nav className="app-nav">
          <NavLink className={({ isActive }) => `app-tab ${isActive ?? "app-tab--active"}`} end to="/">
            Sign
          </NavLink>
          <NavLink className={({ isActive }) => `app-tab ${isActive ?? "app-tab--active"}`} to="/proof">
            Share
          </NavLink>

          <span className="app-nav-highlight" />
        </nav>
      </header>

      <main className="app-main">
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route element={<Home />} path="/" />
            <Route element={<Proof />} path="/proof" />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
