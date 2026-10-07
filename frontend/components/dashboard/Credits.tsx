const LINKS = [
  { href: 'https://github.com/AHILL-0121', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/ahill-selvaraj', label: 'LinkedIn' },
  { href: 'https://sa-portfolio-psi.vercel.app/', label: 'Portfolio' },
];

// Author links plus the attribution OpenWeather's terms ask for
export default function Credits({ className }: { className?: string }) {
  return (
    <p className={className}>
      Crafted by AHILL ·{' '}
      {LINKS.map(({ href, label }, i) => (
        <span key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            {label}
          </a>
          {i < LINKS.length - 1 && ' · '}
        </span>
      ))}
      <br />
      Weather data © OpenWeather · MIT licensed
    </p>
  );
}
