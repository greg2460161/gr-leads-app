import { useState } from "react";

const BRAND = {
  name: "GR Commercial Finance",
  website: "grcommercialfinance.co.uk",
  location: "Manchester",
  email: "enquiries@grcommercialfinance.co.uk",
  phone: "07510 859352",
  emailSignature: `Kind regards,

The Team at GR Commercial Finance
Specialist Commercial Finance Brokers | England & Wales
🌐 grcommercialfinance.co.uk
📧 enquiries@grcommercialfinance.co.uk
📱 07510 859352
📍 Manchester

We arrange bridging loans, development finance, refurbishment loans, business loans and merchant cash advances. Fast approvals, competitive rates, personal service.

---
GR Commercial Finance is a commercial finance broker, not a lender. All finance is subject to status and valuation. Your property may be repossessed if you do not keep up repayments on a loan secured against it.`,
  referralSignature: `Kind regards,

The Team at GR Commercial Finance
Specialist Commercial Finance Brokers | England & Wales
🌐 grcommercialfinance.co.uk
📧 enquiries@grcommercialfinance.co.uk
📱 07510 859352
📍 Manchester

We arrange bridging loans, development finance, refurbishment loans, business loans and merchant cash advances. Fast approvals, competitive rates, personal service. We offer a referral fee structure for introducers.

---
GR Commercial Finance is a commercial finance broker, not a lender. All finance is subject to status and valuation.`,
};

const DIRECT_PRODUCTS = {
  bridging: {
    label: "Bridging Finance", color: "#c8952a", icon: "🏗️",
    description: "Auction buyers, chain breaks, urgent property purchases",
    sources: ["property auction catalogues", "rightmove", "land registry", "property forums"],
    searchQueries: [
      "property auction upcoming lots England Wales 2026 28 day completion",
      "property auction buyer bridging finance needed England Wales 2026",
      "chain break property purchase urgent finance England Wales",
      "auction property lot guide price England Wales 2026",
    ],
  },
  development: {
    label: "Development Finance", color: "#2a7fc8", icon: "🏢",
    description: "Planning permissions granted, new build & conversion projects",
    sources: ["planning portal", "local council planning", "Companies House"],
    searchQueries: [
      "planning permission granted residential development England Wales 2026",
      "permitted development conversion office residential England 2026",
      "new build development site acquisition finance England Wales",
      "property developer planning approved England Wales 2026",
    ],
  },
  refurbishment: {
    label: "Refurbishment Loans", color: "#9b5cf6", icon: "🔨",
    description: "Heavy refurb, HMO conversions, property upgrades",
    sources: ["EPC register", "planning applications", "property portals"],
    searchQueries: [
      "HMO conversion planning application England Wales 2026",
      "heavy refurbishment property investor England Wales buy renovate",
      "property refurbishment project investor developer England Wales 2026",
      "EPC rating F G commercial residential property refurbishment England",
    ],
  },
  businessloan: {
    label: "Business Loans", color: "#2ac87a", icon: "💼",
    description: "SMEs in England & Wales seeking growth capital",
    sources: ["Companies House", "business news", "trade press"],
    searchQueries: [
      "SME business expansion new contract win England Wales 2026",
      "company new premises expansion hire staff England Wales 2026",
      "small business growth funding needed England Wales 2026",
      "new company registration England Wales 2026",
    ],
  },
  mca: {
    label: "Merchant Cash Advance", color: "#ef4444", icon: "💳",
    description: "Retail, hospitality & card-taking SMEs needing fast cash",
    sources: ["Google Maps", "hospitality directories", "new business openings"],
    searchQueries: [
      "restaurant cafe bar new opening England Wales 2026",
      "retail shop new opening high street England Wales 2026",
      "hospitality business cash flow England Wales small business 2026",
      "new SME business opening England Wales 2026",
    ],
  },
};

