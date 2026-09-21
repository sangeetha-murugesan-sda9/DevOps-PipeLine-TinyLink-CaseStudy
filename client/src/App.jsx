import { useEffect, useState } from "react";
import QRCode from "qrcode";

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [mode, setMode] = useState("shorten");
  const [links, setLinks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");
  const [lastCreated, setLastCreated] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const domain = window.location.host;

  async function loadLinks() {
    const res = await fetch("/api/links");
    if (res.ok) setLinks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadLinks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setQrDataUrl("");

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alias ? { url, alias } : { url }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong");
      return;
    }

    const created = await res.json();
    setLastCreated(created);
    setUrl("");
    setAlias("");
    loadLinks();

    if (mode === "qr") {
      const shortUrl = `${window.location.origin}/${created.code}`;
      setQrDataUrl(await QRCode.toDataURL(shortUrl, { width: 160, margin: 1 }));
    }
  }

  function copyLink(code) {
    const shortUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 1500);
    });
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="brand">
          <span className="brand-mark">TL</span>
          <span className="brand-name">TinyLink</span>
        </div>
        <h1>URL Shortener &amp; QR Codes</h1>
        <p className="subtitle">
          Paste a long URL below to get a short, shareable link with an optional custom
          alias plus a QR code generated right in your browser.
        </p>
      </header>

      <div className="card">
        <div className="tabs">
          <button className={mode === "shorten" ? "tab active" : "tab"} onClick={() => setMode("shorten")}>
            Shorten a Link
          </button>
          <button className={mode === "qr" ? "tab active" : "tab"} onClick={() => setMode("qr")}>
            Generate QR Code
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="long-url">Long URL*</label>
          <input
            id="long-url"
            type="url"
            required
            placeholder="https://example.com/a/very/long/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="alias-row">
            <div>
              <span className="field-label">Domain</span>
              <div className="domain-box">{domain}</div>
            </div>
            <span className="slash">/</span>
            <div className="alias-field">
              <label className="field-label" htmlFor="alias">Alias (optional)</label>
              <input
                id="alias"
                type="text"
                placeholder="my-link"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
              <span className="hint">Must be at least 5 characters</span>
            </div>
          </div>

          <button type="submit" className="submit">
            {mode === "qr" ? "Generate QR Code" : "Shorten Link"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {lastCreated && (
          <div className="result">
            <div className="result-link">
              <span>Your link is ready:</span>
              <a className="code" href={`/${lastCreated.code}`}>
                {window.location.origin}/{lastCreated.code}
              </a>
              <button className="copy" onClick={() => copyLink(lastCreated.code)}>
                {copiedCode === lastCreated.code ? "Copied" : "Copy"}
              </button>
            </div>
            {qrDataUrl && <img className="qr" src={qrDataUrl} alt={`QR code for ${lastCreated.code}`} />}
          </div>
        )}

        <p className="fineprint">
          Built as a DD2482 course project And the links are stored for demo purposes only.
        </p>
      </div>

      <section className="recent">
        <h2>Your Recent Links</h2>
        {loading ? (
          <p className="empty">Loading…</p>
        ) : links.length === 0 ? (
          <p className="empty">No links yet in your history.</p>
        ) : (
          <ul className="links">
            {links.map((link) => (
              <li key={link.code}>
                <div className="link-main">
                  <a className="code" href={`/${link.code}`}>/{link.code}</a>
                  <span className="original">{link.url}</span>
                </div>
                <div className="link-meta">
                  <span className="time">{timeAgo(link.created_at)}</span>
                  <button className="copy" onClick={() => copyLink(link.code)}>
                    {copiedCode === link.code ? "Copied" : "Copy"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}