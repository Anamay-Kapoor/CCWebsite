import React from 'react';

import './index.css';
import TextType from './TextType';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
function Projects() {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {/*loader code*/
      let timer;
    
      const hideLoader = () => {
        timer = window.setTimeout(() => setLoading(false), 500);
      };
    
      if (document.readyState === "complete") {
        hideLoader();
      } else {
        window.addEventListener("load", hideLoader, { once: true });
      }
    
      return () => {
        window.removeEventListener("load", hideLoader);
        window.clearTimeout(timer);
      };
    }, []);
  return (
    <div className="gradient-bg projects-page">
        <head>

      
      
      <link rel="icon" type="image/jpeg" href="/main_logo.jpeg" /> 
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Coding Club</title>

    </head>
      <header className="projects-header">
         <button
  className="menu-toggle"
  type="button"
  aria-label={menuOpen ? "Close menu" : "Open menu"}
  aria-expanded={menuOpen}
  onClick={() => setMenuOpen(!menuOpen)}
>
  <span></span>
  <span></span>
  <span></span>
</button>
<button
  className={`sidebar-backdrop ${menuOpen ? "visible" : ""}`}
  type="button"
  aria-label="Close menu"
  tabIndex={menuOpen ? 0 : -1}
  onClick={() => setMenuOpen(false)}
></button>

<aside
  className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
  aria-hidden={!menuOpen}
>
  <Link to="/"
  tabIndex={menuOpen ? 0 : -1}
  onClick={() => setMenuOpen(false)}>
          Home
        </Link>
  

 <Link
  to="/projects"
  tabIndex={menuOpen ? 0 : -1}
  onClick={() => setMenuOpen(false)}
>
  Projects
</Link>
<Link to="/#contact" className="contact-link">
  Contact Us
</Link>
</aside>

        <h1 className="projects-title">
            Our Projects from <TextType
          text={["AI/ML","WebDev","GameDev"]}
          typingSpeed={50}
          pauseDuration={1500}
          deletingSpeed={80}
          deleteMode="backspace"
          typeEffect="fade"
          mistakes={0}
          cursorStyle="underscore"
          cursorGlide
          showCursor
          variableSpeed
          cursorColor="#ffffff"
          prefixColor="currentColor"
          cursorBlinkDuration={0.5}
          cursorCharacter="_"
          prefix=""
        /></h1>
      </header>

      <main className="projects-main">
        <div className="project-controls">
          <input
            type="search"
            placeholder="Search projects..."
            aria-label="Search projects"
          />

          <select defaultValue="all" aria-label="Filter by vertical">
            <option value="all">All Verticals</option>
            <option value="frontend">WebDev</option>
            <option value="ai-ml">AI / ML</option>
            <option value="robotics">GameDev</option>
          </select>
        </div>

        <section className="project-grid">
          <article className="listing-card">
            <div className="listing-image">Image</div>

            <div className="listing-content">
              <p className="listing-vertical">Vertical</p>
              <h2>Project Name</h2>
              <p className="listing-description">
                Project description
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Projects;