const REFERRAL_PARTNERS = {
  accountants: {
    label: "Accountants", color: "#0ea5e9", icon: "📊",
    description: "SME accountants whose clients need business finance",
    searchQueries: ["chartered accountant SME clients England Wales 2026", "accountancy firm small business England Wales"],
    emailAngle: "Your SME clients may need business loans, bridging or development finance — we pay referral fees and handle everything.",
  },
  ifas: {
    label: "IFAs", color: "#f59e0b", icon: "📈",
    description: "Independent financial advisers with property investor clients",
    searchQueries: ["independent financial adviser IFA property investor England Wales", "IFA financial planner buy to let clients England Wales 2026"],
    emailAngle: "Your property investor and business owner clients likely need specialist commercial finance — we offer competitive referral fees.",
  },
  architects: {
    label: "Architects", color: "#8b5cf6", icon: "📐",
    description: "Architects whose clients need development or refurb finance",
    searchQueries: ["architect practice residential development projects England Wales 2026", "architect firm conversion refurbishment projects England Wales"],
    emailAngle: "When your clients get planning approved, they often need development or refurbishment finance fast — we can help and reward the introduction.",
  },
  construction: {
    label: "Construction Firms", color: "#f97316", icon: "🏗️",
    description: "Builders & contractors whose clients need project finance",
    searchQueries: ["construction firm builder England Wales residential development 2026", "building contractor new project England Wales property developer"],
    emailAngle: "Your developer clients need fast, reliable project finance to get builds started — we can fund them and pay you for the introduction.",
  },
  solicitors: {
    label: "Solicitors", color: "#10b981", icon: "⚖️",
    description: "Property & commercial solicitors handling transactions",
    searchQueries: ["property solicitor conveyancing practice England Wales 2026", "commercial property solicitor England Wales transactions"],
    emailAngle: "Your property and commercial clients regularly need bridging and development finance — we complete fast and pay referral fees.",
  },
  estateagents: {
    label: "Estate Agents", color: "#ec4899", icon: "🏡",
    description: "Agents with buyers who need fast finance",
    searchQueries: ["estate agent property sales England Wales 2026", "estate agency residential commercial England Wales buyers"],
    emailAngle: "When your buyers need fast finance to complete — bridging, development or commercial — we move quickly and pay you for the referral.",
  },
};

const DIRECT_PROMPT = (product) => `You are a specialist lead generation agent for GR Commercial Finance (grcommercialfinance.co.uk), a Manchester-based commercial finance broker covering England and Wales.

PRODUCT: ${product.label}
TARGET: ${product.description}
SOURCES: ${product.sources.join(", ")}
DEAL SIZE: £50,000–£2,000,000
GEOGRAPHY: England and Wales only

Find real prospects who likely need ${product.label} RIGHT NOW.

EMAIL CONFIDENCE: "Verified" = publicly listed, "Likely" = constructed from name+domain, "Guessed" = domain only

Return ONLY valid JSON:
{
  "leads": [
    {
      "companyName": "Real Company Name",
      "contactName": "Real name or null",
      "jobTitle": "Title or null",
      "location": "Town, County, England or Wales",
      "website": "domain.co.uk or null",
      "email": { "address": "email or null", "confidence": "Verified/Likely/Guessed", "source": "How found" },
      "signal": "Specific reason they need ${product.label} now",
      "estimatedDeal": "£XXX,XXX",
      "urgency": "High/Medium/Low",
      "qualificationScore": 82,
      "contactHint": "How to reach them",
      "outreachEmail": {
        "subject": "Personalised subject line",
        "body": "Dear [Name],\\n\\n[3-4 sentences specific to their situation from GR Commercial Finance]\\n\\n${BRAND.emailSignature}"
      }
    }
  ],
  "searchSummary": "What was found",
  "dataSource": "Sources used"
}
Find 3-5 leads scoring 60+.`;

