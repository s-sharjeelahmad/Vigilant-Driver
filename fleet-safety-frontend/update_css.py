import re
with open('src/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

new_light = """
  /* Brand & Primary (Tailwind Indigo) */
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-primary-soft: rgba(79, 70, 229, 0.08);

  /* Semantic (Crisp, High Contrast) */
  --color-success: #16a34a;
  --color-warning: #fbbf24;
  --color-warning-text: #b45309;
  --color-error: #dc2626;
  --color-info: #2563eb;

  /* Surfaces (Zinc/Slate Light Mode) */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-elevated: #f1f5f9;

  /* Cards */
  --color-card: #ffffff;
  --color-card-hover: #f8fafc;

  /* Borders */
  --color-border: #e2e8f0;
  --color-divider: #cbd5e1;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;

  /* Sidebar */
  --color-sidebar-bg: #0f172a;
  --color-sidebar-text: #f8fafc;
  --color-sidebar-active: #4f46e5;
  --color-sidebar-hover: #1e293b;

  /* Navbar */
  --color-navbar-bg: #ffffff;
  --color-navbar-border: #e2e8f0;

  /* Elevation (Stripe / Linear style) */
  --shadow-low: 0 1px 2px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.02);
  --shadow-medium: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03), 0 0 0 1px rgba(15, 23, 42, 0.02);
  --shadow-high: 0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.03), 0 0 0 1px rgba(15, 23, 42, 0.02);
"""

content = re.sub(r'  /\* Brand & Primary \(IBM Blue \/ Stripe style\)\ \*/.*?  /\* Radii Scale \*/', new_light + '\n  /* Radii Scale */', content, flags=re.DOTALL)

new_dark = """
  --color-primary: #6366f1;
  --color-primary-hover: #818cf8;
  --color-primary-soft: rgba(99, 102, 241, 0.15);

  --color-success: #22c55e;
  --color-warning: #fbbf24;
  --color-warning-text: #fbbf24;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  --color-bg: #09090b;
  --color-surface: #18181b;
  --color-surface-elevated: #27272a;

  --color-card: #18181b;
  --color-card-hover: #27272a;

  --color-border: #27272a;
  --color-divider: #3f3f46;

  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #71717a;

  --color-sidebar-bg: #09090b;
  --color-sidebar-text: #f4f4f5;
  --color-sidebar-active: #6366f1;
  --color-sidebar-hover: #27272a;

  --color-navbar-bg: #18181b;
  --color-navbar-border: #27272a;

  /* Elevation in Dark Mode relies on borders, not shadows */
  --shadow-low: 0 0 0 1px var(--color-border);
  --shadow-medium: 0 4px 6px rgba(0,0,0,0.3), 0 0 0 1px var(--color-border);
  --shadow-high: 0 10px 15px rgba(0,0,0,0.4), 0 0 0 1px var(--color-border);
"""

content = re.sub(r'\[data-theme="dark"\] \{\n.*?(?=  /\* Legacy aliases \*/)', '[data-theme="dark"] {\n' + new_dark + '\n', content, flags=re.DOTALL)

new_body = """html,
body,
#root {
  margin: 0;
  min-height: 100%;
  font-family: "Manrope", "Segoe UI", "Tahoma", "Verdana", sans-serif;
  color: var(--color-text-primary);
  background: var(--color-bg);
  transition: background-color 300ms ease, color 300ms ease;
}

[data-theme="dark"],
[data-theme="dark"] body,
[data-theme="dark"] #root {
  background: var(--color-bg);
}"""

content = re.sub(r'html,\s*body,\s*#root\s*\{.*?(?=\s*a\s*\{)', new_body, content, flags=re.DOTALL)

btn_secondary = """
.btn-secondary {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-low);
}
.btn-secondary:hover {
  background: var(--color-surface-elevated);
  border-color: var(--color-divider);
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
"""
content = content.replace('/* Button variants for dashboard */', '/* Button variants for dashboard */' + btn_secondary)

with open('src/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)
print('CSS Updated successfully.')
