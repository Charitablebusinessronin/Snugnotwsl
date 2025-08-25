import React, { useState } from 'react';

const JobManagement = () => {
  const [activeView, setActiveView] = useState('available');
  
  const mockJobs = [
    {
      id: 1,
      type: 'childcare',
      client: 'Sarah M.',
      date: '2025-08-26',
      time: '9:00 AM - 3:00 PM',
      location: 'Seattle, WA',
      pay: '$180',
      urgency: 'normal',
      description: 'Looking for childcare for 2-year-old during work day'
    },
    {
      id: 2,
      type: 'doula',
      client: 'Maria L.',
      date: '2025-08-27',
      time: '8:00 PM - 6:00 AM',
      location: 'Bellevue, WA',
      pay: '$320',
      urgency: 'high',
      description: 'Postpartum doula support for new mother'
    }
  ];
  
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      backgroundColor: 'var(--warm-cream, #faf9f7)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--primary-purple, #3b2352)',
        color: 'white',
        padding: 'var(--space-2, 16px)',
        marginBottom: 'var(--space-3, 42px)'
      }}>
        <h1 style={{
          fontFamily: "'Merriweather', serif",
          fontSize: 'var(--text-xl, 24px)',
          margin: 0
        }}>
          Job Management
        </h1>
      </header>
      
      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '2px solid var(--light-purple, #8b7aa8)',
        padding: '0 var(--space-2, 16px)',
        marginBottom: 'var(--space-3, 42px)'
      }}>
        <div style={{ display: 'flex' }}>
          {[
            { id: 'available', label: '=Ë Available Jobs' },
            { id: 'assigned', label: ' My Assignments' },
            { id: 'completed', label: '<¯ Completed' },
            { id: 'earnings', label: '=° Earnings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                backgroundColor: activeView === tab.id ? 'var(--primary-purple, #3b2352)' : 'transparent',
                color: activeView === tab.id ? 'white' : 'var(--primary-purple, #3b2352)',
                border: 'none',
                padding: 'var(--space-1, 10px) var(--space-2, 16px)',
                fontSize: 'var(--text-base, 16px)',
                cursor: 'pointer',
                fontFamily: "'Lato', sans-serif"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Content */}
      <main style={{
        padding: '0 var(--space-3, 42px)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {activeView === 'available' && (
          <div>
            <h2 style={{
              fontFamily: "'Merriweather', serif",
              color: 'var(--primary-purple, #3b2352)',
              marginBottom: 'var(--space-2, 16px)'
            }}>
              Available Job Opportunities
            </h2>
            
            <div style={{
              display: 'grid',
              gap: 'var(--space-2, 16px)'
            }}>
              {mockJobs.map(job => (
                <div key={job.id} style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--light-purple, #8b7aa8)',
                  borderRadius: 'var(--space-1, 10px)',
                  padding: 'var(--space-2, 16px)',
                  borderLeftWidth: '6px',
                  borderLeftColor: job.urgency === 'high' ? '#ff4444' : 'var(--gold-accent, #d4af37)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontFamily: "'Lato', sans-serif",
                        fontSize: 'var(--text-lg, 18px)',
                        color: 'var(--primary-purple, #3b2352)',
                        margin: '0 0 8px 0',
                        textTransform: 'capitalize'
                      }}>
                        {job.type} Service - {job.client}
                      </h3>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'var(--space-1, 10px)',
                        marginBottom: 'var(--space-1, 10px)'
                      }}>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm, 14px)' }}>
                          =Å {job.date}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm, 14px)' }}>
                          =P {job.time}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm, 14px)' }}>
                          =Í {job.location}
                        </p>
                        <p style={{ 
                          margin: 0, 
                          fontSize: 'var(--text-sm, 14px)',
                          fontWeight: 'bold',
                          color: 'var(--gold-accent, #d4af37)'
                        }}>
                          =° {job.pay}
                        </p>
                      </div>
                      
                      <p style={{
                        fontSize: 'var(--text-sm, 14px)',
                        color: '#666',
                        margin: '8px 0'
                      }}>
                        {job.description}
                      </p>
                    </div>
                    
                    <button style={{
                      backgroundColor: 'var(--primary-purple, #3b2352)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: "'Lato', sans-serif",
                      fontWeight: 'bold'
                    }}>
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeView !== 'available' && (
          <div style={{
            backgroundColor: 'white',
            border: '2px solid var(--light-purple, #8b7aa8)',
            borderRadius: 'var(--space-1, 10px)',
            padding: 'var(--space-3, 42px)',
            textAlign: 'center'
          }}>
            <h2>Coming Soon</h2>
            <p>This section is under development and will be available soon!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobManagement;