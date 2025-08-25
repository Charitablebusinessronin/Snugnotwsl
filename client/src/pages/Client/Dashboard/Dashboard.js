import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../../contexts/AuthContext';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ClientDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Client Portal</h1>
          <p>Welcome, {user?.first_name}!</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          Logout
        </button>
      </Header>
      
      <div className="card">
        <h2>Client Dashboard</h2>
        <p>Client functions:</p>
        <ul>
          <li>Request services</li>
          <li>View service history</li>
          <li>Manage payments</li>
          <li>Emergency contacts</li>
        </ul>
      </div>
    </DashboardContainer>
  );
};

export default ClientDashboard;