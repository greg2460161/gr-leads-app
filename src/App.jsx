import { useState } from "react";

const PRODUCTS = {
  direct: {
    bridging: { label: "Bridging Finance", color: "#c8952a", query: "Search for 5 real UK property auction houses or property investors in England and Wales who need bridging finance. For each one list: 1) Company name 2) Location 3) Email address from their website 4) Why they need bridging finance. Number each entry." },
    development: { label: "Development Finance", color: "#2a7fc8", query: "Search for 5 real UK property developers in England and Wales who have recently received planning permission or are building new homes. For each one list: 1) Company name 2) Location 3) Email address from their website 4) Their current development project. Number each entry." },
    refurbishment: { label: "Refurbishment Loans", color: "#9b5cf6", query: "Search for 5 real UK property investors or HMO landlords in England and Wales doing refurbishment projects. For each one list: 1) Company name 2) Location 3) Email address from their website 4) What they are refurbishing. Number each entry." },
    businessloan: { label: "Business Loans", color: "#2ac87a", query: "Search for 5 real growing SME businesses in England and Wales that might need a business loan for expansion. For each one list: 1) Company name 2) Location 3) Email address from their website 4) Why they might need finance. Number each entry." },
    mca: { label: "Merchant Cash Advance", color: "#ef4444", query: "Search for 5 real restaurants, cafes, bars or retail shops in England and Wales. For each one list: 1) Business name 2) Location 3) Email address or contact details from their website 4) Type of business. Number each entry." },
  },
  referral: {
    accountants: { label: "Accountants", color: "#0ea5e9", query: "Search for 5 real UK accountancy firms in England and Wales that work with SME business clients. Search their websites for contact details. For each firm list: 1) Firm name 2) Location 3) Email address from their website contact page 4) Partner or director name 5) Why they are a good referral partner for a commercial finance broker. Number each entry." },
    ifas: { label: "IFAs", color: "#f59e0b", query: "Search for 5 real independent financial adviser firms in England and Wales. Search their websites for contact details. For each firm list: 1) Firm name 2) Location 3) Email address from their website 4) Adviser name 5) Why they would refer clients to a commercial finance broker. Number each entry." },
    architects: { label: "Architects", color: "#8b5cf6", query: "Search for 5 real architectural practices in England and Wales that work on residential development or conversion projects. Search their websites for contact details. For each firm list: 1) Practice name 2) Location 3) Email address from their website 4) Director name 5) Why they would refer clients to a commercial finance broker. Number each entry." },
    construction: { label: "Construction Firms", color: "#f97316", query: "Search for 5 real construction companies or building contractors in England and Wales. Search their websites for contact details. For each company list: 1) Company name 2) Location 3) Email address from their website 4) Director name 5) Why they would refer developer clients to a commercial finance broker. Number each entry." },
    solicitors: { label: "Solicitors", color: "#10b981", query: "Search for 5 real property solicitor firms in England and Wales that handle property purchases and commercial transactions. Search their websites for contact details. For each firm list: 1) Firm name 2) Location 3) Email address from their website 4) Partner name 5) Why they would refer clients to a commercial finance broker. Number each entry." },
    estateagents: { label: "Estate Agents", color: "#ec4899", query: "Search for 5 real estate agents in England and Wales. Search their websites for contact details. For each agency list: 1) Agency name 2) Location 3) Email address from their website 4) Manager name 5) Why they would refer buyers to a commercial finance broker. Number each entry." },
  },
};

