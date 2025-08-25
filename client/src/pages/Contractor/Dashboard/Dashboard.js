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

const ContractorDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Contractor Portal</h1>
          <p>Welcome, {user?.first_name}!</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          Logout
        </button>
      </Header>
      
      <div className="card">
        <h2>Contractor Dashboard</h2>
        <p>Contractor functions:</p>
        <ul>
          <li>View available jobs</li>
          <li>Track working hours</li>
          <li>Manage availability</li>
          <li>View payment history</li>
        </ul>
      </div>
    </DashboardContainer>
  );
};

export default ContractorDashboard;