const REFERRAL_PROMPT = (partner) => `You are a referral partner outreach agent for GR Commercial Finance (grcommercialfinance.co.uk), Manchester-based commercial finance broker, England and Wales.

PARTNER TYPE: ${partner.label}
WHY VALUABLE: ${partner.description}
ANGLE: ${partner.emailAngle}

Find real ${partner.label} firms in England and Wales. Goal: build referral partnerships, NOT sell them finance.

EMAIL CONFIDENCE: "Verified" = publicly listed, "Likely" = constructed, "Guessed" = domain only

Return ONLY valid JSON:
{
  "partners": [
    {
      "companyName": "Real Firm Name",
      "contactName": "Real name or null",
      "jobTitle": "Partner/Director/Principal or null",
      "location": "Town, County, England or Wales",
      "website": "domain.co.uk or null",
      "email": { "address": "email or null", "confidence": "Verified/Likely/Guessed", "source": "How found" },
      "firmSize": "Solo/Small (2-10)/Mid (10-50)/Large (50+)",
      "clientProfile": "Type of clients this firm works with",
      "referralOpportunity": "Why they'd be a good referral partner",
      "partnerScore": 78,
      "contactHint": "How to approach",
      "outreachEmail": {
        "subject": "Partnership subject line",
        "body": "Dear [Name],\\n\\n[3-4 sentences: who GR Commercial Finance are, why their clients need us, referral fees, call to action]\\n\\n${BRAND.referralSignature}"
      }
    }
  ],
  "searchSummary": "What was found",
  "dataSource": "Sources used"
}
Find 3-5 partners scoring 60+.`;

const LOGIN_PASSWORD = "GRLeads2026";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [mode, setMode] = useState("direct");
  const [activeDirectProduct, setActiveDirectProduct] = useState("bridging");
  const [activeReferralPartner, setActiveReferralPartner] = useState("accountants");
  const [searchMode, setSearchMode] = useState("single");
  const [isSearching, setIsSearching] = useState(false);
  const [directLeads, setDirectLeads] = useState({});
  const [referralLeads, setReferralLeads] = useState({});
  const [summary, setSummary] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [error, setError] = useState("");
  const [expandedLead, setExpandedLead] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, product: "" });
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(null);
  const [viewMode, setViewMode] = useState("cards");

  const handleLogin = () => {
    if (pw === LOGIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const callAPI = async (systemPrompt, userMessage) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2500,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || "API error"); }
    const data = await response.json();
    const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
