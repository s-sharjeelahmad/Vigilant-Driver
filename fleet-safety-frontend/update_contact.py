import re

with open('src/pages/ContactPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """import SectionHeader from "../components/SectionHeader";

function ContactPage() {
  return (
    <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <span className="ds-label" style={{ color: 'var(--color-primary)' }}>Contact</span>
        <h1 className="ds-display-medium" style={{ margin: '0.5rem 0 1rem 0', color: 'var(--color-text-primary)' }}>Talk to the Vigilant Driver Team</h1>
        <p className="ds-body" style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Share your use case and we will help you design a safer monitoring workflow.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem' }}>
        <form className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-high)' }} onSubmit={(e) => e.preventDefault()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="ds-label" style={{ color: 'var(--color-text-primary)' }}>Name</label>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="ds-label" style={{ color: 'var(--color-text-primary)' }}>Email</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="ds-label" style={{ color: 'var(--color-text-primary)' }}>Message</label>
            <textarea 
              rows="5" 
              placeholder="Tell us about your fleet and goals" 
              style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: '1rem' }}>Send Message</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <article className="card" style={{ padding: '2rem' }}>
            <h3 className="ds-heading-2" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>Company Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div className="ds-label">Organization</div>
                <div className="ds-body">Vigilant Driver Safety Systems</div>
              </div>
              <div>
                <div className="ds-label">Email</div>
                <div className="ds-body" style={{ color: 'var(--color-primary)' }}>support@vigilantdriver.ai</div>
              </div>
              <div>
                <div className="ds-label">Phone</div>
                <div className="ds-body tabular-nums">+92-300-0000000</div>
              </div>
              <div>
                <div className="ds-label">Location</div>
                <div className="ds-body">Karachi, Pakistan</div>
              </div>
            </div>
          </article>
          
          <article className="card" style={{ padding: '2rem' }}>
            <h3 className="ds-heading-3" style={{ marginBottom: '1rem' }}>Office Location</h3>
            <div style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <iframe
                title="FAST National University Karachi Campus, Shah Latif Town"
                src="https://www.google.com/maps?q=FAST%20National%20University%20Karachi%20Campus%2C%20Shah%20Latif%20Town&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
            <p className="ds-caption" style={{ marginTop: '0.75rem', textAlign: 'center' }}>FAST National University Karachi Campus</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;
"""

with open('src/pages/ContactPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('ContactPage.jsx Updated')