const CH_PROFILES = {
  construction: { label: "Construction Companies", sic: "41100,41201,41202,42110,43110,43120,43130,43210,43220,43290,43310,43320,43330,43390,43910,43999" },
  restaurants: { label: "Restaurants and Hospitality", sic: "56101,56102,56103,56210,56290,56301,56302" },
  retail: { label: "Retail Businesses", sic: "47110,47190,47210,47220,47230,47240,47250,47260,47270,47280,47290,47300,47410,47510,47520,47530,47610,47620,47630,47640,47710,47720,47730,47740,47750,47760,47770,47910" },
  property: { label: "Property Companies", sic: "41100,68100,68201,68202,68209,68310,68320" },
  professional: { label: "Professional Services", sic: "69101,69102,69201,69202,69203,70100,70221,70229,71111,71112,71120,73110,73120,74100,74201,74209" },
  all: { label: "All SMEs", sic: "" },
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

function parseLeads(text, productLabel, isReferral) {
  const leads = [];

  // Try multiple splitting strategies
  let entries = [];

  // Strategy 1: numbered list
  const numbered = text.split(/\n(?=\*{0,2}\d+[\.\)]\s)/);
  if (numbered.length > 2) entries = numbered;

  // Strategy 2: split on bold company names **Company Name**
  if (entries.length < 2) {
    const bolded = text.split(/\n(?=\*\*[A-Z])/);
    if (bolded.length > 2) entries = bolded;
  }

  // Strategy 3: split on lines that look like company names (capitalized, short)
  if (entries.length < 2) {
    const lines = text.split("\n");
    let current = [];
    for (const line of lines) {
      const clean = line.replace(/\*\*/g, "").trim();
      if (clean.match(/^[A-Z][A-Za-z\s&,\.]{3,50}$/) && clean.length < 60 && !clean.includes("http") && !clean.includes("@")) {
        if (current.length > 2) entries.push(current.join("\n"));
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length > 2) entries.push(current.join("\n"));
  }

  // Strategy 4: just use the whole text and find all emails
  if (entries.length < 2) {
    const emailMatches = [...text.matchAll(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g)];
    const nameMatches = [...text.matchAll(/\*\*([A-Z][^*\n]{3,50})\*\*/g)];
    for (let i = 0; i < Math.max(emailMatches.length, nameMatches.length); i++) {
      const name = nameMatches[i] ? nameMatches[i][1].trim() : "";
      const email = emailMatches[i] ? emailMatches[i][0] : null;
      if (name && name.length > 2) {
        const startIdx = text.indexOf(nameMatches[i][0]);
        const context = text.slice(startIdx, startIdx + 300).replace(/\*\*/g, "").replace(/\n/g, " ");
        leads.push(buildLead(name, email, "Verified", context, productLabel, isReferral));
      }
    }
    if (leads.length > 0) return leads.slice(0, 6);
  }

  for (const entry of entries) {
    if (!entry.trim()) continue;
    const lines = entry.split("\n").map(l => l.replace(/\*\*/g, "").trim()).filter(Boolean);
    if (!lines.length) continue;

    let name = lines[0].replace(/^\d+[\.\)]\s*/, "").replace(/^[\*\s]+/, "").trim();
    if (name.includes(" - ")) name = name.split(" - ")[0].trim();
    if (name.includes(": ")) name = name.split(": ")[1]?.trim() || name;
    if (!name || name.length < 2) continue;

    const emailMatch = entry.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const context = lines.slice(1).join(" ").slice(0, 200);
    leads.push(buildLead(name, emailMatch ? emailMatch[0] : null, emailMatch ? "Verified" : null, context, productLabel, isReferral));
  }

  return leads.filter(l => l.companyName.length > 2).slice(0, 6);
}

