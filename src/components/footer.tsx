export default function Footer() {
  return (
    <footer className="mt-auto h-16 w-full border-t border-[var(--border)] bg-[color:var(--surface)]/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 h-full flex items-center justify-between text-xs text-[var(--foreground)]/70">
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} True Competency</span>
          <a href="/privacy" className="hover:opacity-80">
            Privacy
          </a>
          <a href="/terms" className="hover:opacity-80">
            Terms
          </a>
          <a
            href="mailto:novruzoff@truecompetency.com"
            className="hover:opacity-80"
          >
            Contact
          </a>
        </div>
        <img
          src="/APSC_Logo.png"
          alt="Asian Pacific Society of Cardiology logo"
          className="h-12 object-contain"
        />
      </div>
    </footer>
  );
}
