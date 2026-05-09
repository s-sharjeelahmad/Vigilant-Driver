import { Github, Linkedin, Shield, Activity, Radar } from "lucide-react";
import SectionHeader from "../components/SectionHeader";

function AboutPage() {
  const teamMembers = [
    {
      id: 1,
      name: "Syed Areeb Ashraf",
      role: "Backend Development & AI Integration",
      description: "Leads backend architecture and integrates AI systems for real-time driver monitoring capabilities.",
      // github: "https://github.com/your-username",
      github: "http://github.com/S-Areeb-Ashraf",
      // linkedin: "https://www.linkedin.com/in/your-profile"
      linkedin: "https://www.linkedin.com/in/syed-areebashraf"
    },
    {
      id: 2,
      name: "Abrar Malik",
      role: "AI/ML Model Training & Model Optimization",
      description: "Specializes in training and optimizing machine learning models for accurate driver behavior prediction.",
      github: "https://github.com/AbrarMalik4429",
      linkedin: "https://www.linkedin.com/in/your-profile"
    },
    {
      id: 3,
      name: "Sharjeel Ahmed",
      role: "App Developer & Data Augmentation & Data Preprocessing",
      description: "Develops responsive frontend applications and handles data preparation for model training.",
      github: "https://github.com/s-sharjeelahmad",
      linkedin: "https://www.linkedin.com/in/your-profile"
    }
  ];

  const stats = [
    { label: "Live Driver Signals", value: "24/7" },
    { label: "Early-Warning Alerts", value: "Real-time" },
    { label: "Risk Coverage", value: "Fleet-wide" },
    { label: "Insight Windows", value: "Daily" }
  ];

  return (
    <section className="section about-section">
      <div className="container container-wide about-container">
        <div className="about-hero">
          <div className="about-hero-copy">
            <SectionHeader
              eyebrow="About Vigilant Driver Monitoring and Safety Assurance System"
              title="A Practical Safety Platform for Real Roads"
              text="We built this platform to reduce preventable incidents by helping organizations act earlier on driver fatigue and distraction signals."
            />

            <div className="about-badges">
              <div className="about-badge">
                <Shield size={18} />
                <span>Safety-first monitoring</span>
              </div>
              <div className="about-badge">
                <Activity size={18} />
                <span>Real-time driver insights</span>
              </div>
              <div className="about-badge">
                <Radar size={18} />
                <span>Fleet-wide visibility</span>
              </div>
            </div>
          </div>

          <div className="about-hero-media">
            <img src="/driver-safety.svg" alt="Driver safety monitoring illustration" />
            <div className="about-media-caption">
              Real-time monitoring, actionable insights, and safer journeys.
            </div>
          </div>
        </div>

        <div className="about-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="about-stat">
              <span>{stat.value}</span>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="about-panel-grid">
          <article className="card">
            <h3>Mission</h3>
            <p>
              Make every commercial journey safer through data-backed visibility,
              proactive alerts, and measurable safety outcomes.
            </p>
          </article>

          <article className="card">
            <h3>Problem We Solve</h3>
            <p>
              Traditional monitoring reacts too late. This platform creates a continuous
              safety layer where early warning signals surface before risk escalates.
            </p>
          </article>

          <article className="card">
            <h3>What Makes It Practical</h3>
            <p>
              Fast onboarding, focused dashboards, and alerts that show exactly when teams
              should intervene.
            </p>
          </article>
        </div>

        <div className="about-story">
          <article className="card">
            <h3>How It Works</h3>
            <ol className="about-steps">
              <li>Drivers start a session from the mobile app.</li>
              <li>AI signals detect attention, drowsiness, and distraction events.</li>
              <li>Alerts surface in company dashboards with context and timing.</li>
              <li>Teams respond quickly, log outcomes, and improve safety culture.</li>
            </ol>
          </article>
          <article className="card">
            <h3>What You Get</h3>
            <ul className="about-checklist">
              <li>Clear incident timelines for each session</li>
              <li>Actionable, role-based views for admins and companies</li>
              <li>Transparent, consistent safety metrics</li>
            </ul>
          </article>
        </div>

        <div className="values card">
          <h3>Our Values</h3>
          <ul>
            <li><strong>Safety:</strong> protect lives through early intervention.</li>
            <li><strong>Innovation:</strong> use practical AI signals for field-ready decisions.</li>
            <li><strong>Reliability:</strong> provide stable, auditable metrics that teams trust.</li>
          </ul>
        </div>

        <div className="team-section">
          <h2>Our Development Team</h2>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <article key={member.id} className="team-card">
                <p className="team-name">{member.name}</p>
                <p className="team-role">{member.role}</p>
                <p className="team-description">{member.description}</p>
                <div className="team-links">
                  <a href={member.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                    <Github size={18} />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin size={18} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