if (!match) throw new Error("Could not parse response");
try {
  return JSON.parse(match[0]);
} catch {
  const fixed = match[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
  return JSON.parse(fixed);
}
  };

  const searchDirect = async (key) => {
    const p = DIRECT_PRODUCTS[key];
    const q = p.searchQueries[Math.floor(Math.random() * p.searchQueries.length)];
    return callAPI(DIRECT_PROMPT(p), `Search: "${q}"\nFind ${p.label} prospects in England & Wales for GR Commercial Finance. £50k–£2m. JSON only.`);
  };

  const searchReferral = async (key) => {
    const p = REFERRAL_PARTNERS[key];
    const q = p.searchQueries[Math.floor(Math.random() * p.searchQueries.length)];
    return callAPI(REFERRAL_PROMPT(p), `Search: "${q}"\nFind ${p.label} referral partners in England & Wales for GR Commercial Finance. JSON only.`);
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) { setError("Please enter your Anthropic API key."); return; }
    setError(""); setIsSearching(true); setSummary(""); setDataSource(""); setExpandedLead(null);
    try {
      if (mode === "direct") {
        if (searchMode === "single") {
          const r = await searchDirect(activeDirectProduct);
          setDirectLeads(prev => ({ ...prev, [activeDirectProduct]: r.leads || [] }));
          setSummary(r.searchSummary || ""); setDataSource(r.dataSource || "");
        } else {
          const keys = Object.keys(DIRECT_PRODUCTS);
          const combined = {};
          for (let i = 0; i < keys.length; i++) {
            setProgress({ current: i + 1, total: keys.length, product: DIRECT_PRODUCTS[keys[i]].label });
            try { combined[keys[i]] = (await searchDirect(keys[i])).leads || []; } catch { combined[keys[i]] = []; }
          }
          setDirectLeads(combined);
          setSummary("Leads found across all 5 products — England & Wales.");
          setProgress({ current: 0, total: 0, product: "" });
        }
      } else {
        if (searchMode === "single") {
          const r = await searchReferral(activeReferralPartner);
          setReferralLeads(prev => ({ ...prev, [activeReferralPartner]: r.partners || [] }));
          setSummary(r.searchSummary || ""); setDataSource(r.dataSource || "");
        } else {
          const keys = Object.keys(REFERRAL_PARTNERS);
          const combined = {};
          for (let i = 0; i < keys.length; i++) {
            setProgress({ current: i + 1, total: keys.length, product: REFERRAL_PARTNERS[keys[i]].label });
            try { combined[keys[i]] = (await searchReferral(keys[i])).partners || []; } catch { combined[keys[i]] = []; }
          }
          setReferralLeads(combined);
          setSummary("Referral partners found across all 6 partner types — England & Wales.");
          setProgress({ current: 0, total: 0, product: "" });
        }
      }
    } catch (e) { setError("Search failed: " + e.message); }
    finally { setIsSearching(false); }
  };

  const getLeads = () => mode === "direct"
    ? (searchMode === "all" ? Object.values(directLeads).flat() : (directLeads[activeDirectProduct] || []))
    : (searchMode === "all" ? Object.values(referralLeads).flat() : (referralLeads[activeReferralPartner] || []));

  const exportCSV = () => {
    const leads = getLeads(); if (!leads.length) return;
    const isR = mode === "referral";
    const headers = isR
      ? ["Company","Contact","Title","Location","Website","Email","Confidence","Firm Size","Client Profile","Opportunity","Score","Approach","Subject","Email Body"]
      : ["Company","Contact","Title","Location","Website","Email","Confidence","Signal","Est Deal","Urgency","Score","Approach","Subject","Email Body"];
    const rows = leads.map(l => isR
      ? [l.companyName,l.contactName,l.jobTitle,l.location,l.website,l.email?.address,l.email?.confidence,l.firmSize,l.clientProfile,l.referralOpportunity,l.partnerScore,l.contactHint,l.outreachEmail?.subject,l.outreachEmail?.body?.replace(/\n/g," ")]
      : [l.companyName,l.contactName,l.jobTitle,l.location,l.website,l.email?.address,l.email?.confidence,l.signal,l.estimatedDeal,l.urgency,l.qualificationScore,l.contactHint,l.outreachEmail?.subject,l.outreachEmail?.body?.replace(/\n/g," ")]
    );
    const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `gr-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const copyEmail = (e, i, lead) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`To: ${lead.email?.address||""}\nSubject: ${lead.outreachEmail?.subject}\n\n${lead.outreachEmail?.body}`);
    setCopied(i); setTimeout(()=>setCopied(null),2000);
  };

  const displayLeads = getLeads();
  const urgBg = u => ({High:"#7f1d1d",Medium:"#78350f",Low:"#1f2937"}[u]||"#1f2937");
  const urgFg = u => ({High:"#fca5a5",Medium:"#fcd34d",Low:"#9ca3af"}[u]||"#9ca3af");
  const scoreCol = s => s>=80?"#4ade80":s>=65?"#fbbf24":"#f87171";
  const confBadge = c => ({Verified:{bg:"#14532d",fg:"#86efac",icon:"✓"},Likely:{bg:"#78350f",fg:"#fcd34d",icon:"~"},Guessed:{bg:"#1e1e2a",fg:"#9ca3af",icon:"?"}}[c]||{bg:"#1e1e2a",fg:"#9ca3af",icon:"?"});
  const activeProduct = mode === "direct" ? DIRECT_PRODUCTS[activeDirectProduct] : REFERRAL_PARTNERS[activeReferralPartner];

  // LOGIN SCREEN
  if (!authed) return (
    <div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",background:"#09090d",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:12,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:10,background:"linear-gradient(135deg,#c8952a,#8a6018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 20px"}}>GR</div>
        <div style={{fontSize:18,fontWeight:700,color:"#ede8de",marginBottom:4}}>GR Commercial Finance</div>
        <div style={{fontSize:12,color:"#374151",marginBottom:28}}>Lead Intelligence System</div>
        <input type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          style={{width:"100%",background:"#09090d",border:`1px solid ${pwError?"#7f1d1d":"#1c1c28"}`,borderRadius:6,padding:"10px 14px",color:"#ddd8ce",fontSize:14,outline:"none",marginBottom:8,textAlign:"center"}}/>
        {pwError&&<div style={{color:"#fca5a5",fontSize:12,marginBottom:8}}>Incorrect password</div>}
        <button onClick={handleLogin} style={{width:"100%",padding:"10px",borderRadius:6,border:"none",background:"#c8952a",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          Log In
        </button>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",background:"#09090d",minHeight:"100vh",color:"#ddd8ce"}}>
      {/* Header */}
      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:7,background:"linear-gradient(135deg,#c8952a,#8a6018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>GR</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>GR Commercial Finance</div>
            <div style={{fontSize:10,color:"#374151"}}>Lead Intelligence · grcommercialfinance.co.uk</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1}}>API Key</span>
          <input type="password" placeholder="sk-ant-api..." value={apiKey} onChange={e=>setApiKey(e.target.value)}
            style={{width:190,background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"6px 10px",color:"#ddd8ce",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex"}}>
        <button onClick={()=>{setMode("direct");setSearchMode("single");setSummary("");setDataSource("");}}
          style={{padding:"12px 20px",border:"none",borderBottom:mode==="direct"?"2px solid #c8952a":"2px solid transparent",background:"transparent",color:mode==="direct"?"#c8952a":"#4b5563",cursor:"pointer",fontSize:13,fontWeight:700}}>
          🎯 Direct Leads
        </button>
        <button onClick={()=>{setMode("referral");setSearchMode("single");setSummary("");setDataSource("");}}
          style={{padding:"12px 20px",border:"none",borderBottom:mode==="referral"?"2px solid #2ac87a":"2px solid transparent",background:"transparent",color:mode==="referral"?"#2ac87a":"#4b5563",cursor:"pointer",fontSize:13,fontWeight:700}}>
          🤝 Referral Partners
        </button>
        <button onClick={()=>setSearchMode("all")}
          style={{padding:"12px 14px",border:"none",borderBottom:searchMode==="all"?"2px solid #6b7280":"2px solid transparent",background:"transparent",color:searchMode==="all"?"#9ca3af":"#374151",cursor:"pointer",fontSize:11,fontWeight:600,marginLeft:"auto"}}>
          ⚡ Hunt All
        </button>
      </div>

      {/* Sub nav */}
      <div style={{background:"#0c0c12",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {(mode==="direct"?Object.entries(DIRECT_PRODUCTS):Object.entries(REFERRAL_PARTNERS)).map(([key,cfg])=>(
          <button key={key} onClick={()=>{mode==="direct"?setActiveDirectProduct(key):setActiveReferralPartner(key);setSearchMode("single");setSummary("");setDataSource("");}}
            style={{padding:"9px 14px",border:"none",borderBottom:(mode==="direct"?activeDirectProduct:activeReferralPartner)===key&&searchMode==="single"?`2px solid ${cfg.color}`:"2px solid transparent",background:"transparent",color:(mode==="direct"?activeDirectProduct:activeReferralPartner)===key&&searchMode==="single"?cfg.color:"#374151",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:1040,margin:"0 auto",padding:"20px 24px"}}>
        {/* Action bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:13,color:activeProduct.color,fontWeight:600,marginBottom:2}}>{activeProduct.icon} {activeProduct.label}</div>
            <div style={{fontSize:11,color:"#374151"}}>{activeProduct.description}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {displayLeads.length>0&&<>
              <button onClick={()=>setViewMode(v=>v==="cards"?"table":"cards")} style={{padding:"7px 12px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:11}}>{viewMode==="cards"?"⊞ Table":"☰ Cards"}</button>
              <button onClick={exportCSV} style={{padding:"7px 14px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:12}}>↓ CSV</button>
            </>}
            <button onClick={handleSearch} disabled={isSearching}
              style={{padding:"8px 22px",borderRadius:5,border:"none",background:isSearching?"#1c1c28":mode==="direct"?"#c8952a":"#2ac87a",color:isSearching?"#4b5563":"#fff",cursor:isSearching?"not-allowed":"pointer",fontSize:13,fontWeight:700,minWidth:140}}>
              {isSearching?progress.total>0?`${progress.product} (${progress.current}/${progress.total})`:"Searching…":mode==="direct"?"🎯 Hunt Leads":"🤝 Find Partners"}
            </button>
          </div>
        </div>

        {error&&<div style={{background:"#1a0808",border:"1px solid #7f1d1d",borderRadius:6,padding:"9px 14px",marginBottom:12,color:"#fca5a5",fontSize:12}}>{error}</div>}
        {(summary||dataSource)&&<div style={{background:"#0a120a",border:"1px solid #14532d44",borderRadius:6,padding:"9px 14px",marginBottom:14,fontSize:12}}>
          {summary&&<div style={{color:"#86efac",marginBottom:dataSource?3:0}}>📊 {summary}</div>}
          {dataSource&&<div style={{color:"#374151"}}>Sources: {dataSource}</div>}
        </div>}

        {/* TABLE VIEW */}
        {viewMode==="table"&&displayLeads.length>0&&(
          <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #1c1c28"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28"}}>
                {(mode==="direct"?["Company","Contact","Location","Email","Conf","Signal","Deal","Urgency","Score",""]
                  :["Firm","Contact","Location","Email","Conf","Client Profile","Opportunity","Size","Score",""]).map(h=>(
                  <th key={h} style={{padding:"9px 10px",textAlign:"left",color:"#374151",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{displayLeads.map((lead,i)=>{
                const cb=confBadge(lead.email?.confidence);
                const score=lead.qualificationScore||lead.partnerScore;
                return(<tr key={i} style={{borderBottom:"1px solid #1c1c28",background:i%2===0?"#09090d":"#0c0c12"}}>
                  <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:600}}>{lead.companyName}</td>
                  <td style={{padding:"8px 10px",color:"#6b7280"}}>{lead.contactName||"—"}</td>
                  <td style={{padding:"8px 10px",color:"#4b5563",whiteSpace:"nowrap"}}>📍 {lead.location}</td>
                  <td style={{padding:"8px 10px"}}>{lead.email?.address?<span style={{color:"#c8952a",fontFamily:"monospace"}}>{lead.email.address}</span>:<span style={{color:"#1f2937"}}>—</span>}</td>
                  <td style={{padding:"8px 10px"}}>{lead.email?.confidence&&<span style={{padding:"2px 6px",borderRadius:3,background:cb.bg,color:cb.fg,fontSize:10}}>{cb.icon} {lead.email.confidence}</span>}</td>
                  {mode==="direct"?<>
                    <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:160}}>{lead.signal}</td>
                    <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:700,whiteSpace:"nowrap"}}>{lead.estimatedDeal}</td>
                    <td style={{padding:"8px 10px"}}><span style={{padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency),fontSize:10}}>{lead.urgency}</span></td>
                  </>:<>
                    <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:140}}>{lead.clientProfile}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:160}}>{lead.referralOpportunity}</td>
                    <td style={{padding:"8px 10px",color:"#4b5563"}}>{lead.firmSize}</td>
                  </>}
                  <td style={{padding:"8px 10px"}}><span style={{color:scoreCol(score),fontWeight:700}}>{score}</span></td>
                  <td style={{padding:"8px 10px"}}><button onClick={e=>copyEmail(e,i,lead)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{copied===i?"✓":"Copy"}</button></td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        )}

        {/* CARD VIEW */}
        {viewMode==="cards"&&displayLeads.length>0&&(
          <div>
            <div style={{fontSize:10,letterSpacing:2,color:"#1f2937",textTransform:"uppercase",marginBottom:10}}>{displayLeads.length} {mode==="direct"?"Lead":"Partner"}{displayLeads.length!==1?"s":""} — click to expand</div>
            <div style={{display:"grid",gap:8}}>
              {displayLeads.map((lead,i)=>{
                const cb=confBadge(lead.email?.confidence);
                const score=lead.qualificationScore||lead.partnerScore;
                return(<div key={i} onClick={()=>setExpandedLead(expandedLead===i?null:i)}
                  style={{background:"#0f0f16",border:`1px solid ${expandedLead===i?"#c8952a44":"#1c1c28"}`,borderRadius:8,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}}>
                  <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.companyName}</span>
                        {lead.contactName&&<span style={{fontSize:11,color:"#4b5563"}}>{lead.contactName}{lead.jobTitle?` · ${lead.jobTitle}`:""}</span>}
                        {mode==="direct"&&lead.urgency&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency)}}>{lead.urgency}</span>}
                        {mode==="referral"&&lead.firmSize&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:"#1e1e2a",color:"#6b7280"}}>{lead.firmSize}</span>}
                      </div>
                      <div style={{fontSize:11,color:"#374151",marginBottom:5}}>📍 {lead.location}{lead.website?` · 🌐 ${lead.website}`:""}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        {lead.email?.address
                          ?<><span style={{fontSize:11,color:"#c8952a",fontFamily:"monospace",background:"#c8952a11",padding:"2px 8px",borderRadius:3}}>✉ {lead.email.address}</span>
                            <span style={{fontSize:10,padding:"2px 5px",borderRadius:3,background:cb.bg,color:cb.fg}}>{cb.icon} {lead.email.confidence}</span></>
                          :<span style={{fontSize:11,color:"#1f2937"}}>✉ Email not found</span>}
                      </div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{mode==="direct"?lead.signal:lead.referralOpportunity}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {mode==="direct"&&<><div style={{fontSize:15,fontWeight:700,color:"#ede8de"}}>{lead.estimatedDeal}</div><div style={{fontSize:10,color:"#374151",marginBottom:6}}>est. deal</div></>}
                      {mode==="referral"&&<div style={{fontSize:10,color:"#374151",marginBottom:6}}>Partner Score</div>}
                      <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${scoreCol(score)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:scoreCol(score),marginLeft:"auto"}}>{score}</div>
                    </div>
                  </div>
                  {expandedLead===i&&(
                    <div style={{borderTop:"1px solid #1c1c28",padding:"13px 16px",background:"#09090d"}}>
                      {lead.email?.source&&<div style={{fontSize:10,color:"#374151",marginBottom:10}}>📧 Email source: {lead.email.source}</div>}
                      {lead.contactHint&&<div style={{marginBottom:12}}>
                        <div style={{fontSize:10,letterSpacing:1.5,color:"#374151",textTransform:"uppercase",marginBottom:4}}>How to Approach</div>
                        <div style={{fontSize:12,color:"#6b7280"}}>{lead.contactHint}</div>
                      </div>}
                      {lead.outreachEmail&&<div>
                        <div style={{fontSize:10,letterSpacing:1.5,color:"#374151",textTransform:"uppercase",marginBottom:6}}>
                          {mode==="direct"?"GR Commercial Finance Outreach Email":"GR Commercial Finance Partnership Email"}
                        </div>
                        <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:6,padding:"10px 13px",marginBottom:8}}>
                          {lead.email?.address&&<div style={{fontSize:11,color:"#374151",marginBottom:4}}>To: <span style={{color:"#c8952a",fontFamily:"monospace"}}>{lead.email.address}</span></div>}
                          <div style={{fontSize:11,color:"#374151",marginBottom:8}}>Subject: <span style={{color:"#ede8de",fontWeight:500}}>{lead.outreachEmail.subject}</span></div>
                          <div style={{fontSize:11,color:"#6b7280",lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:"1px solid #1c1c28",paddingTop:8}}>{lead.outreachEmail.body}</div>
                        </div>
                        <button onClick={e=>copyEmail(e,i,lead)} style={{padding:"5px 14px",borderRadius:4,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:11}}>
                          {copied===i?"✓ Copied":"Copy full email"}
                        </button>
                      </div>}
                    </div>
                  )}
                </div>);
              })}
            </div>
          </div>
        )}

        {!isSearching&&displayLeads.length===0&&!error&&(
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{width:52,height:52,borderRadius:12,background:mode==="direct"?"#c8952a11":"#2ac87a11",border:`1px solid ${mode==="direct"?"#c8952a22":"#2ac87a22"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px"}}>
              {mode==="direct"?"🎯":"🤝"}
            </div>
            <div style={{fontSize:14,color:"#374151",marginBottom:6}}>{mode==="direct"?"Ready to hunt direct leads":"Ready to find referral partners"}</div>
            <div style={{fontSize:12,color:"#1f2937"}}>Enter your Anthropic API key above · Select a product · Click {mode==="direct"?"Hunt Leads":"Find Partners"}</div>
          </div>
        )}

        <div style={{marginTop:28,paddingTop:14,borderTop:"1px solid #1c1c28",display:"flex",justifyContent:"space-between",fontSize:10,color:"#1f2937",flexWrap:"wrap",gap:8}}>
          <span>GR Commercial Finance · enquiries@grcommercialfinance.co.uk · 07510 859352 · Manchester</span>
          <span>Public data only · Comply with UK GDPR & FCA rules before outreach</span>
        </div>
      </div>
    </div>
  );
}
