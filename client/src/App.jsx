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
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
      <h1>TinyLink</h1>
      <p>Paste a long URL, get a short one back.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="url"
          required
          placeholder="https://example.com/a/very/long/path"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Shorten</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <ul style={{ marginTop: 24, paddingLeft: 0, listStyle: "none" }}>
        {links.map((link) => (
          <li key={link.code} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <a href={`/${link.code}`}>/{link.code}</a> &rarr; {link.url}
          </li>
        ))}
      </ul>
    </main>
  );
}