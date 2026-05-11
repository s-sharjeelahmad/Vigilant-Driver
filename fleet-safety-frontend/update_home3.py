import re

with open('src/pages/HomePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Contact Sales buttons
content = re.sub(r'<a href="#contact" className="btn-secondary"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
content = re.sub(r'<a href="#contact" style={{ padding: \'1rem 2.5rem\'[^>]*>.*?</a>', '', content, flags=re.DOTALL)

# Remove "Trusted by leading logistics fleets" section
content = re.sub(r'\{\/\* Social Proof \*\/\}.*?(?=\{\/\* Features Grid \*\/\})', '', content, flags=re.DOTALL)

# Update Step 1 text
content = content.replace('Install Hardware', 'Install Application')
content = content.replace('Easily mount our plug-and-play AI cameras in any fleet vehicle within minutes.', 'Install application on mobile and start monitoring through camera.')

# Remove Security section
content = re.sub(r'\{\/\* Security Section \*\/\}.*?(?=\{\/\* CTA Section \*\/\})', '', content, flags=re.DOTALL)

with open('src/pages/HomePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("HomePage.jsx updated")
