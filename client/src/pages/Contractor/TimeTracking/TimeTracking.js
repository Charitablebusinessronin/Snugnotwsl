import React, { useState } from 'react';

const TimeTracking = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const mockSessions = [
    {
      id: 1,
      client: 'Sarah M.',
      service: 'Childcare',
      date: '2025-08-25',
      startTime: '09:00',
      endTime: '15:00',
      totalHours: 6,
      rate: '$30/hr',
      earnings: '$180',
      status: 'completed'
    },
    {
      id: 2,
      client: 'Maria L.',
      service: 'Doula Support',
      date: '2025-08-24',
      startTime: '20:00',
      endTime: '06:00',
      totalHours: 10,
      rate: '$32/hr',
      earnings: '$320',
      status: 'completed'
    }
  ];
  
  const startSession = (client, service) => {
    setActiveSession({
      client,
      service,
      startTime: new Date(),
      earnings: 0
    });
  };
  
  const endSession = () => {
    setActiveSession(null);
  };
  
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
          Time Tracking
        </h1>
      </header>
      
      {/* Active Session Card */}
      {activeSession ? (
        <div style={{
          backgroundColor: 'var(--gold-accent, #d4af37)',
          color: 'white',
          margin: '0 var(--space-3, 42px) var(--space-3, 42px)',
          padding: 'var(--space-3, 42px)',
          borderRadius: 'var(--space-1, 10px)',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontFamily: "'Merriweather', serif",
            fontSize: 'var(--text-xl, 24px)',
            margin: '0 0 16px 0'
          }}>
            =P Session in Progress
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-2, 16px)',
            marginBottom: 'var(--space-2, 16px)'
          }}>
            <div>
              <p style={{ fontSize: 'var(--text-sm, 14px)', margin: '0 0 4px 0', opacity: 0.9 }}>Client</p>
              <p style={{ fontSize: 'var(--text-lg, 18px)', fontWeight: 'bold', margin: 0 }}>{activeSession.client}</p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm, 14px)', margin: '0 0 4px 0', opacity: 0.9 }}>Service</p>
              <p style={{ fontSize: 'var(--text-lg, 18px)', fontWeight: 'bold', margin: 0 }}>{activeSession.service}</p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm, 14px)', margin: '0 0 4px 0', opacity: 0.9 }}>Started</p>
              <p style={{ fontSize: 'var(--text-lg, 18px)', fontWeight: 'bold', margin: 0 }}>
                {activeSession.startTime.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm, 14px)', margin: '0 0 4px 0', opacity: 0.9 }}>Duration</p>
              <p style={{ fontSize: 'var(--text-lg, 18px)', fontWeight: 'bold', margin: 0 }}>
                2h 15m
              </p>
            </div>
          </div>
          
          <button
            onClick={endSession}
            style={{
              backgroundColor: 'white',
              color: 'var(--gold-accent, #d4af37)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: "'Lato', sans-serif",
              fontWeight: 'bold',
              fontSize: 'var(--text-base, 16px)'
            }}
          >
            ù End Session
          </button>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          border: '2px solid var(--light-purple, #8b7aa8)',
          margin: '0 var(--space-3, 42px) var(--space-3, 42px)',
          padding: 'var(--space-3, 42px)',
          borderRadius: 'var(--space-1, 10px)',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontFamily: "'Merriweather', serif",
            color: 'var(--primary-purple, #3b2352)',
            margin: '0 0 16px 0'
          }}>
            Ready to Start Working
          </h2>
          <p style={{ color: '#666', marginBottom: 'var(--space-2, 16px)' }}>
            Clock in when you begin your service session
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-1, 10px)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => startSession('Next Client', 'Childcare')}
              style={{
                backgroundColor: 'var(--primary-purple, #3b2352)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "'Lato', sans-serif",
                fontWeight: 'bold'
              }}
            >
              ¶ Start Childcare Session
            </button>
            <button
              onClick={() => startSession('Next Client', 'Doula Support')}
              style={{
                backgroundColor: 'var(--gold-accent, #d4af37)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: "'Lato', sans-serif",
                fontWeight: 'bold'
              }}
            >
              ¶ Start Doula Session
            </button>
          </div>
        </div>
      )}
      
      {/* Recent Sessions */}
      <main style={{
        padding: '0 var(--space-3, 42px)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontFamily: "'Merriweather', serif",
          color: 'var(--primary-purple, #3b2352)',
          marginBottom: 'var(--space-2, 16px)'
        }}>
          Recent Sessions
        </h2>
        
        <div style={{
          display: 'grid',
          gap: 'var(--space-2, 16px)'
        }}>
          {mockSessions.map(session => (
            <div key={session.id} style={{
              backgroundColor: 'white',
              border: '2px solid var(--light-purple, #8b7aa8)',
              borderRadius: 'var(--space-1, 10px)',
              padding: 'var(--space-2, 16px)',
              borderLeftWidth: '6px',
              borderLeftColor: session.status === 'completed' ? 'green' : 'var(--gold-accent, #d4af37)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 'var(--space-1, 10px)',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: 'var(--text-lg, 18px)',
                    color: 'var(--primary-purple, #3b2352)',
                    margin: '0 0 4px 0'
                  }}>
                    {session.client}
                  </h3>
                  <p style={{ 
                    fontSize: 'var(--text-sm, 14px)', 
                    color: '#666', 
                    margin: 0 
                  }}>
                    {session.service}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: '#666', margin: '0 0 4px 0' }}>
                    =Å {session.date}
                  </p>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: '#666', margin: 0 }}>
                    =P {session.startTime} - {session.endTime}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: '#666', margin: '0 0 4px 0' }}>
                    Total Hours
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-lg, 18px)', 
                    fontWeight: 'bold', 
                    color: 'var(--primary-purple, #3b2352)', 
                    margin: 0 
                  }}>
                    {session.totalHours}h
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: '#666', margin: '0 0 4px 0' }}>
                    Rate
                  </p>
                  <p style={{ fontSize: 'var(--text-base, 16px)', fontWeight: 'bold', margin: 0 }}>
                    {session.rate}
                  </p>
                </div>
                
                <div>
                  <p style={{ fontSize: 'var(--text-sm, 14px)', color: '#666', margin: '0 0 4px 0' }}>
                    Earnings
                  </p>
                  <p style={{ 
                    fontSize: 'var(--text-lg, 18px)', 
                    fontWeight: 'bold', 
                    color: 'var(--gold-accent, #d4af37)', 
                    margin: 0 
                  }}>
                    {session.earnings}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: session.status === 'completed' ? 'green' : 'orange',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: 'var(--text-xs, 12px)',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {session.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Card */}
        <div style={{
          backgroundColor: 'var(--primary-purple, #3b2352)',
          color: 'white',
          borderRadius: 'var(--space-1, 10px)',
          padding: 'var(--space-3, 42px)',
          marginTop: 'var(--space-3, 42px)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontFamily: "'Merriweather', serif",
            fontSize: 'var(--text-lg, 18px)',
            margin: '0 0 16px 0'
          }}>
            This Week's Summary
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-2, 16px)'
          }}>
            <div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>16</p>
              <p style={{ fontSize: 'var(--text-sm, 14px)', opacity: 0.9, margin: 0 }}>Total Hours</p>
            </div>
            <div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>5</p>
              <p style={{ fontSize: 'var(--text-sm, 14px)', opacity: 0.9, margin: 0 }}>Sessions</p>
            </div>
            <div>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 4px 0' }}>$500</p>
              <p style={{ fontSize: 'var(--text-sm, 14px)', opacity: 0.9, margin: 0 }}>Total Earnings</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimeTracking;