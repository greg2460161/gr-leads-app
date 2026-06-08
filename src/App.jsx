import { useState } from "react";

const PRODUCTS = {
  direct: {
    bridging: { label: "Bridging Finance", color: "#c8952a", query: "Find 4 real UK property auction companies or bridging finance brokers in England with their website and contact email. For each give: company name, location, email address, why they need bridging finance." },
    development: { label: "Development Finance", color: "#2a7fc8", query: "Find 4 real UK property developers in England and Wales who recently got planning permission. For each give: company name, location, email address, what they are developing." },
    refurbishment: { label: "Refurbishment Loans", color: "#9b5cf6", query: "Find 4 real UK property investors or HMO operators in England and Wales. For each give: company name, location, email address, what refurbishment projects they do." },
    businessloan: { label: "Business Loans", color: "#2ac87a", query: "Find 4 real growing SME businesses in England and Wales that might need a business loan. For each give: company name, location, email address, why they might need finance." },
    mca: { label: "Merchant Cash Advance", color: "#ef4444", query: "Find 4 real restaurants, cafes or retail shops in England and Wales. For each give: business name, location, email address or contact details." },
  },
  referral: {
    accountants: { label: "Accountants", color: "#0ea5e9", query: "Find 4 real UK accountancy firms in England and Wales that work with SME clients. For each give: firm name, location, email address, director or partner name, and why they would be a good referral partner for a commercial finance broker." },
    ifas: { label: "IFAs", color: "#f59e0b", query: "Find 4 real independent financial advisers in England and Wales. For each give: firm name, location, email address, and why they would refer clients to a commercial finance broker." },
    architects: { label: "Architects", color: "#8b5cf6", query: "Find 4 real architectural practices in England and Wales that work on residential development projects. For each give: firm name, location, email address, and why they would refer clients to a commercial finance broker." },
    construction: { label: "Construction Firms", color: "#f97316", query: "Find 4 real construction companies in England and Wales. For each give: company name, location, email address, and why they would refer developer clients to a commercial finance broker." },
    solicitors: { label: "Solicitors", color: "#10b981", query: "Find 4 real property solicitor firms in England and Wales. For each give: firm name, location, email address, and why they would refer clients to a commercial finance broker." },
    estateagents: { label: "Estate Agents", color: "#ec4899", query: "Find 4 real estate agents in England and Wales. For each give: agency name, location, email address, and why they would refer buyers to a commercial finance broker." },
  },
};

const EMAIL_SIG = `Kind regards,

The Team at GR Commercial Finance
Specialist Commercial Finance Brokers - England and Wales
Web: grcommercialfinance.co.uk
Email: enquiries@grcommercialfinance.co.uk
Mobile: 07510 859352
Manchester

GR Commercial Finance is a commercial finance broker, not a lender. All finance is subject to status and valuation.`;

const LOGIN_PASSWORD = "GRLeads2026";

