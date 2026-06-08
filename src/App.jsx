import { useState } from "react";

const DIRECT_PRODUCTS = {
  bridging: {
    label: "Bridging Finance", color: "#c8952a",
    description: "Auction buyers, chain breaks, urgent property purchases",
    searchQuery: "property auction upcoming lots England Wales 2026 bridging finance needed",
  },
  development: {
    label: "Development Finance", color: "#2a7fc8",
    description: "Planning permissions granted, new build and conversion projects",
    searchQuery: "planning permission granted residential development England Wales 2026",
  },
  refurbishment: {
    label: "Refurbishment Loans", color: "#9b5cf6",
    description: "Heavy refurb, HMO conversions, property upgrades",
    searchQuery: "HMO conversion refurbishment property investor England Wales 2026",
  },
  businessloan: {
    label: "Business Loans", color: "#2ac87a",
    description: "SMEs in England and Wales seeking growth capital",
    searchQuery: "SME business expansion funding England Wales 2026",
  },
  mca: {
    label: "Merchant Cash Advance", color: "#ef4444",
    description: "Retail, hospitality and card-taking SMEs needing fast cash",
    searchQuery: "new restaurant retail business opening England Wales 2026",
  },
};

const REFERRAL_PARTNERS = {
  accountants: { label: "Accountants", color: "#0ea5e9", description: "SME accountants", searchQuery: "accountancy firm SME clients England Wales 2026" },
  ifas: { label: "IFAs", color: "#f59e0b", description: "Independent financial advisers", searchQuery: "independent financial adviser IFA England Wales 2026" },
  architects: { label: "Architects", color: "#8b5cf6", description: "Architects with developer clients", searchQuery: "architect practice development projects England Wales 2026" },
  construction: { label: "Construction Firms", color: "#f97316", description: "Builders and contractors", searchQuery: "construction firm builder England Wales 2026" },
  solicitors: { label: "Solicitors", color: "#10b981", description: "Property solicitors", searchQuery: "property solicitor conveyancing England Wales 2026" },
  estateagents: { label: "Estate Agents", color: "#ec4899", description: "Estate agents", searchQuery: "estate agent property sales England Wales 2026" },
};

const CH_PROFILES = {
  construction: { label: "Construction Companies", sicCodes: ["41100","41201","41202","42110","42120","42130","42210","42220","42910","42990","43110","43120","43130","43210","43220","43290","43310","43320","43330","43341","43342","43390","43910","43991","43999"], description: "Construction and building firms" },
  restaurants: { label: "Restaurants and Hospitality", sicCodes: ["56101","56102","56103","56210","56290","56301","56302"], description: "Restaurants, cafes, bars and hospitality" },
  retail: { label: "Retail Businesses", sicCodes: ["47110","47190","47210","47220","47230","47240","47250","47260","47270","47280","47290","47300","47410","47421","47422","47430","47510","47520","47530","47540","47591","47592","47593","47594","47595","47596","47599","47610","47620","47630","47640","47650","47710","47720","47730","47740","47750","47760","47770","47781","47782","47789","47791","47799","47810","47820","47890","47910","47990"], description: "Retail shops and stores" },
  property: { label: "Property Companies", sicCodes: ["41100","68100","68201","68202","68209","68310","68320"], description: "Property development and investment" },
  professional: { label: "Professional Services", sicCodes: ["69101","69102","69201","69202","69203","70100","70221","70229","71111","71112","71120","71121","71122","73110","73120","73200","74100","74201","74202","74203","74204","74209","74300","74901","74902","74909"], description: "Accountants, architects, consultants" },
  businessloan: { label: "All SMEs - Business Loans", sicCodes: [], description: "Any SME in England and Wales" },
};

const LOGIN_PASSWORD = "GRLeads2026";

