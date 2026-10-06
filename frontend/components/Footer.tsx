const LINKS = [
  { href: 'https://sa-portfolio-psi.vercel.app/', label: 'Portfolio', icon: 'fas fa-shield-halved' },
  { href: 'https://github.com/AHILL-0121', label: 'GitHub', icon: 'fab fa-github' },
  { href: 'https://www.linkedin.com/in/ahill-selvaraj', label: 'LinkedIn', icon: 'fab fa-linkedin' },
];

export default function Footer() {
  return (
    <footer className="glass-panel dash-footer">
      <span className="footer-brand">Crafted by AHILL &mdash; MIT licensed</span>
      <div className="footer-links">
        {LINKS.map(({ href, label, icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            title={label}
            aria-label={label}
          >
            <i className={icon} aria-hidden="true" />
          </a>
        ))}
      </div>
    </footer>
  );
}
