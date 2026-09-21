import { useEffect, useState } from "react";

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
  const [links, setLinks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState("");

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
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong");
      return;
    }
    setUrl("");
    loadLinks();
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
      <header className="brand">
        <span className="brand-mark">TL</span>
        <span className="brand-name">TinyLink</span>
      </header>

      <p className="subtitle">Paste a long URL, get a short one back.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-row">
          <input
            type="url"
            required
            placeholder="https://example.com/a/very/long/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit">Shorten</button>
        </form>
        {error && <p className="error">{error}</p>}

        <div className="list-header">
          <span>Your links</span>
          {links.length > 0 && <span className="count">{links.length}</span>}
        </div>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : links.length === 0 ? (
          <p className="empty">No links yet — create your first one above.</p>
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
      </div>
    </div>
  );
}