const EMAIL_SIG = `Kind regards,

The Team at GR Commercial Finance
Specialist Commercial Finance Brokers - England and Wales
Web: grcommercialfinance.co.uk
Email: enquiries@grcommercialfinance.co.uk
Mobile: 07510 859352
Manchester

GR Commercial Finance is a commercial finance broker, not a lender. All finance is subject to status and valuation.`;

async function apiCall(apiKey, system, user) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, system, messages: [{ role: "user", content: user }] })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error"); }
  const d = await r.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("");
}

async function searchAndFormat(apiKey, searchQuery, formatPrompt) {
  const searchR = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, tools: [{ type: "web_search_20250305", name: "web_search" }], messages: [{ role: "user", content: `Search for: ${searchQuery}. Find real companies and contacts in England and Wales. Return a detailed summary including company names, locations, contact details and why they might need finance.` }] })
  });
  if (!searchR.ok) { const e = await searchR.json(); throw new Error(e.error?.message || "Search error"); }
  const searchD = await searchR.json();
  const searchResults = searchD.content.filter(b => b.type === "text").map(b => b.text).join("");
  const jsonText = await apiCall(apiKey, `You are a JSON formatter. Output ONLY a valid JSON object. Never include markdown, backticks, or any text outside the JSON. Always start with { and end with }.`, `${formatPrompt}\n\nSearch results:\n${searchResults}\n\nRespond with ONLY the JSON object. No other text.`);
  const trimmed = jsonText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function searchCompaniesHouse(chApiKey, query, sicCodes, location, maxResults) {
  const params = new URLSearchParams({ q: query || "limited", items_per_page: Math.min(maxResults, 100), restrictions: "active-companies" });
  if (location) params.append("location", location);
  const r = await fetch(`https://api.company-information.service.gov.uk/advanced-search/companies?${params}`, { headers: { Authorization: "Basic " + btoa(chApiKey + ":") } });
  if (!r.ok) throw new Error("Companies House API error: " + r.status);
  const d = await r.json();
  let companies = d.items || [];
  if (sicCodes && sicCodes.length > 0) {
    companies = companies.filter(c => c.sic_codes && c.sic_codes.some(s => sicCodes.includes(s)));
  }
  return companies.map(c => ({
    companyName: c.company_name,
    companyNumber: c.company_number,
    location: [c.registered_office_address?.locality, c.registered_office_address?.region, c.registered_office_address?.country].filter(Boolean).join(", "),
    postcode: c.registered_office_address?.postal_code,
    incorporatedOn: c.date_of_creation,
    sicCodes: c.sic_codes || [],
  }));
}

