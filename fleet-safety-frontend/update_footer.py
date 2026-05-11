import re

with open('src/components/Footer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Github and Linkedin icons
content = re.sub(r'<div className="footer-social">.*?</div>', '', content, flags=re.DOTALL)

# Shorten title
content = content.replace('<h3>Vigilant Driver Monitoring and Safety Assurance System</h3>', '<h3>Vigilant Driver</h3>')
content = content.replace('© {new Date().getFullYear()} Vigilant Driver Monitoring and Safety Assurance System. All rights reserved.', '© {new Date().getFullYear()} Vigilant Driver. All rights reserved.')

# Update platform links
old_platform = """        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/company/dashboard">Company Dashboard</Link>
          <Link to="/company/alerts">Alerts</Link>
          <Link to="/company/sessions">Sessions</Link>
          <Link to="/company/profile">Profile</Link>
        </div>"""

new_platform = """        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/login">Company Dashboard</Link>
          <Link to="/login">Admin Dashboard</Link>
        </div>"""

content = content.replace(old_platform, new_platform)

with open('src/components/Footer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Footer.jsx updated")