function buildLead(name, email, emailConfidence, context, productLabel, isReferral) {
  const locationMatch = context.match(/\b(London|Manchester|Birmingham|Leeds|Bristol|Cardiff|Liverpool|Sheffield|Newcastle|Nottingham|Leicester|Edinburgh|Glasgow|Brighton|Oxford|Cambridge|Exeter|Southampton|Reading|Coventry|Derby|Hull|York|Bradford|Wakefield|Norwich|Ipswich|Chelmsford|Luton|Watford|Northampton|Kettering|Middlesbrough|Stockton|Darlington|Durham|Sunderland|Chester|Warrington|Birkenhead|Southport|Accrington|Burnley|Skipton|Harrogate|Selby|Pontefract|Dewsbury|Swansea|Newport|Bath|Swindon|Gloucester|Cheltenham|Worcester|Shrewsbury|Telford|Stafford|Lichfield|Tamworth|Walsall|Dudley|Solihull|Rugby|Leamington|Warwick|Nuneaton|Hinckley|Maidenhead|Berkshire|Surrey|Kent|Essex|Suffolk|Norfolk|Hertfordshire|Buckinghamshire|Oxfordshire|Wiltshire|Somerset|Devon|Cornwall|Dorset|Hampshire|Sussex|Cambridgeshire|Lincolnshire|Yorkshire|Lancashire|Cheshire|Derbyshire|Nottinghamshire|Leicestershire|Northamptonshire|Bedfordshire|Staffordshire|Shropshire|Herefordshire|Worcestershire|Gloucestershire|Avon|Cumbria|Northumberland|County Durham|Tyne and Wear|West Midlands|East Midlands|East Anglia|South East|South West|North West|North East|East of England|Wales|England)\b/i);
  const location = locationMatch ? locationMatch[0] : "England / Wales";

  const contactMatch = context.match(/([A-Z][a-z]+ [A-Z][a-z]+)(?:\s*[-–,]\s*(?:Partner|Director|Manager|Principal|Head|Founder|MD|CEO))/);
  const contactName = contactMatch ? contactMatch[1] : null;

  const emailBody = isReferral
    ? `Dear ${contactName || name + " Team"},\n\nI am writing from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe work with ${productLabel.toLowerCase()} firms on a referral basis. When your clients need bridging loans, development finance, business loans or merchant cash advances, we handle the entire process and pay you a referral fee for every completed deal.\n\nWould you be open to a brief conversation about how we could work together?\n\nKind regards,\n\nThe Team at GR Commercial Finance\nWeb: grcommercialfinance.co.uk\nEmail: enquiries@grcommercialfinance.co.uk\nMobile: 07510 859352\nManchester`
    : `Dear ${contactName || name + " Team"},\n\nI am writing from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe specialise in ${productLabel.toLowerCase()} and believe we could help your business. We offer fast approvals and competitive rates tailored to businesses like yours.\n\nPlease call us on 07510 859352 or reply to this email to discuss your requirements.\n\nKind regards,\n\nThe Team at GR Commercial Finance\nWeb: grcommercialfinance.co.uk\nEmail: enquiries@grcommercialfinance.co.uk\nMobile: 07510 859352\nManchester`;

  return {
    companyName: name,
    contactName,
    location,
    emailAddress: email,
    emailConfidence,
    signal: context.replace(/\n/g, " ").slice(0, 180),
    estimatedDeal: "GBP 100,000 - 500,000",
    urgency: "Medium",
    qualificationScore: email ? 78 : 65,
    partnerScore: email ? 78 : 65,
    clientProfile: context.slice(0, 120),
    referralOpportunity: context.slice(0, 180),
    contactHint: email ? "Email found - contact directly" : "Search " + name + " website for contact details",
    emailSubject: isReferral ? "Referral partnership - GR Commercial Finance" : productLabel + " - GR Commercial Finance",
    emailBodyCore: emailBody,
  };
}

async function searchLeads(apiKey, query, productLabel, isReferral) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: "You are a lead researcher for GR Commercial Finance. Search the web for real UK companies. Always present results as a numbered list. For each company, include their name on the first line of each entry, then their location, email address (found from their website contact page), and relevant details on separate lines. Be specific - use real company names and real email addresses found online.",
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: query }],
    }),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error " + r.status); }
  const d = await r.json();
  const text = d.content.filter(b => b.type === "text").map(b => b.text).join("");
  const leads = parseLeads(text, productLabel, isReferral);
  return { leads, rawText: text };
}

