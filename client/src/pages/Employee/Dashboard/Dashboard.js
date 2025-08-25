import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Check if user has HR access
  const hasHRAccess = user?.roles?.includes('HR') || user?.permissions?.includes('hr_access');
  
  // Quick action functions with golden ratio sizing
  const quickActions = [
    {
      icon: '🍼',
      title: 'Request Childcare',
      desc: 'Book childcare services with certified providers',
      action: () => console.log('Navigate to childcare request')
    },
    {
      icon: '🤱',
      title: 'Request Doula',
      desc: 'Schedule doula support for prenatal/postpartum care',
      action: () => console.log('Navigate to doula request')
    },
    {
      icon: '⏰',
      title: 'Service History',
      desc: 'View past services and provide feedback',
      action: () => console.log('Navigate to service history')
    },
    {
      icon: '⚡',
      title: 'Emergency Care',
      desc: 'Request immediate childcare assistance',
      action: () => console.log('Navigate to emergency request')
    }
  ];
  
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      backgroundColor: 'var(--warm-cream, #faf9f7)',
      minHeight: '100vh'
    }}>
      {/* Employee Header with Golden Ratio */}
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
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            👶
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Merriweather', serif",
              fontSize: 'var(--text-lg, 18px)',
              margin: 0
            }}>
              Welcome, {user?.first_name || 'Employee'}
            </h1>
            <p style={{
              fontSize: 'var(--text-sm, 14px)',
              margin: 0,
              opacity: 0.9
            }}>
              Your hours balance: {user?.hour_balance || '40'} hours
            </p>
          </div>
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
      
      {/* Employee Navigation - Conditional HR Access */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '2px solid var(--light-purple, #8b7aa8)',
        padding: '0 var(--space-2, 16px)'
      }}>
        <div style={{ display: 'flex' }}>
          {[
            { id: 'dashboard', label: '🎯 Dashboard' },
            { id: 'services', label: '🤱 My Services' },
            { id: 'schedule', label: '📅 Schedule' },
            { id: 'preferences', label: '⚙️ Preferences' },
            ...(hasHRAccess ? [{ id: 'hr', label: '👥 HR Portal', isHR: true }] : [])
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
      
      {/* Main Content with Golden Ratio Container */}
      <main style={{
        padding: 'var(--space-3, 42px)',
        maxWidth: `${110 * 8}px`, // Golden ratio container width
        margin: '0 auto'
      }}>
        {activeTab === 'dashboard' && (
          <div>
            {/* Quick Actions Grid with φ proportions */}
            <section style={{ marginBottom: 'var(--space-4, 68px)' }}>
              <h2 style={{
                fontFamily: "'Merriweather', serif",
                fontSize: 'var(--text-xl, 24px)',
                color: 'var(--primary-purple, #3b2352)',
                marginBottom: 'var(--space-2, 16px)'
              }}>
                Quick Actions
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-2, 16px)'
              }}>
                {quickActions.map((action, index) => (
                  <div 
                    key={index}
                    onClick={action.action}
                    style={{
                      backgroundColor: 'white',
                      border: '2px solid var(--light-purple, #8b7aa8)',
                      borderRadius: 'var(--space-1, 10px)',
                      padding: 'var(--space-2, 16px)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1, 10px)',
                      aspectRatio: '1.618', // Golden ratio
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 35, 82, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-1, 10px)' }}>
                      {action.icon}
                    </div>
                    <h4 style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: 'var(--text-base, 16px)',
                      fontWeight: 'bold',
                      margin: '0 0 4px 0',
                      color: 'var(--primary-purple, #3b2352)'
                    }}>
                      {action.title}
                    </h4>
                    <p style={{
                      fontSize: 'var(--text-sm, 14px)',
                      color: '#666',
                      margin: 0
                    }}>
                      {action.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Recent Activity */}
            <section>
              <h2 style={{
                fontFamily: "'Merriweather', serif",
                fontSize: 'var(--text-xl, 24px)',
                color: 'var(--primary-purple, #3b2352)',
                marginBottom: 'var(--space-2, 16px)'
              }}>
                Recent Activity
              </h2>
              
              <div style={{
                backgroundColor: 'white',
                border: '2px solid var(--light-purple, #8b7aa8)',
                borderRadius: 'var(--space-1, 10px)',
                padding: 'var(--space-2, 16px)'
              }}>
                <p style={{
                  fontFamily: "'Nunito Sans', sans-serif",
                  color: '#666',
                  textAlign: 'center',
                  margin: 'var(--space-3, 42px) 0'
                }}>
                  No recent activity. Start by requesting a service above!
                </p>
              </div>
            </section>
          </div>
        )}
        
        {activeTab === 'services' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>My Services</h2>
            <p>Service management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>My Schedule</h2>
            <p>Schedule management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'preferences' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>Preferences</h2>
            <p>Preferences management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'hr' && hasHRAccess && (
          <div style={{
            backgroundColor: 'var(--gold-accent, #d4af37)',
            color: 'white',
            border: '2px solid var(--gold-accent, #d4af37)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>HR Portal</h2>
            <p>HR management interface - You have special HR access!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeDashboard;