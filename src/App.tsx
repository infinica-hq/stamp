import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Home } from './ui/home';
import { Moment } from './ui/moment';
import { initMiniApp } from './hooks/useMiniApp';

function App() {

  useEffect(() => {
    initMiniApp()
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Hello!</h1>
        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "app-tab" + (isActive ? " app-tab--active" : "")
            }
          >
            Sign Message 
          </NavLink>
          <NavLink
            to="/moment"
            className={({ isActive }) =>
              "app-tab" + (isActive ? " app-tab--active" : "")
            }
          >
            Share a Moment
          </NavLink>

          {/* highlight MUST be last */}
          <span className="app-nav-highlight" />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/moment" element={<Moment />} />
        </Routes>
      </main>
    </div>
  );
}



export default App;
