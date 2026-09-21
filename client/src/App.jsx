import { useEffect, useState } from "react";

export default function App() {
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [error, setError] = useState("");

  async function loadLinks() {
    const res = await fetch("/api/links");
    if (res.ok) setLinks(await res.json());
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

  return (
    <div className="page">
      <h1>TinyLink</h1>
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

        {links.length === 0 ? (
          <p className="empty">No links yet — create your first one above.</p>
        ) : (
          <ul className="links">
            {links.map((link) => (
              <li key={link.code}>
                <a className="code" href={`/${link.code}`}>/{link.code}</a>
                <span className="original">{link.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}