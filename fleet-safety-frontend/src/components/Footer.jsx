import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-brand">
          <h3>Vigilant Driver Monitoring and Safety Assurance System</h3>
          <p>
            Safety-first fleet monitoring platform for drowsiness detection, distraction alerts, and reliable risk insights.
          </p>
          <div className="footer-social">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <Github size={18} />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/login">Login</Link>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/company/dashboard">Company Dashboard</Link>
          <Link to="/company/alerts">Alerts</Link>
          <Link to="/company/sessions">Sessions</Link>
          <Link to="/company/profile">Profile</Link>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <div className="footer-contact-item">
            <Mail size={16} />
            <span>support@vigilant-safety.com</span>
          </div>
          <div className="footer-contact-item">
            <Phone size={16} />
            <span>+92 300 555 0123</span>
          </div>
          <div className="footer-contact-item">
            <MapPin size={16} />
            <span>Karachi, Pakistan</span>
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <p>© {new Date().getFullYear()} Vigilant Driver Monitoring and Safety Assurance System. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