async function searchCH(query, sicCodes, location, maxResults) {
  const params = new URLSearchParams({ q: query || "limited", items_per_page: String(maxResults) });
  if (location) params.append("location", location);
  if (sicCodes) params.append("sic_codes", sicCodes);
  const r = await fetch("/api/companies?" + params.toString());
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Companies House error " + r.status); }
  return r.json();
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
  const [chProfile, setChProfile] = useState("construction");
  const [chLocation, setChLocation] = useState("");
  const [chQuery, setChQuery] = useState("");
  const [chResults, setChResults] = useState(50);
  const [chLeads, setChLeads] = useState([]);
  const [chSearching, setChSearching] = useState(false);
  const [chProgress, setChProgress] = useState("");
  const [chError, setChError] = useState("");
  const [chExpanded, setChExpanded] = useState(null);
  const [chCopied, setChCopied] = useState(null);
  const [chEnriching, setChEnriching] = useState(false);

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
    setChError(""); setChSearching(true); setChLeads([]); setChExpanded(null); setChProgress("Searching Companies House...");
    try {
      const profile = CH_PROFILES[chProfile];
      const data = await searchCH(chQuery || profile.label, profile.sic, chLocation, chResults);
      const companies = (data.items || []).map(c => ({
        companyName: c.company_name || "",
        companyNumber: c.company_number || "",
        location: [c.registered_office_address?.locality, c.registered_office_address?.region].filter(Boolean).join(", ") || chLocation || "England/Wales",
        postcode: c.registered_office_address?.postal_code || "",
        incorporatedOn: c.date_of_creation || "",
        emailAddress: "info@" + (c.company_name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".co.uk",
        emailConfidence: "Guessed",
        signal: profile.label + " company incorporated " + (c.date_of_creation || "unknown"),
        estimatedDeal: "GBP 50,000-250,000",
        urgency: "Medium",
        qualificationScore: 65,
        contactHint: "Find directors at company-information.service.gov.uk/company/" + c.company_number,
        emailSubject: "Business finance options - GR Commercial Finance",
        emailBodyCore: `Dear ${c.company_name} Team,\n\nI am writing from GR Commercial Finance, specialist commercial finance brokers covering England and Wales.\n\nWe help ${profile.label.toLowerCase()} access competitive business finance including loans, bridging finance and merchant cash advances. Fast approvals and personal service.\n\nWe would love to discuss how we can support your business.\n\n${EMAIL_SIG}`,
      }));
      if (companies.length === 0) { setChError("No companies found. Try different search terms."); setChSearching(false); return; }
      setChLeads(companies);
      setChProgress(companies.length + " companies found");

      // Enrich first 10 with AI emails
      if (apiKey && companies.length > 0) {
        setChEnriching(true);
        const toEnrich = companies.slice(0, 10);
        const enriched = [...companies];
        for (let i = 0; i < toEnrich.length; i++) {
          setChProgress("Writing outreach email " + (i + 1) + " of " + toEnrich.length + "...");
          try {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
              body: JSON.stringify({
                model: "claude-sonnet-4-6",
                max_tokens: 600,
                system: "You are a contact researcher. Search the web to find real email addresses for UK companies. Always search for the company website and look at their contact page. Reply in plain text only. No markdown.",
                tools: [{ type: "web_search_20250305", name: "web_search" }],
                messages: [{ role: "user", content: `Search the web for "${toEnrich[i].companyName}" UK company. Find their website and look at their contact page to get a real email address. Also find the name of a director or key contact if possible.\n\nReply in exactly this format:\nEMAIL: real@email.co.uk\nNAME: Contact Name or null\nREASON: one sentence why they might need ${profile.label} finance` }],
              }),
            });
            if (r.ok) {
              const d = await r.json();
              const text = d.content.filter(b => b.type === "text").map(b => b.text).join("");
              const em = text.match(/EMAIL:\s*([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/i);
              const nm = text.match(/NAME:\s*(.+)/i);
              const re = text.match(/REASON:\s*(.+)/i);
              if (em) enriched[i] = { ...enriched[i], emailAddress: em[1], emailConfidence: "Verified" };
              if (nm && nm[1].trim().toLowerCase() !== "null") enriched[i] = { ...enriched[i], contactName: nm[1].trim() };
              if (re) enriched[i] = { ...enriched[i], signal: re[1].trim() };
            }
          } catch {}
          if (i < toEnrich.length - 1) await new Promise(res => setTimeout(res, 800));
        }
        setChLeads(enriched);
        setChProgress("Done - " + companies.length + " companies ready");
        setChEnriching(false);
      }
    } catch (e) { setChError("Search failed: " + e.message); }
    finally { setChSearching(false); setChEnriching(false); }
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

  const exportCSV = (data) => {
    if (!data.length) return;
    const h = ["Company", "Contact", "Location", "Email", "Confidence", "Signal", "Est Deal", "Score", "Subject", "Email Body"];
    const rows = data.map(l => [l.companyName, l.contactName, l.location, l.emailAddress, l.emailConfidence, l.signal, l.estimatedDeal, l.qualificationScore || l.partnerScore, l.emailSubject, buildEmail(l).replace(/\n/g, " ")]);
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
              {lead.contactName && <span style={{ fontSize: 11, color: "#4b5563" }}>{lead.contactName}</span>}
              {lead.urgency && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: urgBg(lead.urgency), color: urgFg(lead.urgency) }}>{lead.urgency}</span>}
              {lead.companyNumber && <span style={{ fontSize: 10, color: "#374151" }}>#{lead.companyNumber}</span>}
            </div>
            <div style={{ fontSize: 11, color: "#374151", marginBottom: 5 }}>{lead.location}{lead.postcode ? " " + lead.postcode : ""}</div>
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
              <button onClick={e => openZoho(e, lead)} style={{ padding: "5px 14px", borderRadius: 4, border: "none", background: "#c8952a", color: "#fff", cursor: "pointer", fontSize: 11 }}>Open Zoho (paste with Ctrl+V)</button>
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#374151", textTransform: "uppercase" }}>Anthropic Key</span>
          <input type="password" placeholder="sk-ant-api..." value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: 160, background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "6px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
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
            <div style={{ fontSize: 14, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>Companies House Bulk Search</div>
            <div style={{ fontSize: 11, color: "#374151", marginBottom: 16 }}>Pulls directly from Companies House API. First 10 companies get personalised AI outreach emails.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Industry</label>
                <select value={chProfile} onChange={e => setChProfile(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none" }}>
                  {Object.entries(CH_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Location (optional)</label>
                <input placeholder="e.g. Manchester, Bristol..." value={chLocation} onChange={e => setChLocation(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Keyword (optional)</label>
                <input placeholder="e.g. roofing, pizza..." value={chQuery} onChange={e => setChQuery(e.target.value)} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Max results</label>
                <select value={chResults} onChange={e => setChResults(Number(e.target.value))} style={{ width: "100%", background: "#09090d", border: "1px solid #1c1c28", borderRadius: 5, padding: "8px 10px", color: "#ddd8ce", fontSize: 12, outline: "none" }}>
                  <option value={20}>20 companies</option>
                  <option value={50}>50 companies</option>
                  <option value={100}>100 companies</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={handleCHSearch} disabled={chSearching || chEnriching} style={{ padding: "9px 24px", borderRadius: 5, border: "none", background: chSearching || chEnriching ? "#1c1c28" : "#f59e0b", color: chSearching || chEnriching ? "#4b5563" : "#000", cursor: chSearching || chEnriching ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
                {chSearching || chEnriching ? chProgress || "Searching..." : "Search Companies House"}
              </button>
              {chLeads.length > 0 && <>
                <button onClick={() => exportCSV(chLeads)} style={{ padding: "8px 14px", borderRadius: 5, border: "1px solid #1c1c28", background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: 12 }}>Export CSV</button>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{chLeads.length} companies</span>
              </>}
            </div>
          </div>
          {chError && <div style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 6, padding: "9px 14px", marginBottom: 12, color: "#fca5a5", fontSize: 12 }}>{chError}</div>}
          {(chSearching || chEnriching) && chProgress && <div style={{ background: "#0a0f1a", border: "1px solid #1c3a5a", borderRadius: 6, padding: "9px 14px", marginBottom: 14, fontSize: 12, color: "#60a5fa" }}>{chProgress}</div>}
          {chLeads.map((l, i) => <Card key={i} lead={l} i={i} exp={chExpanded} setExp={setChExpanded} cop={chCopied} setCop={setChCopied} />)}
          {!chSearching && !chEnriching && chLeads.length === 0 && !chError && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 14, color: "#374151", marginBottom: 6 }}>Search Companies House for bulk leads</div>
              <div style={{ fontSize: 12, color: "#1f2937" }}>Select an industry and click Search. Uses the Companies House API directly.</div>
            </div>
          )}
        </div>
      )}

      {mode !== "companies" && (
        <>
          <div style={{ background: "#0c0c12", borderBottom: "1px solid #1c1c28", padding: "0 24px", display: "flex", overflowX: "auto" }}>
            {Object.entries(mode === "direct" ? PRODUCTS.direct : PRODUCTS.referral).map(([key, cfg]) => (
              <button key={key} onClick={() => { mode === "direct" ? setActiveProduct(key) : setActivePartner(key); setLeads([]); setRawText(""); setError(""); }} style={{ padding: "9px 14px", border: "none", borderBottom: (mode === "direct" ? activeProduct : activePartner) === key ? "2px solid " + cfg.color : "2px solid transparent", background: "transparent", color: (mode === "direct" ? activeProduct : activePartner) === key ? cfg.color : "#374151", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 13, color: curProd.color, fontWeight: 600 }}>{curProd.label}</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                {leads.length > 0 && <button onClick={() => exportCSV(leads)} style={{ padding: "7px 14px", borderRadius: 5, border: "1px solid #1c1c28", background: "transparent", color: "#4b5563", cursor: "pointer", fontSize: 12 }}>Export CSV</button>}
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
                <div style={{ fontSize: 12, color: "#1f2937" }}>Enter your Anthropic API key and click {mode === "direct" ? "Hunt Leads" : "Find Partners"}</div>
              </div>
            )}
            {rawText && leads.length === 0 && !searching && (
              <div style={{ background: "#0f0f16", border: "1px solid #1c1c28", borderRadius: 6, padding: "12px", marginTop: 12 }}>
                <div style={{ fontSize: 10, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Raw results (parsing failed - copy manually)</div>
                <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{rawText.slice(0, 1500)}</div>
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
