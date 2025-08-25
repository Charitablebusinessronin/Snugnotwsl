import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      backgroundColor: 'var(--warm-cream, #faf9f7)',
      minHeight: '100vh'
    }}>
      {/* Admin Header with Golden Ratio */}
      <header style={{
        height: 'var(--header-height, 68px)',
        backgroundColor: 'var(--primary-purple, #3b2352)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-2, 16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1, 10px)' }}>
          <div style={{
            width: 'var(--space-3, 42px)',
            height: 'var(--space-3, 42px)',
            backgroundColor: 'var(--gold-accent, #d4af37)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            👶
          </div>
          <h1 style={{
            fontFamily: "'Merriweather', serif",
            fontSize: 'var(--text-lg, 18px)',
            margin: 0
          }}>
            Admin Dashboard
          </h1>
          <span style={{
            backgroundColor: 'var(--primary-purple, #3b2352)',
            border: '2px solid var(--gold-accent, #d4af37)',
            color: 'var(--gold-accent, #d4af37)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: 'var(--text-xs, 12px)',
            fontWeight: 'bold'
          }}>
            ADMIN
          </span>
        </div>
        
        <button 
          onClick={logout}
          style={{
            backgroundColor: 'transparent',
            border: '2px solid var(--gold-accent, #d4af37)',
            color: 'var(--gold-accent, #d4af37)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: "'Lato', sans-serif",
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </header>
      
      {/* Admin Navigation with HR Always Visible */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '2px solid var(--light-purple, #8b7aa8)',
        padding: '0 var(--space-2, 16px)'
      }}>
        <div style={{ display: 'flex' }}>
          {[
            { id: 'dashboard', label: '🎯 Service Management' },
            { id: 'contractors', label: '🔧 Contractor Management' },
            { id: 'clients', label: '👥 Client Management' },
            { id: 'hr', label: '👥 HR Management', isHR: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? 
                  (tab.isHR ? 'var(--gold-accent, #d4af37)' : 'var(--primary-purple, #3b2352)') : 
                  'transparent',
                color: activeTab === tab.id ? 'white' : 
                  (tab.isHR ? 'var(--gold-accent, #d4af37)' : 'var(--primary-purple, #3b2352)'),
                border: 'none',
                padding: 'var(--space-1, 10px) var(--space-2, 16px)',
                fontSize: 'var(--text-base, 16px)',
                cursor: 'pointer',
                fontFamily: "'Lato', sans-serif",
                fontWeight: tab.isHR ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Admin Content */}
      <main style={{
        padding: 'var(--space-3, 42px)',
        maxWidth: `${178 * 8}px`, // Wider for admin interface
        margin: '0 auto'
      }}>
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{
              fontFamily: "'Merriweather', serif",
              fontSize: 'var(--text-xl, 24px)',
              color: 'var(--primary-purple, #3b2352)',
              marginBottom: 'var(--space-3, 42px)'
            }}>
              Service Management Dashboard
            </h2>
            
            {/* Service Management Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-2, 16px)'
            }}>
              {[
                { title: 'Active Service Requests', value: '24', icon: '📝', color: 'var(--primary-purple, #3b2352)' },
                { title: 'Available Contractors', value: '156', icon: '👥', color: 'var(--gold-accent, #d4af37)' },
                { title: 'Completed Services', value: '1,284', icon: '✅', color: 'green' },
                { title: 'Pending Reviews', value: '8', icon: '⭐', color: 'orange' }
              ].map((metric, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--light-purple, #8b7aa8)',
                  borderRadius: 'var(--space-1, 10px)',
                  padding: 'var(--space-2, 16px)',
                  textAlign: 'center',
                  aspectRatio: '1.618'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: 'var(--space-1, 10px)' }}>
                    {metric.icon}
                  </div>
                  <h3 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: metric.color,
                    margin: '0 0 8px 0'
                  }}>
                    {metric.value}
                  </h3>
                  <p style={{
                    fontSize: 'var(--text-sm, 14px)',
                    color: '#666',
                    margin: 0
                  }}>
                    {metric.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'contractors' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>Contractor Management</h2>
            <p>Manage service providers, approvals, and performance metrics</p>
          </div>
        )}
        
        {activeTab === 'clients' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>Client Management</h2>
            <p>Manage client accounts, preferences, and service history</p>
          </div>
        )}
        
        {activeTab === 'hr' && (
          <div style={{
            backgroundColor: 'var(--gold-accent, #d4af37)',
            color: 'white',
            border: '2px solid var(--gold-accent, #d4af37)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>HR Management Portal</h2>
            <p>Comprehensive HR functions always available for Admin users</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-2, 16px)',
              marginTop: 'var(--space-3, 42px)'
            }}>
              {[
                'Employee Management',
                'Benefits Administration', 
                'Usage Reports',
                'Compliance Monitoring'
              ].map((hrFunction, index) => (
                <div key={index} style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: 'var(--space-2, 16px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  {hrFunction}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;