import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Operations Console caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="admin-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FFF1F2',
              color: '#BE123C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 className="font-royal" style={{ fontSize: '1.4rem', color: '#0B352D', marginBottom: '8px' }}>
              Interface Issue Encountered
            </h2>
            <p style={{ color: '#5C6E6A', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred in the console.'}
            </p>
            <button
              type="button"
              className="btn-gold"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RefreshCw size={15} /> Reload Console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
