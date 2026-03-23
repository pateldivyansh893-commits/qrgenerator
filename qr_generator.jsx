import { useState, useEffect, useRef } from "react";

const QR_API = (data, size = 256) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&ecc=M`;

const TABS = [
  { id: "url", label: "URL", icon: "🔗" },
  { id: "text", label: "Text", icon: "📝" },
  { id: "contact", label: "Contact", icon: "👤" },
];

function buildContactVCard({ name, phone, email, org, url }) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    name ? `FN:${name}` : "",
    org ? `ORG:${org}` : "",
    phone ? `TEL:${phone}` : "",
    email ? `EMAIL:${email}` : "",
    url ? `URL:${url}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

export default function App() {
  const [tab, setTab] = useState("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", org: "", url: "" });
  const [qrData, setQrData] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef();

  const normalizeUrl = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleGenerate = () => {
    setImgLoaded(false);
    if (tab === "url") {
      const u = normalizeUrl(urlInput);
      if (!u) return;
      setQrData(u);
    } else if (tab === "text") {
      if (!textInput.trim()) return;
      setQrData(textInput.trim());
    } else {
      const vcard = buildContactVCard(contact);
      setQrData(vcard);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = QR_API(qrData, 512);
    link.download = "qrcode.png";
    link.target = "_blank";
    link.click();
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(QR_API(qrData, 512));
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isValid = () => {
    if (tab === "url") return urlInput.trim().length > 0;
    if (tab === "text") return textInput.trim().length > 0;
    return Object.values(contact).some((v) => v.trim().length > 0);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', 'Fira Mono', monospace", padding: "2rem 1rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Unbounded:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #e8ff47; color: #0c0c0f; }
        input, textarea { outline: none; }
        input::placeholder, textarea::placeholder { color: #555; }
        .tab-btn { transition: all 0.18s; cursor: pointer; border: none; }
        .tab-btn:hover { background: #1e1e24 !important; }
        .tab-btn.active { background: #e8ff47 !important; color: #0c0c0f !important; }
        .gen-btn { transition: all 0.16s; cursor: pointer; }
        .gen-btn:hover:not(:disabled) { background: #f5ff7a !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(232,255,71,0.25); }
        .gen-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .action-btn { transition: all 0.14s; cursor: pointer; }
        .action-btn:hover { background: #2a2a33 !important; }
        .qr-fade { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .field { background: #111116; border: 1.5px solid #2a2a35; border-radius: 8px; color: #e8e8f0; width: 100%; padding: 10px 13px; font-family: inherit; font-size: 0.88rem; transition: border-color 0.15s; }
        .field:focus { border-color: #e8ff47; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: "#e8ff47", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            ▸ QR FORGE
          </div>
          <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", color: "#f0f0f8", margin: 0, lineHeight: 1.1, fontWeight: 900 }}>
            QR Code<br />
            <span style={{ color: "#e8ff47" }}>Generator</span>
          </h1>
        </div>

        {/* Card */}
        <div style={{ background: "#13131a", border: "1.5px solid #222230", borderRadius: 16, padding: "1.75rem", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "#0c0c0f", borderRadius: 10, padding: "4px" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn${tab === t.id ? " active" : ""}`}
                onClick={() => { setTab(t.id); setQrData(null); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 7, fontSize: "0.78rem", letterSpacing: "0.05em",
                  fontFamily: "inherit", fontWeight: 500, color: tab === t.id ? "#0c0c0f" : "#888",
                  background: "transparent",
                }}
              >
                <span style={{ marginRight: 5 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          {tab === "url" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.72rem", color: "#777", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Website URL</label>
              <input
                className="field"
                type="url"
                placeholder="example.com or https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isValid() && handleGenerate()}
              />
              <div style={{ fontSize: "0.72rem", color: "#555", marginTop: "0.4rem" }}>https:// will be added automatically if missing.</div>
            </div>
          )}

          {tab === "text" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: "0.72rem", color: "#777", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Text Content</label>
              <textarea
                className="field"
                rows={4}
                placeholder="Enter any text…"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          {tab === "contact" && (
            <div style={{ marginBottom: "1.25rem", display: "grid", gap: "0.75rem" }}>
              {[
                { key: "name", label: "Full Name", placeholder: "Jane Smith" },
                { key: "phone", label: "Phone", placeholder: "+1 555 000 0000" },
                { key: "email", label: "Email", placeholder: "jane@example.com" },
                { key: "org", label: "Organization", placeholder: "Acme Corp" },
                { key: "url", label: "Website", placeholder: "https://example.com" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "0.72rem", color: "#777", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>{label}</label>
                  <input
                    className="field"
                    placeholder={placeholder}
                    value={contact[key]}
                    onChange={(e) => setContact((c) => ({ ...c, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <button
            className="gen-btn"
            onClick={handleGenerate}
            disabled={!isValid()}
            style={{
              width: "100%", padding: "13px", background: "#e8ff47", color: "#0c0c0f",
              border: "none", borderRadius: 10, fontFamily: "'Unbounded', sans-serif",
              fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em",
            }}
          >
            GENERATE QR CODE
          </button>

          {/* QR Output */}
          {qrData && (
            <div className="qr-fade" style={{ marginTop: "1.75rem", textAlign: "center" }}>
              <div style={{ display: "inline-block", background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 0 0 1.5px #2a2a35, 0 8px 32px rgba(0,0,0,0.4)" }}>
                <img
                  ref={imgRef}
                  src={QR_API(qrData)}
                  alt="QR Code"
                  width={200}
                  height={200}
                  onLoad={() => setImgLoaded(true)}
                  style={{ display: "block", imageRendering: "pixelated" }}
                />
              </div>

              {imgLoaded && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", justifyContent: "center" }}>
                  <button
                    className="action-btn"
                    onClick={handleDownload}
                    style={{
                      background: "#1a1a22", border: "1.5px solid #2a2a35", color: "#d0d0e0",
                      padding: "9px 18px", borderRadius: 8, fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
                    }}
                  >
                    ↓ Download
                  </button>
                  <button
                    className="action-btn"
                    onClick={handleCopy}
                    style={{
                      background: "#1a1a22", border: "1.5px solid #2a2a35", color: copied ? "#e8ff47" : "#d0d0e0",
                      padding: "9px 18px", borderRadius: 8, fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ Copied!" : "⧉ Copy"}
                  </button>
                </div>
              )}

              {/* Data preview */}
              <div style={{ marginTop: "1rem", background: "#0c0c0f", border: "1px solid #1e1e28", borderRadius: 8, padding: "10px 14px", textAlign: "left" }}>
                <div style={{ fontSize: "0.68rem", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Encoded data</div>
                <div style={{ fontSize: "0.78rem", color: "#888", wordBreak: "break-all", whiteSpace: "pre-wrap", maxHeight: 80, overflow: "auto" }}>{qrData}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.7rem", color: "#3a3a48", letterSpacing: "0.1em" }}>
          SCAN WITH ANY CAMERA APP ◆ NO ACCOUNT REQUIRED
        </div>
      </div>
    </div>
  );
}
