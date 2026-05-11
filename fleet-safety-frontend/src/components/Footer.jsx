import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-brand">
          <h3>Vigilant Driver</h3>
          <p>
            Safety-first fleet monitoring platform for drowsiness detection, distraction alerts, and reliable risk insights.
          </p>
          
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
          <Link to="/login">Company Dashboard</Link>
          <Link to="/login">Admin Dashboard</Link>
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
        <p>© {new Date().getFullYear()} Vigilant Driver. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