async function enrichWithEmail(apiKey, company, financeProduct) {
  const jsonText = await apiCall(apiKey,
    `You are a JSON formatter. Output ONLY a valid JSON object. Never include markdown or backticks.`,
    `For this UK company, construct the most likely email and write a short outreach email from GR Commercial Finance about ${financeProduct}.
Company: ${company.companyName}, Location: ${company.location}, Incorporated: ${company.incorporatedOn}
Return ONLY this JSON:
{"emailAddress":"info@domain.co.uk","emailConfidence":"Guessed","emailSource":"Constructed from company name","contactName":null,"signal":"one sentence why they need ${financeProduct}","estimatedDeal":"GBP 50,000-250,000","urgency":"Medium","qualificationScore":70,"contactHint":"Find directors at company-information.service.gov.uk/company/${company.companyNumber}","emailSubject":"short subject about ${financeProduct}","emailBody":"Dear Team,\\n\\n2-3 sentences about ${financeProduct} from GR Commercial Finance.\\n\\n${EMAIL_SIG}"}`
  );
  const trimmed = jsonText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { return {}; }
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [mode, setMode] = useState("direct");
  const [activeProduct, setActiveProduct] = useState("bridging");
  const [activePartner, setActivePartner] = useState("accountants");
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [chApiKey, setChApiKey] = useState("");
  const [copied, setCopied] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [chProfile, setChProfile] = useState("construction");
  const [chLocation, setChLocation] = useState("");
  const [chQuery, setChQuery] = useState("");
  const [chResults, setChResults] = useState(20);
  const [chLeads, setChLeads] = useState([]);
  const [chSearching, setChSearching] = useState(false);
  const [chProgress, setChProgress] = useState("");
  const [chError, setChError] = useState("");
  const [chExpanded, setChExpanded] = useState(null);
  const [chCopied, setChCopied] = useState(null);

  const handleLogin = () => {
    if (pw === LOGIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) { setError("Please enter your Anthropic API key."); return; }
    setError(""); setIsSearching(true); setLeads([]); setSummary(""); setExpanded(null);
    try {
      if (mode === "direct") {
        const p = DIRECT_PRODUCTS[activeProduct];
        const result = await searchAndFormat(apiKey, p.searchQuery, `Based on the search results, create a JSON object with leads for GR Commercial Finance.\nReturn: {"leads":[{"companyName":"string","contactName":"string or null","location":"string","emailAddress":"string or null","emailConfidence":"Verified or Likely or Guessed","signal":"string","estimatedDeal":"string","urgency":"High or Medium or Low","qualificationScore":75,"contactHint":"string","emailSubject":"string","emailBody":"string ending with ${EMAIL_SIG}"}],"searchSummary":"string"}\nInclude 3 to 5 real leads.`);
        setLeads(result.leads || []); setSummary(result.searchSummary || "");
      } else {
        const p = REFERRAL_PARTNERS[activePartner];
        const result = await searchAndFormat(apiKey, p.searchQuery, `Based on the search results, create a JSON object with referral partners for GR Commercial Finance.\nReturn: {"partners":[{"companyName":"string","contactName":"string or null","location":"string","emailAddress":"string or null","emailConfidence":"Verified or Likely or Guessed","clientProfile":"string","referralOpportunity":"string","partnerScore":75,"contactHint":"string","emailSubject":"string","emailBody":"string ending with ${EMAIL_SIG}"}],"searchSummary":"string"}\nInclude 3 to 5 real partners.`);
        setLeads(result.partners || []); setSummary(result.searchSummary || "");
      }
    } catch (e) { setError("Search failed: " + e.message); }
    finally { setIsSearching(false); }
  };

  const handleCHSearch = async () => {
    if (!chApiKey.trim()) { setChError("Please enter your Companies House API key."); return; }
    if (!apiKey.trim()) { setChError("Please enter your Anthropic API key too."); return; }
    setChError(""); setChSearching(true); setChLeads([]); setChExpanded(null);
    try {
      const profile = CH_PROFILES[chProfile];
      const query = chQuery.trim() || profile.label;
      setChProgress(`Searching Companies House for ${profile.label}...`);
      const companies = await searchCompaniesHouse(chApiKey, query, profile.sicCodes, chLocation, chResults);
      if (companies.length === 0) { setChError("No companies found. Try a different search or location."); setChSearching(false); return; }
      setChProgress(`Found ${companies.length} companies. Generating AI outreach emails...`);
      const toEnrich = companies.slice(0, 20);
      const enriched = [];
      for (let i = 0; i < toEnrich.length; i++) {
        setChProgress(`Writing outreach email ${i + 1} of ${toEnrich.length}...`);
        const extra = await enrichWithEmail(apiKey, toEnrich[i], profile.label);
        enriched.push({ ...toEnrich[i], ...extra });
        if (i < toEnrich.length - 1) await new Promise(r => setTimeout(r, 300));
      }
      const remaining = companies.slice(20).map(c => ({ ...c, emailAddress: `info@${c.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.co.uk`, emailConfidence: "Guessed", emailSource: "Constructed", signal: `${profile.description} company`, estimatedDeal: "GBP 50,000-250,000", urgency: "Medium", qualificationScore: 65, contactHint: `Find directors at company-information.service.gov.uk/company/${c.companyNumber}`, emailSubject: `Finance options for ${c.companyName}`, emailBody: `Dear Team,\n\nWe are GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We help ${profile.description.toLowerCase()} access competitive finance.\n\nIf you need funding to grow, we would love to help.\n\n${EMAIL_SIG}` }));
      setChLeads([...enriched, ...remaining]);
      setChProgress(`Done - ${enriched.length + remaining.length} leads generated`);
    } catch (e) { setChError("Search failed: " + e.message); }
    finally { setChSearching(false); }
  };

  const exportCSV = (leadsData, isReferral) => {
    if (!leadsData.length) return;
    const headers = isReferral ? ["Company","Contact","Location","Email","Confidence","Profile","Opportunity","Score","Approach","Subject","Email Body"] : ["Company","Contact","Location","Email","Confidence","Signal","Est Deal","Urgency","Score","Approach","Subject","Email Body"];
    const rows = leadsData.map(l => isReferral ? [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.clientProfile,l.referralOpportunity,l.partnerScore,l.contactHint,l.emailSubject,l.emailBody?.replace(/\n/g," ")] : [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.signal,l.estimatedDeal,l.urgency,l.qualificationScore||l.partnerScore,l.contactHint,l.emailSubject,l.emailBody?.replace(/\n/g," ")]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = `gr-leads-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const copyEmail = (e, i, lead, setCopiedFn) => { e.stopPropagation(); navigator.clipboard.writeText(`To: ${lead.emailAddress||""}\nSubject: ${lead.emailSubject}\n\n${lead.emailBody}`); setCopiedFn(i); setTimeout(()=>setCopiedFn(null),2000); };

  const urgBg = u => ({High:"#7f1d1d",Medium:"#78350f",Low:"#1f2937"}[u]||"#1f2937");
  const urgFg = u => ({High:"#fca5a5",Medium:"#fcd34d",Low:"#9ca3af"}[u]||"#9ca3af");
  const scoreCol = s => s>=80?"#4ade80":s>=65?"#fbbf24":"#f87171";
  const confBg = c => ({Verified:"#14532d",Likely:"#78350f",Guessed:"#1e1e2a"}[c]||"#1e1e2a");
  const confFg = c => ({Verified:"#86efac",Likely:"#fcd34d",Guessed:"#9ca3af"}[c]||"#9ca3af");
  const curProduct = mode === "direct" ? DIRECT_PRODUCTS[activeProduct] : REFERRAL_PARTNERS[activePartner];

  const LeadCard = ({ lead, i, expandedState, setExpandedState, copiedState, setCopiedState, isReferral }) => {
    const score = lead.qualificationScore || lead.partnerScore;
    return (
      <div onClick={()=>setExpandedState(expandedState===i?null:i)} style={{background:"#0f0f16",border:`1px solid ${expandedState===i?"#c8952a44":"#1c1c28"}`,borderRadius:8,overflow:"hidden",cursor:"pointer",marginBottom:8}}>
        <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.companyName}</span>
              {lead.contactName&&<span style={{fontSize:11,color:"#4b5563"}}>{lead.contactName}</span>}
              {lead.urgency&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency)}}>{lead.urgency}</span>}
              {lead.companyNumber&&<span style={{fontSize:10,color:"#374151"}}>#{lead.companyNumber}</span>}
            </div>
            <div style={{fontSize:11,color:"#374151",marginBottom:5}}>{lead.location}{lead.postcode?` ${lead.postcode}`:""}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              {lead.emailAddress?<><span style={{fontSize:11,color:"#c8952a",fontFamily:"monospace",background:"#c8952a11",padding:"2px 8px",borderRadius:3}}>{lead.emailAddress}</span>{lead.emailConfidence&&<span style={{fontSize:10,padding:"2px 5px",borderRadius:3,background:confBg(lead.emailConfidence),color:confFg(lead.emailConfidence)}}>{lead.emailConfidence}</span>}</>:<span style={{fontSize:11,color:"#374151"}}>No email found</span>}
            </div>
            <div style={{fontSize:12,color:"#6b7280"}}>{isReferral?lead.referralOpportunity:lead.signal}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            {!isReferral&&lead.estimatedDeal&&<><div style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.estimatedDeal}</div><div style={{fontSize:10,color:"#374151",marginBottom:6}}>est. deal</div></>}
            {score&&<div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${scoreCol(score)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:scoreCol(score),marginLeft:"auto"}}>{score}</div>}
          </div>
        </div>
        {expandedState===i&&(
          <div style={{borderTop:"1px solid #1c1c28",padding:"13px 16px",background:"#09090d"}}>
            {lead.contactHint&&<div style={{marginBottom:12}}><div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>How to Approach</div><div style={{fontSize:12,color:"#6b7280"}}>{lead.contactHint}</div></div>}
            {lead.emailSubject&&<div>
              <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Outreach Email</div>
              <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:6,padding:"10px 13px",marginBottom:8}}>
                {lead.emailAddress&&<div style={{fontSize:11,color:"#374151",marginBottom:4}}>To: <span style={{color:"#c8952a",fontFamily:"monospace"}}>{lead.emailAddress}</span></div>}
                <div style={{fontSize:11,color:"#374151",marginBottom:8}}>Subject: <span style={{color:"#ede8de",fontWeight:500}}>{lead.emailSubject}</span></div>
                <div style={{fontSize:11,color:"#6b7280",lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:"1px solid #1c1c28",paddingTop:8}}>{lead.emailBody}</div>
              </div>
              <button onClick={e=>copyEmail(e,i,lead,setCopiedState)} style={{padding:"5px 14px",borderRadius:4,border:"1px solid #1c1c28",background:copiedState===i?"#14532d":"transparent",color:copiedState===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:11}}>{copiedState===i?"Copied!":"Copy full email"}</button>
            </div>}
          </div>
        )}
      </div>
    );
  };

  if (!authed) return (
    <div style={{fontFamily:"Arial,sans-serif",background:"#09090d",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:12,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:10,background:"linear-gradient(135deg,#c8952a,#8a6018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",margin:"0 auto 20px"}}>GR</div>
        <div style={{fontSize:18,fontWeight:700,color:"#ede8de",marginBottom:4}}>GR Commercial Finance</div>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:28}}>Lead Intelligence System</div>
        <input type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",background:"#09090d",border:`1px solid ${pwError?"#7f1d1d":"#1c1c28"}`,borderRadius:6,padding:"10px 14px",color:"#ddd8ce",fontSize:14,outline:"none",marginBottom:8,textAlign:"center",boxSizing:"border-box"}}/>
        {pwError&&<div style={{color:"#fca5a5",fontSize:12,marginBottom:8}}>Incorrect password</div>}
        <button onClick={handleLogin} style={{width:"100%",padding:"10px",borderRadius:6,border:"none",background:"#c8952a",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Log In</button>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"Arial,sans-serif",background:"#09090d",minHeight:"100vh",color:"#ddd8ce"}}>
      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:7,background:"linear-gradient(135deg,#c8952a,#8a6018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>GR</div>
          <div><div style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>GR Commercial Finance</div><div style={{fontSize:10,color:"#374151"}}>Lead Intelligence - grcommercialfinance.co.uk</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1}}>Anthropic</span>
            <input type="password" placeholder="sk-ant-api..." value={apiKey} onChange={e=>setApiKey(e.target.value)} style={{width:150,background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"6px 10px",color:"#ddd8ce",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1}}>CH Key</span>
            <input type="password" placeholder="Companies House key..." value={chApiKey} onChange={e=>setChApiKey(e.target.value)} style={{width:150,background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"6px 10px",color:"#ddd8ce",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
          </div>
        </div>
      </div>

      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex"}}>
        <button onClick={()=>{setMode("direct");setLeads([]);setSummary("");setError("");}} style={{padding:"12px 18px",border:"none",borderBottom:mode==="direct"?"2px solid #c8952a":"2px solid transparent",background:"transparent",color:mode==="direct"?"#c8952a":"#4b5563",cursor:"pointer",fontSize:12,fontWeight:700}}>Direct Leads</button>
        <button onClick={()=>{setMode("referral");setLeads([]);setSummary("");setError("");}} style={{padding:"12px 18px",border:"none",borderBottom:mode==="referral"?"2px solid #2ac87a":"2px solid transparent",background:"transparent",color:mode==="referral"?"#2ac87a":"#4b5563",cursor:"pointer",fontSize:12,fontWeight:700}}>Referral Partners</button>
        <button onClick={()=>setMode("companies")} style={{padding:"12px 18px",border:"none",borderBottom:mode==="companies"?"2px solid #f59e0b":"2px solid transparent",background:"transparent",color:mode==="companies"?"#f59e0b":"#4b5563",cursor:"pointer",fontSize:12,fontWeight:700}}>Companies House</button>
      </div>

      {mode==="companies"&&(
        <div style={{maxWidth:1040,margin:"0 auto",padding:"20px 24px"}}>
          <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:8,padding:"20px",marginBottom:20}}>
            <div style={{fontSize:14,color:"#f59e0b",fontWeight:700,marginBottom:4}}>Companies House Bulk Search</div>
            <div style={{fontSize:11,color:"#374151",marginBottom:16}}>Search 5 million registered UK companies - free data from Companies House</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Industry</label>
                <select value={chProfile} onChange={e=>setChProfile(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none"}}>
                  {Object.entries(CH_PROFILES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Location (optional)</label>
                <input placeholder="e.g. Manchester, Bristol, Cardiff..." value={chLocation} onChange={e=>setChLocation(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Custom keyword (optional)</label>
                <input placeholder="e.g. pizza restaurant, building contractor..." value={chQuery} onChange={e=>setChQuery(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Max results</label>
                <select value={chResults} onChange={e=>setChResults(Number(e.target.value))} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none"}}>
                  <option value={20}>20 companies (all with AI emails)</option>
                  <option value={50}>50 companies</option>
                  <option value={100}>100 companies</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={handleCHSearch} disabled={chSearching} style={{padding:"9px 24px",borderRadius:5,border:"none",background:chSearching?"#1c1c28":"#f59e0b",color:chSearching?"#4b5563":"#000",cursor:chSearching?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
                {chSearching?"Searching...":"Search Companies House"}
              </button>
              {chLeads.length>0&&<>
                <button onClick={()=>setViewMode(v=>v==="cards"?"table":"cards")} style={{padding:"8px 14px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:11}}>{viewMode==="cards"?"Table":"Cards"}</button>
                <button onClick={()=>exportCSV(chLeads,false)} style={{padding:"8px 14px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:12}}>Export CSV</button>
                <span style={{fontSize:11,color:"#6b7280"}}>{chLeads.length} companies</span>
              </>}
            </div>
          </div>
          {chError&&<div style={{background:"#1a0808",border:"1px solid #7f1d1d",borderRadius:6,padding:"9px 14px",marginBottom:12,color:"#fca5a5",fontSize:12}}>{chError}</div>}
          {chSearching&&chProgress&&<div style={{background:"#0a0f1a",border:"1px solid #1c3a5a",borderRadius:6,padding:"9px 14px",marginBottom:14,fontSize:12,color:"#60a5fa"}}>{chProgress}</div>}
          {viewMode==="table"&&chLeads.length>0&&(
            <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #1c1c28",marginBottom:16}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28"}}>
                  {["Company","Number","Location","Email","Conf","Signal","Est Deal","Score",""].map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",color:"#374151",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>{chLeads.map((lead,i)=>(<tr key={i} style={{borderBottom:"1px solid #1c1c28",background:i%2===0?"#09090d":"#0c0c12"}}>
                  <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:600}}>{lead.companyName}</td>
                  <td style={{padding:"8px 10px",color:"#374151",fontFamily:"monospace"}}>{lead.companyNumber}</td>
                  <td style={{padding:"8px 10px",color:"#4b5563"}}>{lead.location}</td>
                  <td style={{padding:"8px 10px"}}>{lead.emailAddress?<span style={{color:"#c8952a",fontFamily:"monospace",fontSize:10}}>{lead.emailAddress}</span>:<span style={{color:"#1f2937"}}>-</span>}</td>
                  <td style={{padding:"8px 10px"}}>{lead.emailConfidence&&<span style={{padding:"2px 6px",borderRadius:3,background:confBg(lead.emailConfidence),color:confFg(lead.emailConfidence),fontSize:10}}>{lead.emailConfidence}</span>}</td>
                  <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{lead.signal}</td>
                  <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:700}}>{lead.estimatedDeal}</td>
                  <td style={{padding:"8px 10px"}}>{lead.qualificationScore&&<span style={{color:scoreCol(lead.qualificationScore),fontWeight:700}}>{lead.qualificationScore}</span>}</td>
                  <td style={{padding:"8px 10px"}}><button onClick={e=>copyEmail(e,i,lead,setChCopied)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:chCopied===i?"#14532d":"transparent",color:chCopied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{chCopied===i?"Copied":"Copy"}</button></td>
                </tr>))}</tbody>
              </table>
            </div>
          )}
          {viewMode==="cards"&&chLeads.length>0&&chLeads.map((lead,i)=>(
            <LeadCard key={i} lead={lead} i={i} expandedState={chExpanded} setExpandedState={setChExpanded} copiedState={chCopied} setCopiedState={setChCopied} isReferral={false}/>
          ))}
          {!chSearching&&chLeads.length===0&&!chError&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:14,color:"#374151",marginBottom:6}}>Search Companies House for bulk leads</div>
              <div style={{fontSize:12,color:"#1f2937"}}>Select an industry, optional location, and click Search. First 20 get personalised AI emails.</div>
            </div>
          )}
        </div>
      )}

      {mode!=="companies"&&(
        <>
          <div style={{background:"#0c0c12",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex",overflowX:"auto"}}>
            {(mode==="direct"?Object.entries(DIRECT_PRODUCTS):Object.entries(REFERRAL_PARTNERS)).map(([key,cfg])=>(
              <button key={key} onClick={()=>{mode==="direct"?setActiveProduct(key):setActivePartner(key);setLeads([]);setSummary("");setError("");}} style={{padding:"9px 14px",border:"none",borderBottom:(mode==="direct"?activeProduct:activePartner)===key?`2px solid ${cfg.color}`:"2px solid transparent",background:"transparent",color:(mode==="direct"?activeProduct:activePartner)===key?cfg.color:"#374151",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div style={{maxWidth:1040,margin:"0 auto",padding:"20px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:13,color:curProduct.color,fontWeight:600,marginBottom:2}}>{curProduct.label}</div>
                <div style={{fontSize:11,color:"#374151"}}>{curProduct.description}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {leads.length>0&&<>
                  <button onClick={()=>setViewMode(v=>v==="cards"?"table":"cards")} style={{padding:"7px 12px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:11}}>{viewMode==="cards"?"Table":"Cards"}</button>
                  <button onClick={()=>exportCSV(leads,mode==="referral")} style={{padding:"7px 14px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:12}}>Export CSV</button>
                </>}
                <button onClick={handleSearch} disabled={isSearching} style={{padding:"8px 22px",borderRadius:5,border:"none",background:isSearching?"#1c1c28":mode==="direct"?"#c8952a":"#2ac87a",color:isSearching?"#4b5563":"#fff",cursor:isSearching?"not-allowed":"pointer",fontSize:13,fontWeight:700,minWidth:140}}>
                  {isSearching?"Searching...":mode==="direct"?"Hunt Leads":"Find Partners"}
                </button>
              </div>
            </div>
            {error&&<div style={{background:"#1a0808",border:"1px solid #7f1d1d",borderRadius:6,padding:"9px 14px",marginBottom:12,color:"#fca5a5",fontSize:12}}>{error}</div>}
            {summary&&<div style={{background:"#0a120a",border:"1px solid #14532d44",borderRadius:6,padding:"9px 14px",marginBottom:14,fontSize:12,color:"#86efac"}}>{summary}</div>}
            {viewMode==="table"&&leads.length>0&&(
              <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #1c1c28"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28"}}>
                    {(mode==="direct"?["Company","Contact","Location","Email","Conf","Signal","Deal","Urgency","Score",""] : ["Firm","Contact","Location","Email","Conf","Profile","Opportunity","Score",""]).map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",color:"#374151",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{leads.map((lead,i)=>{
                    const score=lead.qualificationScore||lead.partnerScore;
                    return(<tr key={i} style={{borderBottom:"1px solid #1c1c28",background:i%2===0?"#09090d":"#0c0c12"}}>
                      <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:600}}>{lead.companyName}</td>
                      <td style={{padding:"8px 10px",color:"#6b7280"}}>{lead.contactName||"-"}</td>
                      <td style={{padding:"8px 10px",color:"#4b5563"}}>{lead.location}</td>
                      <td style={{padding:"8px 10px"}}>{lead.emailAddress?<span style={{color:"#c8952a",fontFamily:"monospace",fontSize:10}}>{lead.emailAddress}</span>:<span style={{color:"#1f2937"}}>-</span>}</td>
                      <td style={{padding:"8px 10px"}}>{lead.emailConfidence&&<span style={{padding:"2px 6px",borderRadius:3,background:confBg(lead.emailConfidence),color:confFg(lead.emailConfidence),fontSize:10}}>{lead.emailConfidence}</span>}</td>
                      {mode==="direct"?<>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{lead.signal}</td>
                        <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:700,whiteSpace:"nowrap"}}>{lead.estimatedDeal}</td>
                        <td style={{padding:"8px 10px"}}><span style={{padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency),fontSize:10}}>{lead.urgency}</span></td>
                      </>:<>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{lead.clientProfile}</td>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{lead.referralOpportunity}</td>
                      </>}
                      <td style={{padding:"8px 10px"}}><span style={{color:scoreCol(score),fontWeight:700}}>{score}</span></td>
                      <td style={{padding:"8px 10px"}}><button onClick={e=>copyEmail(e,i,lead,setCopied)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{copied===i?"Copied":"Copy"}</button></td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            )}
            {viewMode==="cards"&&leads.length>0&&leads.map((lead,i)=>(
              <LeadCard key={i} lead={lead} i={i} expandedState={expanded} setExpandedState={setExpanded} copiedState={copied} setCopiedState={setCopied} isReferral={mode==="referral"}/>
            ))}
            {!isSearching&&leads.length===0&&!error&&(
              <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{fontSize:14,color:"#374151",marginBottom:6}}>{mode==="direct"?"Ready to hunt direct leads":"Ready to find referral partners"}</div>
                <div style={{fontSize:12,color:"#1f2937"}}>Enter your API key - select a product - click {mode==="direct"?"Hunt Leads":"Find Partners"}</div>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{padding:"14px 24px",borderTop:"1px solid #1c1c28",display:"flex",justifyContent:"space-between",fontSize:10,color:"#1f2937",flexWrap:"wrap",gap:8}}>
        <span>GR Commercial Finance - enquiries@grcommercialfinance.co.uk - 07510 859352 - Manchester</span>
        <span>Public data only - Comply with UK GDPR and FCA rules before outreach</span>
      </div>
    </div>
  );
}