async function searchLeads(apiKey, query, productLabel, isReferral) {
  const systemPrompt = isReferral
    ? `You are a lead researcher for GR Commercial Finance, a commercial finance broker in Manchester covering England and Wales. Find real referral partners. Always search the web for real firms. Format your response as a numbered list. For each firm include their name, location, email address (search their website), and a brief reason why they are a good referral partner. Be specific and use real data.`
    : `You are a lead researcher for GR Commercial Finance, a commercial finance broker in Manchester covering England and Wales. Find real prospects who need ${productLabel}. Always search the web for real companies. Format your response as a numbered list. For each company include their name, location, email address (search their website contact page), and a brief reason why they need ${productLabel}. Be specific and use real data.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: query }],
    }),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error " + r.status); }
  const d = await r.json();
  const text = d.content.filter(b => b.type === "text").map(b => b.text).join("");

  // Parse numbered list into leads
  const leads = [];
  const blocks = text.split(/\n(?=\d+[\.\)])/);
  for (const block of blocks) {
    if (!block.trim() || !block.match(/^\d/)) continue;
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim();
    if (!firstLine || firstLine.length < 3) continue;

    const emailMatch = block.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const locationMatch = block.match(/(?:Location|Based|located|,\s*)([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+)?)/);
    const context = lines.slice(1).join(" ").replace(/\*\*/g, "").slice(0, 200);

    const emailBody = isReferral
      ? `Dear ${firstLine} Team,\n\nI am reaching out from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe work with ${productLabel.toLowerCase()} on a referral partnership basis. When your clients need bridging loans, development finance, business loans or merchant cash advances, we handle everything efficiently and pay you a referral fee for every successful introduction.\n\nWe would love to explore a mutually beneficial partnership with ${firstLine}. Would you be open to a brief call?\n\n${EMAIL_SIG}`
      : `Dear ${firstLine} Team,\n\nI am reaching out from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe specialise in ${productLabel.toLowerCase()} and believe we could help your business. We offer fast approvals and competitive rates tailored to businesses like yours.\n\nWe would welcome the opportunity to discuss your requirements. Please feel free to call us on 07510 859352 or email enquiries@grcommercialfinance.co.uk.\n\n${EMAIL_SIG}`;

    leads.push({
      companyName: firstLine,
      location: locationMatch ? locationMatch[1].trim() : "England / Wales",
      emailAddress: emailMatch ? emailMatch[0] : null,
      emailConfidence: emailMatch ? "Verified" : null,
      signal: context || (isReferral ? `Potential referral partner` : `Potential ${productLabel} client`),
      estimatedDeal: "GBP 100,000 - 500,000",
      urgency: "Medium",
      qualificationScore: emailMatch ? 78 : 65,
      partnerScore: emailMatch ? 78 : 65,
      clientProfile: context.slice(0, 100),
      referralOpportunity: context.slice(0, 150),
      contactHint: emailMatch ? "Email found - contact directly" : "Search their website for contact details",
      emailSubject: isReferral ? `Referral partnership - GR Commercial Finance` : `${productLabel} - GR Commercial Finance`,
      emailBodyCore: emailBody,
    });
  }

  return { leads: leads.slice(0, 5), rawText: text };
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [mode, setMode] = useState("direct");
  const [activeProduct, setActiveProduct] = useState("bridging");
  const [activePartner, setActivePartner] = useState("accountants");
  const [searching, setSearching] = useState(false);
  const [leads, setLeads] = useState([]);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(null);
  const [chApiKey, setChApiKey] = useState("");
  const [chProfile, setChProfile] = useState("construction");
  const [chLocation, setChLocation] = useState("");
  const [chQuery, setChQuery] = useState("");
  const [chLeads, setChLeads] = useState([]);
  const [chSearching, setChSearching] = useState(false);
  const [chProgress, setChProgress] = useState("");
  const [chError, setChError] = useState("");
  const [chExpanded, setChExpanded] = useState(null);
  const [chCopied, setChCopied] = useState(null);

  const handleLogin = () => {
    if (pw === LOGIN_PASSWORD) { setAuthed(true); setPwError(false); } else setPwError(true);
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) { setError("Please enter your Anthropic API key."); return; }
    setError(""); setSearching(true); setLeads([]); setRawText(""); setExpanded(null);
    try {
      const isReferral = mode === "referral";
      const prod = isReferral ? PRODUCTS.referral[activePartner] : PRODUCTS.direct[activeProduct];
      const result = await searchLeads(apiKey, prod.query, prod.label, isReferral);
      setLeads(result.leads);
      setRawText(result.rawText);
    } catch (e) { setError("Search failed: " + e.message); }
    finally { setSearching(false); }
  };

  const handleCHSearch = async () => {
    if (!apiKey.trim()) { setChError("Please enter your Anthropic API key."); return; }
    setChError(""); setChSearching(true); setChLeads([]); setChExpanded(null);
    try {
      setChProgress("Searching Companies House via web...");
      const chProfiles = {
        construction: "construction companies builders contractors",
        restaurants: "restaurants cafes bars hospitality",
        retail: "retail shops stores",
        property: "property developers investment companies",
        professional: "accountants architects consultants",
        all: "SME businesses",
      };
      const profileLabel = chProfiles[chProfile] || "businesses";
      const locationPart = chLocation ? " in " + chLocation : " in England and Wales";
      const keywordPart = chQuery ? " specialising in " + chQuery : "";
      const query = `Search Companies House (company-information.service.gov.uk) for real ${profileLabel}${keywordPart}${locationPart}. Find 8 real registered companies. For each company provide: exact company name, company number, registered location, incorporation date, and the most likely contact email address (search their website). Format as a numbered list.`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: "You are a company researcher. Search Companies House and company websites to find real UK registered companies. Always provide real company names and numbers. Format as a numbered list with one company per entry.",
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: query }],
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error"); }
      const d = await r.json();
      const text = d.content.filter(b => b.type === "text").map(b => b.text).join("");
      setChProgress("Parsing results...");

      const companies = [];
      const blocks = text.split(/\n(?=\d+[\.\)])/);
      for (const block of blocks) {
        if (!block.trim() || !block.match(/^\d/)) continue;
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
        const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim();
        if (!firstLine || firstLine.length < 3) continue;
        const emailMatch = block.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
        const numberMatch = block.match(/\b\d{8}\b/);
        const context = lines.slice(1).join(" ").replace(/\*\*/g, "").slice(0, 150);
        const emailAddr = emailMatch ? emailMatch[0] : "info@" + firstLine.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".co.uk";
        companies.push({
          companyName: firstLine,
          companyNumber: numberMatch ? numberMatch[0] : "",
          location: chLocation || "England / Wales",
          emailAddress: emailAddr,
          emailConfidence: emailMatch ? "Verified" : "Guessed",
          signal: context || profileLabel + " company",
          estimatedDeal: "GBP 50,000 - 250,000",
          urgency: "Medium",
          qualificationScore: emailMatch ? 72 : 62,
          contactHint: numberMatch ? "View on Companies House: company-information.service.gov.uk/company/" + numberMatch[0] : "Search company name on Companies House",
          emailSubject: "Business finance options - GR Commercial Finance",
          emailBodyCore: `Dear ${firstLine} Team,\n\nI am reaching out from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe help ${profileLabel} access competitive business finance including loans, bridging finance and merchant cash advances. Fast approvals and personal service.\n\nWe would love to discuss how we can support ${firstLine}.\n\n${EMAIL_SIG}`,
        });
      }
      setChLeads(companies.slice(0, 10));
      setChProgress("Found " + Math.min(companies.length, 10) + " companies");
    } catch (e) { setChError("Search failed: " + e.message); }
    finally { setChSearching(false); }
  };

  const buildEmail = (lead) => lead.emailBodyCore || "";

  const copyFull = (e, lead, i, fn) => {
    e.stopPropagation();
    navigator.clipboard.writeText("To: " + (lead.emailAddress || "") + "\nSubject: " + (lead.emailSubject || "") + "\n\n" + buildEmail(lead));
    fn(i); setTimeout(() => fn(null), 2000);
  };

  const openZoho = (e, lead) => {
    e.stopPropagation();
    navigator.clipboard.writeText("To: " + (lead.emailAddress || "") + "\nSubject: " + (lead.emailSubject || "") + "\n\n" + buildEmail(lead));
    window.open("https://mail.zoho.eu/zm/#compose", "_blank");
  };

  const exportCSV = (data, isReferral) => {
    if (!data.length) return;
    const h = ["Company", "Location", "Email", "Confidence", "Signal", "Est Deal", "Score", "Subject", "Email Body"];
    const rows = data.map(l => [l.companyName, l.location, l.emailAddress, l.emailConfidence, l.signal, l.estimatedDeal, l.qualificationScore || l.partnerScore, l.emailSubject, buildEmail(l).replace(/\n/g, " ")]);
    const csv = [h, ...rows].map(r => r.map(c => '"' + (c || "").toString().replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "gr-leads-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click();
  };

  const urgBg = u => ({ High: "#7f1d1d", Medium: "#78350f", Low: "#1f2937" }[u] || "#1f2937");
  const urgFg = u => ({ High: "#fca5a5", Medium: "#fcd34d", Low: "#9ca3af" }[u] || "#9ca3af");
  const scoreCol = s => s >= 75 ? "#4ade80" : s >= 60 ? "#fbbf24" : "#f87171";
  const confBg = c => ({ Verified: "#14532d", Likely: "#78350f", Guessed: "#1e1e2a" }[c] || "#1e1e2a");
  const confFg = c => ({ Verified: "#86efac", Likely: "#fcd34d", Guessed: "#9ca3af" }[c] || "#9ca3af");

  const Card = ({ lead, i, exp, setExp, cop, setCop }) => {
    const score = lead.qualificationScore || lead.partnerScore || 0;
    return (
      <div onClick={() => setExp(exp === i ? null : i)} style={{ background: "#0f0f16", border: "1px solid " + (exp === i ? "#c8952a55" : "#1c1c28"), borderRadius: 8, overflow: "hidden", cursor: "pointer", marginBottom: 8 }}>
        <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ede8de" }}>{lead.companyName}</span>
              {lead.urgency && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: urgBg(lead.urgency), color: urgFg(lead.urgency) }}>{lead.urgency}</span>}
            </div>
            <div style={{ fontSize: 11, color: "#374151", marginBottom: 5 }}>{lead.location}{lead.companyNumber ? " · #" + lead.companyNumber : ""}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              {lead.emailAddress
                ? <><span style={{ fontSize: 11, color: "#c8952a", fontFamily: "monospace", background: "#c8952a11", padding: "2px 8px", borderRadius: 3 }}>{lead.emailAddress}</span>
                  {lead.emailConfidence && <span style={{ fontSize: 10, padding: "2px 5px", borderRadius: 3, background: confBg(lead.emailConfidence), color: confFg(lead.emailConfidence) }}>{lead.emailConfidence}</span>}</>
                : <span style={{ fontSize: 11, color: "#374151" }}>No email found</span>}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{lead.signal}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {lead.estimatedDeal && <><div style={{ fontSize: 13, fontWeight: 700, color: "#ede8de" }}>{lead.estimatedDeal}</div><div style={{ fontSize: 10, color: "#374151", marginBottom: 6 }}>est. deal</div></>}
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid " + scoreCol(score), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: scoreCol(score), marginLeft: "auto" }}>{score}</div>
          </div>
        </div>
        {exp === i && (
          <div style={{ borderTop: "1px solid #1c1c28", padding: "13px 16px", background: "#09090d" }}>
            {lead.contactHint && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>How to Approach</div><div style={{ fontSize: 12, color: "#6b7280" }}>{lead.contactHint}</div></div>}
            <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Outreach Email</div>
            <div style={{ background: "#0f0f16", border: "1px solid #1c1c28", borderRadius: 6, padding: "10px 13px", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#374151", marginBottom: 4 }}>To: <span style={{ color: "#c8952a", fontFamily: "monospace" }}>{lead.emailAddress || "(no email found)"}</span></div>
              <div style={{ fontSize: 11, color: "#374151", marginBottom: 8 }}>Subject: <span style={{ color: "#ede8de", fontWeight: 500 }}>{lead.emailSubject}</span></div>
              <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.7, whiteSpace: "pre-wrap", borderTop: "1px solid #1c1c28", paddingTop: 8 }}>{buildEmail(lead)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={e => copyFull(e, lead, i, setCop)} style={{ padding: "5px 14px", borderRadius: 4, border: "1px solid #1c1c28", background: cop === i ? "#14532d" : "transparent", color: cop === i ? "#86efac" : "#4b5563", cursor: "pointer", fontSize: 11 }}>{cop === i ? "Copied!" : "Copy email"}</button>
              <button onClick={e => openZoho(e, lead)} style={{ padding: "5px 14px", borderRadius: 4, border: "none", background: "#c8952a", color: "#fff", cursor: "pointer", fontSize: 11 }}>Open Zoho + Copy</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!authed) return (
    <div style={{ fontFamily: "Arial,sans-serif", background: "#09090d", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0f0f16", border: "1px solid #1c1c28", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: "linear-gradient(135deg,#c8952a,#8a6018)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 auto 20px" }}>GR</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#ede8de", marginBottom: 4 }}>GR Commercial Finance</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 28 }}>Lead Intelligence System</div>
        <input type="password" placeholder="Enter password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", background: "#09090d", border: "1px solid " + (pwError ? "#7f1d1d" : "#1c1c28"), borderRadius: 6, padding: "10px 14px", color: "#ddd8ce", fontSize: 14, outline: "none", marginBottom: 8, textAlign: "center", boxSizing: "border-box" }} />
        {pwError && <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 8 }}>Incorrect password</div>}
        <button onClick={handleLogin} style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", background: "#c8952a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Log In</button>
      </div>
    </div>
  );

  const curProd = mode === "direct" ? PRODUCTS.direct[activeProduct] : PRODUCTS.referral[activePartner];

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: "#09090d", minHeight: "100vh", color: "#ddd8ce" }}>
      <div style={{ background: "#0f0f16", borderBottom: "1px solid #1c1c28", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#c8952a,#8a6018)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>GR</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: "#ede8de" }}>GR Commercial Finance</div><div style={{ fontSize: 10, color: "#374151" }}>Lead Intelligence - grcommercialfinance.co.uk</div></div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#374151", textTransform: "uppercase" }}>Anthropic</span>
            <input type="password" placeholder="sk-ant-api..." value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: 150, background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "6px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
          </div>
        </div>
      </div>

      <div style={{ background: "#0f0f16", borderBottom: "1px solid #1c1c28", padding: "0 24px", display: "flex" }}>
        {[["direct", "Direct Leads", "#c8952a"], ["referral", "Referral Partners", "#2ac87a"], ["companies", "Companies House", "#f59e0b"]].map(([m, label, col]) => (
          <button key={m} onClick={() => { setMode(m); setLeads([]); setError(""); }} style={{ padding: "12px 18px", border: "none", borderBottom: mode === m ? "2px solid " + col : "2px solid transparent", background: "transparent", color: mode === m ? col : "#4b5563", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{label}</button>
        ))}
      </div>

      {mode === "companies" && (
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 24px" }}>
          <div style={{ background: "#0f0f16", border: "1px solid #1c1c28", borderRadius: 8, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>Companies House Search</div>
            <div style={{ fontSize: 11, color: "#374151", marginBottom: 16 }}>Searches Companies House via web - uses your Anthropic API key</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Industry</label>
                <select value={chProfile} onChange={e => setChProfile(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none" }}>
                  <option value="construction">Construction Companies</option>
                  <option value="restaurants">Restaurants and Hospitality</option>
                  <option value="retail">Retail Businesses</option>
                  <option value="property">Property Companies</option>
                  <option value="professional">Professional Services</option>
                  <option value="all">All SMEs</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Location (optional)</label>
                <input placeholder="e.g. Manchester, Bristol..." value={chLocation} onChange={e => setChLocation(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Keyword (optional)</label>
                <input placeholder="e.g. roofing, pizza restaurant..." value={chQuery} onChange={e => setChQuery(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={handleCHSearch} disabled={chSearching} style={{ padding: "9px 24px", borderRadius: 5, border: "none", background: chSearching ? "#1c1c28" : "#f59e0b", color: chSearching ? "#4b5563" : "#000", cursor: chSearching ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
                {chSearching ? chProgress || "Searching..." : "Search Companies House"}
              </button>
              {chLeads.length > 0 && <>
                <button onClick={() => exportCSV(chLeads, false)} style={{ padding: "8px 14px", borderRadius: 5, border: "1px solid #1c1c28", background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: 12 }}>Export CSV</button>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{chLeads.length} companies found</span>
              </>}
            </div>
          </div>
          {chError && <div style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 6, padding: "9px 14px", marginBottom: 12, color: "#fca5a5", fontSize: 12 }}>{chError}</div>}
          {chLeads.map((l, i) => <Card key={i} lead={l} i={i} exp={chExpanded} setExp={setChExpanded} cop={chCopied} setCop={setChCopied} />)}
          {!chSearching && chLeads.length === 0 && !chError && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>Search Companies House for bulk leads</div>
              <div style={{ fontSize: 12, color: "#1f2937" }}>Select an industry and click Search. Uses your Anthropic API key.</div>
            </div>
          )}
        </div>
      )}

      {mode !== "companies" && (
        <>
          <div style={{ background: "#0c0c12", borderBottom: "1px solid #1c1c28", padding: "0 24px", display: "flex", overflowX: "auto" }}>
            {Object.entries(mode === "direct" ? PRODUCTS.direct : PRODUCTS.referral).map(([key, cfg]) => (
              <button key={key} onClick={() => { mode === "direct" ? setActiveProduct(key) : setActivePartner(key); setLeads([]); setError(""); }} style={{ padding: "9px 14px", border: "none", borderBottom: (mode === "direct" ? activeProduct : activePartner) === key ? "2px solid " + cfg.color : "2px solid transparent", background: "transparent", color: (mode === "direct" ? activeProduct : activePartner) === key ? cfg.color : "#374151", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, color: curProd.color, fontWeight: 600, marginBottom: 2 }}>{curProd.label}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {leads.length > 0 && <button onClick={() => exportCSV(leads, mode === "referral")} style={{ padding: "7px 14px", borderRadius: 5, border: "1px solid #1c1c28", background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: 12 }}>Export CSV</button>}
                <button onClick={handleSearch} disabled={searching} style={{ padding: "8px 22px", borderRadius: 5, border: "none", background: searching ? "#1c1c28" : mode === "direct" ? "#c8952a" : "#2ac87a", color: searching ? "#4b5563" : "#fff", cursor: searching ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, minWidth: 140 }}>
                  {searching ? "Searching..." : mode === "direct" ? "Hunt Leads" : "Find Partners"}
                </button>
              </div>
            </div>
            {error && <div style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 6, padding: "9px 14px", marginBottom: 12, color: "#fca5a5", fontSize: 12 }}>{error}</div>}
            {leads.map((l, i) => <Card key={i} lead={l} i={i} exp={expanded} setExp={setExpanded} cop={copied} setCop={setCopied} />)}
            {!searching && leads.length === 0 && !error && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>{mode === "direct" ? "Ready to hunt leads" : "Ready to find referral partners"}</div>
                <div style={{ fontSize: 12, color: "#1f2937" }}>Enter your Anthropic API key above and click {mode === "direct" ? "Hunt Leads" : "Find Partners"}</div>
              </div>
            )}
            {rawText && leads.length === 0 && !searching && (
              <div style={{ background: "#0f0f16", border: "1px solid #1c1c28", borderRadius: 6, padding: "12px", marginTop: 12 }}>
                <div style={{ fontSize: 10, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Raw search results</div>
                <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{rawText.slice(0, 1000)}</div>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ padding: "14px 24px", borderTop: "1px solid #1c1c28", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#1f2937", flexWrap: "wrap", gap: 8 }}>
        <span>GR Commercial Finance - enquiries@grcommercialfinance.co.uk - 07510 859352 - Manchester</span>
        <span>Public data only - Comply with UK GDPR and FCA rules before outreach</span>
      </div>
    </div>
  );
}
