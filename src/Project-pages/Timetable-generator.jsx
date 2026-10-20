import { BrowserRouter, Routes, Route, Link ,useLocation } from 'react-router-dom';
import './projects.css';
import React from 'react';


function TimeTableGen() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      if (!location.hash) return;
    
      const id = location.hash.slice(1);
    
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    }, [location.pathname, location.hash]);
    
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
    <div className="gradient-bg" id="home">
    {loading && (
  <div className="loader-screen" role="status">
    <div className="loader-spinner"></div>
    <span>Loading</span>
  </div>)}
  
     <head>

      
      
      <link rel="icon" type="image/jpeg" href="/main_logo.jpeg" /> 
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Timetable Generator</title>

    </head>
   
    
 <main className="project-page">
     
  <Link to="/projects" className="back-link">
    ← All Projects
  </Link>

  <header className="project-heading">
    
    <h1 className="project-title">TimeTable Generator</h1>

    
  </header>

  <section className="projects-card">
    
    
    <div className="project-content">
      <h2>Project Details</h2>
      <h3 className="language-container">
      <span className="language-box">React</span>
      <span className="language-box">Golang</span>
    </h3>

      <p className="project-description">
        Description: Coding Club's Time Table Generator.
      </p>
    </div>
    
  </section>
<div className="project-image">TimeTable Generator image here</div>
 
   <div className="project-actions">
   
    <a
      href="projecturl"
      className="project-button"
      target="_blank"
      rel="noreferrer"
    >
      Live Project →
    </a>

    <a
      href="githuburl"
      className="project-button"
      target="_blank"
      rel="noreferrer"
    >
      Source Code →
    </a>
  </div>
</main>
  </div>
 

  );
  
}

export default TimeTableGen;