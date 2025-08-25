            fontSize: 'var(--text-base)',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              color: 'var(--primary-purple)'
            }}>
              {func.title}
            </h4>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: '#666',
              margin: 0
            }}>
              {func.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

**Deliverables**:
- Employee dashboard with golden ratio proportions
- Conditional HR access interface
- Service request forms with φ sizing
- Mobile-responsive design for all components

### **Task 5.2: Admin Portal Frontend** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 4 days
- **Dependencies**: Employee Portal (5.1)

```typescript
// Admin Portal with HR Always Included
export const AdminPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="admin-portal" style={{
      fontFamily: "'Nunito Sans', sans-serif",
      backgroundColor: 'var(--warm-cream)',
      minHeight: '100vh'
    }}>
      {/* Admin Header with Golden Ratio */}
      <header style={{
        height: 'var(--space-4)', // 68px
        backgroundColor: 'var(--primary-purple)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <div style={{
            width: 'var(--space-3)',
            height: 'var(--space-3)',
            backgroundColor: 'var(--gold-accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            👶
          </div>
          <h1 style={{
            fontFamily: "'Merriweather', serif",
            fontSize: 'var(--text-lg)',
            margin: 0
          }}>
            Admin Dashboard
          </h1>
          <span style={{
            backgroundColor: 'var(--primary-purple)',
            border: '2px solid var(--gold-accent)',
            color: 'var(--gold-accent)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 'bold'
          }}>
            ADMIN
          </span>
        </div>
      </header>
      
      {/* Admin Navigation with HR Always Visible */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '2px solid var(--light-purple)',
        padding: '0 var(--space-2)'
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
                  (tab.isHR ? 'var(--gold-accent)' : 'var(--primary-purple)') : 
                  'transparent',
                color: activeTab === tab.id ? 'white' : 
                  (tab.isHR ? 'var(--gold-accent)' : 'var(--primary-purple)'),
                border: 'none',
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--text-base)',
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
        padding: 'var(--space-3)',
        maxWidth: `${178 * 8}px`, // Wider for admin interface
        margin: '0 auto'
      }}>
        {activeTab === 'dashboard' && <ServiceManagementSection />}
        {activeTab === 'contractors' && <ContractorManagementSection />}
        {activeTab === 'clients' && <ClientManagementSection />}
        {activeTab === 'hr' && <AdminHRSection />}
      </main>
    </div>
  );
};
```

### **Task 5.3: Contractor Portal Frontend** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 3 days
- **Dependencies**: Admin Portal (5.2)

### **Task 5.4: Client Portal Frontend** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: High
- **Timeline**: 3 days
- **Dependencies**: Contractor Portal (5.3)

### **Task 5.5: Shared Component Library** ⏳ PENDING
- **Status**: ⏳ PENDING
- **Priority**: Medium
- **Timeline**: 2 days
- **Dependencies**: All portal frontends

```typescript
// Golden Ratio Component Library for Snug & Kisses
export const SnugButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  ...props 
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: "'Lato', sans-serif",
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    const sizeStyles = {
      small: {
        height: 'var(--space-2)', // 26px
        padding: '0 var(--space-1)',
        fontSize: 'var(--text-sm)'
      },
      default: {
        height: 'var(--space-3)', // 42px  
        padding: '0 var(--space-2)',
        fontSize: 'var(--text-base)'
      },
      large: {
        height: 'var(--button-height)', // 68px
        padding: '0 var(--space-3)',
        fontSize: 'var(--text-lg)'
      }
    };
    
    const variantStyles = {
      primary: {
        backgroundColor: 'var(--primary-purple)',
        color: 'white'
      },
      secondary: {
        backgroundColor: 'var(--light-purple)',
        color: 'var(--primary-purple)'
      },
      accent: {
        backgroundColor: 'var(--gold-accent)',
        color: 'white'
      }
    };
    
    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };
  
  return (
    <button 
      style={getButtonStyles()}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      {...props}
    >
      {children}
    </button>
  );
};

export const SnugCard: React.FC<CardProps> = ({ children, title, icon }) => (
  <div style={{
    backgroundColor: 'white',
    border: '2px solid var(--light-purple)',
    borderRadius: 'var(--space-1)',
    padding: 'var(--space-2)',
    aspectRatio: 'var(--card-aspect)', // Golden ratio
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 4px rgba(59, 35, 82, 0.1)'
  }}>
    {(title || icon) && (
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        marginBottom: 'var(--space-1)',
        borderBottom: '1px solid var(--light-purple)',
        paddingBottom: 'var(--space-1)'
      }}>
        {icon && <span style={{ fontSize: 'var(--text-lg)' }}>{icon}</span>}
        {title && (
          <h3 style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 'var(--text-base)',
            color: 'var(--primary-purple)',
            margin: 0
          }}>
            {title}
          </h3>
        )}
      </header>
    )}
    <div style={{ flex: 1 }}>
      {children}
    </div>
  </div>
);

export const SnugInput: React.FC<InputProps> = ({ label, ...props }) => (
  <div style={{ marginBottom: 'var(--space-2)' }}>
    {label && (
      <label style={{
        display: 'block',
        fontFamily: "'Lato', sans-serif",
        fontSize: 'var(--text-sm)',
        color: 'var(--primary-purple)',
        marginBottom: '4px',
        fontWeight: '600'
      }}>
        {label}
      </label>
    )}
    <input
      style={{
        width: '100%',
        height: 'var(--form-field-height)', // 42px (φ²)
        border: '2px solid var(--light-purple)',
        borderRadius: '6px',
        padding: '0 var(--space-1)',
        fontSize: 'var(--text-base)',
        fontFamily: "'Nunito Sans', sans-serif",
        backgroundColor: 'white',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--primary-purple)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--light-purple)'}
      {...props}
    />
  </div>
);
```

---

## 🎯 **PHASE 5 SUCCESS CRITERIA**

### **By End of Week 5:**
- ✅ **Employee Portal**: Golden ratio design with conditional HR access
- ✅ **Admin Portal**: Management interface with HR always included  
- ✅ **Contractor Portal**: Mobile-optimized job management
- ✅ **Client Portal**: Family-friendly service booking interface
- ✅ **Shared Components**: Reusable φ-based component library
- ✅ **Responsive Design**: All portals work on mobile, tablet, desktop
- ✅ **Brand Consistency**: Snug & Kisses visual identity throughout

### **Ready for Production:**
- All 4 user portals functional and beautiful
- Golden ratio design system implemented
- Mobile-responsive across all devices
- Healthcare-appropriate accessibility compliance
- Performance optimized for user experience

---

## 📋 **IMPLEMENTATION ROADMAP**

**Days 26-27**: Employee portal with conditional HR access  
**Days 28-29**: Admin portal with full management interface  
**Day 30**: Contractor and client portals + shared components  

**Final Result**: Complete Snug & Kisses healthcare platform with golden ratio design system

---

## 🎨 **DESIGN SYSTEM DELIVERABLES**

### **Component Library**
- **SnugButton**: Primary, secondary, accent variants with φ sizing
- **SnugCard**: Golden ratio aspect cards for all content
- **SnugInput**: Form fields with proper φ heights
- **SnugModal**: Dialog boxes with φ proportions
- **SnugNavigation**: Consistent navigation across portals

### **Layout System**
- **Container Widths**: Golden ratio-based responsive breakpoints
- **Grid System**: φ-based column widths and gutters
- **Spacing Scale**: All margins/padding using φ multipliers
- **Typography Scale**: Headers, body text scaled by φ

### **Brand Implementation**
- **Color System**: Primary purple, light purple, gold accent consistently applied
- **Typography**: Merriweather headers, Lato subheads, Nunito Sans body
- **Icon System**: Healthcare-appropriate icons throughout
- **Image Treatment**: Warm, family-focused imagery matching brand

**Complete golden ratio design system ready for development! 🌟**
