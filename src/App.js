import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import TextType from './TextType';
import BackgroundText from './randombgtext'; 
import DotGrid from './DotGrid';
import { BrowserRouter, Routes, Route, Link ,useLocation } from 'react-router-dom';
import Projects from './Projects';
function Home() {
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
  </div>
)}
   {/*}  <DotGrid
    baseColor="#3a3446"
    activeColor="#ffffff"
    shape="circle"
    dotSize={5}
    gap={18}
    proximity={140}
    strength={1}
    bounce={0.6}
    tension={0.4}
    returnDuration={0.8}
    shockRadius={320}
    shockStrength={5}
    swell={0.8}
    stretch={0.5}
    glow={0.5}
    fade={0}
    intro
    opacity={1}
    mouseInteraction
    clickShock
/>Its here, refuses to work ignore*/}
      <BackgroundText/>
      
    
     
     <head>

      
      
      <link rel="icon" type="image/jpeg" href="/main_logo.jpeg" /> 
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Coding Club</title>

    </head>

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
  <a
    href="#home"
    tabIndex={menuOpen ? 0 : -1}
    onClick={() => setMenuOpen(false)}
  >
    Home
  </a>

 <Link
  to="/projects"
  tabIndex={menuOpen ? 0 : -1}
  onClick={() => setMenuOpen(false)}
>
  Projects
</Link>

  <a
    href="#contact"
    tabIndex={menuOpen ? 0 : -1}
    onClick={() => setMenuOpen(false)}
  >
    Contact Us
  </a>
</aside>

  <main>
  
  <section className="hero">
    
    <h1 className="hero-title">
         <TextType
  text={["Coding Club", "Happy coding!"]}
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
   

    <div className="hero-actions">
      <a href="#bulletin" className="hero-btn bulletin-btn">
        View Bulletin
      </a>
      <Link to="/projects" className="hero-btn project-btn">
  Explore Projects
</Link>
    </div>
    
  </section>

  <section id="bulletin" className="bulletin">
    <h2 className="section-title">Bulletin</h2>

    <details className="bulletin-drop">
      <summary>Latest update</summary>
      <p>Update</p>
    </details>
  </section>

  <section className="events">
    <div className="event-card upcoming">
      <h2>Upcoming Events</h2>
      <div className="event-items">
        <div className="event-item">Event</div>
      </div>
    </div>

    <div className="event-card running">
      <h2>Running Events</h2>
      <div className="event-items">
        <div className="event-item">Event</div>
      </div>
    </div>
  </section>

  <section id="projects" className="projects">
    <h2 className="section-title">Projects</h2>

    <div className="project-list">
      <div className="project-card">
        <h3>Project</h3>
      </div>
    </div>
  </section>
</main>
<section id="contact" className="contact">
  <h2 className="section-title">CONTACT US</h2>

  <form className="contact-form">
    <div className="contact-field">
      <label htmlFor="contact-name">Name</label>
      <input
        type="text"
        id="contact-name"
        placeholder="Your name"
      />
    </div>

    <div className="contact-field">
      <label htmlFor="contact-email">Email</label>
      <input
        type="email"
        id="contact-email"
        placeholder="Your email address"
      />
    </div>

    <div className="contact-field">
      <label htmlFor="contact-description">Description</label>
      <textarea
        id="contact-description"
        placeholder="Write your message..."
        rows="5"
      ></textarea>
    </div>

    <button type="button" className="contact-btn">
      Submit
    </button>
  </form>
</section>

   </div>
   
  );
}
/*router  stuff*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;