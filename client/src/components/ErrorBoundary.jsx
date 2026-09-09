import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: '#F7F0E2', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1.5px solid #C49A52',
            padding: '2.5rem',
            maxWidth: '520px',
            boxShadow: '0 8px 24px rgba(11, 53, 45, 0.12)'
          }}>
            <h3 style={{ fontSize: '1.4rem', color: '#0B352D', fontFamily: 'serif', marginBottom: '0.75rem' }}>
              Something unexpected occurred
            </h3>
            <p style={{ color: '#42151B', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              We encountered an issue displaying this part of the kitchen menu. Please reload or continue exploring.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#0B352D',
                  color: '#F8F1DF',
                  border: '1px solid #C49A52',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#C9A24A',
                  color: '#0B352D',
                  border: 'none',
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
