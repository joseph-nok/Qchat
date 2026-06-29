import { Component, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route crashed:', error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'Something went wrong.';

    return (
      <div className="dashboard-layout" style={{ background: 'var(--surface)', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
        <div className="qa-runtime-error">
          <span className="material-symbols-outlined">sync_problem</span>
          <h1>Could not load this page</h1>
          <p>{message.includes('Could not find public function') ? 'Convex is still updating the backend functions for this page. Refresh after the deployment finishes.' : message}</p>
          <button type="button" className="modal-submit-btn" onClick={() => window.location.reload()}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
