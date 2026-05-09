import SectionHeader from "../components/SectionHeader";

function ContactPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          eyebrow="Contact"
          title="Talk to the Vigilant Driver Monitoring and Safety Assurance System Team"
          text="Share your use case and we will help you design a safer monitoring workflow."
        />

        <div className="contact-grid">
          <form className="card contact-form" noValidate>
            <label>
              Name
              <input type="text" placeholder="Enter your full name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="name@company.com" className="is-valid" />
            </label>
            <label>
              Message
              <textarea rows="5" placeholder="Tell us about your fleet and goals" className="is-error" />
            </label>
            <div className="validation-hint-row">
              <span className="hint ok">Looks good</span>
              <span className="hint error">Message must be at least 20 characters</span>
            </div>
            <button type="button" className="btn btn-primary">Send Message</button>
          </form>

          <div className="contact-side">
            <article className="card">
              <h3>Company Details</h3>
              <p>Vigilant Driver Monitoring and Safety Assurance System</p>
              <p>support@vigilantdriver.ai</p>
              <p>+92-300-0000000</p>
              <p>Karachi, Pakistan</p>
            </article>
            <article className="card map-placeholder">
              <h3>Office Location</h3>
              <div className="map-box">
                <iframe
                  title="FAST National University Karachi Campus, Shah Latif Town"
                  src="https://www.google.com/maps?q=FAST%20National%20University%20Karachi%20Campus%2C%20Shah%20Latif%20Town&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <p className="map-caption">FAST National University Karachi Campus, Shah Latif Town</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactPage;
