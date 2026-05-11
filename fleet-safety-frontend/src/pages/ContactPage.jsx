import React from 'react';
import { Mail, Phone, MapPin, Building, Send } from "lucide-react";

function ContactPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '160px 2rem 100px' }}>
        
        {/* --- PAGE HEADER --- */}
        <div style={{ marginBottom: '80px' }}>
          <span style={{ 
            color: 'var(--color-primary)', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            fontSize: '12px' 
          }}>
            Support & Inquiries
          </span>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
            fontWeight: 900, 
            color: 'var(--color-text-primary)', 
            marginTop: '16px',
            letterSpacing: '-0.04em'
          }}>
            Talk to the <span style={{ color: 'var(--color-primary)' }}>Vigilant</span> Team
          </h1>
          <p style={{ 
            color: 'var(--color-text-muted)', 
            fontSize: '18px', 
            maxWidth: '600px', 
            lineHeight: 1.6,
            marginTop: '12px'
          }}>
            Have questions about Edge-AI deployment or fleet integration? Share your use case and our engineers will help design your workflow.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '60px',
          alignItems: 'start'
        }}>
          
          {/* --- CONTACT FORM --- */}
          <form 
            className="card" 
            style={{ 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px', 
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '32px',
              boxShadow: 'var(--shadow-high)' 
            }} 
            onSubmit={(e) => e.preventDefault()}
          >
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Full Name</label>
              <input 
                type="text" 
                placeholder="Sharjeel Ahmad" 
                style={inputStyle}
                onFocus={(e) => applyFocus(e)}
                onBlur={(e) => applyBlur(e)}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Work Email</label>
              <input 
                type="email" 
                placeholder="name@organization.com" 
                style={inputStyle}
                onFocus={(e) => applyFocus(e)}
                onBlur={(e) => applyBlur(e)}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Message</label>
              <textarea 
                rows="5" 
                placeholder="Describe your fleet size and safety goals..." 
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => applyFocus(e)}
                onBlur={(e) => applyBlur(e)}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ 
                padding: '18px', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px',
                borderRadius: '16px',
                marginTop: '8px'
              }}
            >
              Send Inquiry <Send size={18} />
            </button>
          </form>

          {/* --- INFO CARDS --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <article style={infoCardStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                Technical HQ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ContactItem icon={<Building size={18} />} label="Organization" value="Vigilant Safety Systems" />
                <ContactItem icon={<Mail size={18} />} label="Email" value="support@vigilantdriver.ai" isLink />
                <ContactItem icon={<Phone size={18} />} label="Inquiries" value="+92-300-0000000" />
                <ContactItem icon={<MapPin size={18} />} label="Location" value="Karachi, Pakistan" />
              </div>
            </article>
            
            <article style={{ ...infoCardStyle, padding: '24px' }}>
              <div style={{ 
                width: '100%', 
                height: '220px', 
                borderRadius: '20px', 
                overflow: 'hidden', 
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)' 
              }}>
                <iframe
                  title="FAST NUCES Karachi"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3618.010836511041!2d67.26219357595304!3d24.846430345401183!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb330be086f6a7d%3A0x6d85918737604675!2sFAST%20National%20University%20of%20Computer%20and%20Emerging%20Sciences!5e0!3m2!1sen!2s!4v1715456200000!5m2!1sen!2s"
                  loading="lazy"
                  style={{ width: '100%', height: '100%', border: 'none', filter: 'grayscale(0.5) contrast(1.2)' }}
                  allowFullScreen
                />
              </div>
              <p style={{ 
                marginTop: '16px', 
                textAlign: 'center', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                FAST NUCES • Karachi Campus
              </p>
            </article>

          </div>
        </div>
      </section>
    </div>
  );
}

// --- STYLES & HELPERS ---

const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };

const labelStyle = { 
  fontSize: '13px', 
  fontWeight: 800, 
  color: 'var(--color-text-primary)', 
  textTransform: 'uppercase', 
  letterSpacing: '0.5px' 
};

const inputStyle = { 
  padding: '14px 18px', 
  borderRadius: '14px', 
  border: '1px solid var(--color-border)', 
  background: 'var(--color-bg)', 
  color: 'var(--color-text-primary)', 
  fontSize: '15px',
  fontWeight: 500,
  outline: 'none', 
  transition: 'all 0.2s ease' 
};

const infoCardStyle = { 
  padding: '32px', 
  background: 'var(--color-surface)', 
  border: '1px solid var(--color-border)', 
  borderRadius: '28px',
  boxShadow: 'var(--shadow-small)' 
};

const applyFocus = (e) => {
  e.target.style.borderColor = 'var(--color-primary)';
  e.target.style.boxShadow = '0 0 0 4px var(--color-primary-soft)';
};

const applyBlur = (e) => {
  e.target.style.borderColor = 'var(--color-border)';
  e.target.style.boxShadow = 'none';
};

const ContactItem = ({ icon, label, value, isLink }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ 
      width: '38px', height: '38px', 
      background: 'var(--color-bg)', 
      borderRadius: '10px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      color: 'var(--color-primary)',
      border: '1px solid var(--color-border)' 
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: isLink ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{value}</p>
    </div>
  </div>
);

export default ContactPage;