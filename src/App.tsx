import { useEffect } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Home } from './ui/home';
import { Proof } from './ui/proof';
import { init } from './hooks/useMiniApp';

function App() {

  const location = useLocation();

  useEffect(() => {
    init()
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Proof Ping</h1>
        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "app-tab" + (isActive ? " app-tab--active" : "")
            }
          >
            Sign
          </NavLink>
          <NavLink
            to="/proof"
            className={({ isActive }) =>
              "app-tab" + (isActive ? " app-tab--active" : "")
            }
          >
            Share
          </NavLink>

          <span className="app-nav-highlight" />
        </nav>
      </header>

      <main className="app-main">
        <div key={location.pathname} className="page-transition">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/proof" element={<Proof />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}



export default App;
