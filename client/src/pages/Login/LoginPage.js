import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryLight});
`;

const LoginCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.xl};
  width: 100%;
  max-width: 400px;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoginPage = () => {
  const { login, isAuthenticated, user, isLoading, getRedirectPath } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated && user && !isLoading) {
    return <Navigate to={getRedirectPath(user.user_role)} replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(formData);
      if (result.success) {
        // AuthContext will handle redirect
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <LoginContainer>
        <div className="loading-spinner" />
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Snug & Kisses</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Healthcare Platform Login
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" style={{ marginRight: '0.5rem' }} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </LoginForm>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>Demo Credentials:</p>
          <p>Employee: employee@demo.com / password</p>
          <p>Admin: admin@demo.com / password</p>
          <p>Contractor: contractor@demo.com / password</p>
          <p>Client: client@demo.com / password</p>
        </div>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;