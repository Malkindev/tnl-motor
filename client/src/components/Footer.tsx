export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>TNL Motors</h3>
          <p>Premium vehicle marketplace based in Mombasa, Kenya.</p>
          <p style={{ marginTop: '1rem' }}><strong>Phone</strong><br /><a href="tel:+2540781766193">+254 0781766193</a></p>
          <p><strong>WhatsApp</strong><br /><a href="https://wa.me/254781766193" target="_blank" rel="noreferrer">+254 0781766193</a></p>
        </div>
        <div>
          <h3>Navigation</h3>
          <p><a href="/">Home</a></p>
          <p><a href="/vehicles">Vehicles</a></p>
          <p><a href="/#about">About</a></p>
          <p><a href="/#contact">Contact</a></p>
        </div>
        <div>
          <h3>Account</h3>
          <p><a href="/login">Login</a></p>
          <p><a href="/signup">Sign Up</a></p>
        </div>
      </div>
    </footer>
  );
}
