import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="logo">AI Stone Replacement Tool</h1>
          <p className="tagline">Backend Ready - See Documentation</p>
        </div>
      </header>

      <main className="container main-content">
        <div className="welcome-section">
          <h2>Welcome to the Stone Replacement Tool</h2>
          <p>
            This project includes a complete FastAPI backend with ML pipeline (SAM, MiDaS, SDXL)
            and comprehensive documentation for building the frontend.
          </p>

          <div className="features">
            <div className="feature-card">
              <h3>Backend Ready</h3>
              <p>FastAPI + Celery + Redis with complete ML pipeline</p>
            </div>
            <div className="feature-card">
              <h3>Database Configured</h3>
              <p>Supabase with stone materials catalog</p>
            </div>
            <div className="feature-card">
              <h3>Documentation</h3>
              <p>QUICKSTART.md, ARCHITECTURE.md, and Next.js setup guide</p>
            </div>
          </div>

          <div className="next-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Start the backend: <code>cd backend && docker-compose up</code></li>
              <li>Read QUICKSTART.md for setup instructions</li>
              <li>Follow next-frontend-setup.md for Next.js implementation</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
