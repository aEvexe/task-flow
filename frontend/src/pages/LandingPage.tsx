import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">TaskFlow</span>
        <div className="landing-nav-right">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Log in</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">
            Organize your work,<br />
            <span className="landing-title-accent">get more done.</span>
          </h1>
          <p className="landing-subtitle">
            A simple, fast task manager to keep track of everything. Create boards, manage tasks, and stay on top of your projects.
          </p>
          <div className="landing-cta">
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
              {user ? 'Go to Dashboard' : 'Start for free'}
            </Link>
          </div>
        </div>

        <div className="landing-preview">
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-dot dot-todo" />
              <span className="preview-section-title">To Do</span>
            </div>
            <div className="preview-task">
              <span className="preview-checkbox" />
              <span>Design landing page</span>
            </div>
            <div className="preview-task">
              <span className="preview-checkbox" />
              <span>Set up database</span>
            </div>
          </div>
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-dot dot-in-progress" />
              <span className="preview-section-title">In Progress</span>
            </div>
            <div className="preview-task">
              <span className="preview-checkbox preview-checkbox-active" />
              <span>Build auth system</span>
            </div>
          </div>
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-dot dot-done" />
              <span className="preview-section-title">Done</span>
            </div>
            <div className="preview-task preview-task-done">
              <span className="preview-checkbox preview-checkbox-done">
                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span>Project setup</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature">
          <div className="feature-icon">&#9881;</div>
          <h3>Boards</h3>
          <p>Organize tasks into boards for different projects or areas of your life.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">&#10003;</div>
          <h3>Task Status</h3>
          <p>Track progress with To Do, In Progress, and Done statuses.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">&#9889;</div>
          <h3>Fast & Simple</h3>
          <p>No clutter, no complexity. Just add tasks and get things done.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>TaskFlow &mdash; built to help you focus.</p>
      </footer>
    </div>
  );
}
