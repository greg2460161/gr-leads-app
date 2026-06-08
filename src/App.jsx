import { useState } from "react";

const DIRECT_PRODUCTS = {
  bridging: { label: "Bridging Finance", color: "#c8952a", description: "Auction buyers, chain breaks, urgent property purchases", searchQuery: "property auction upcoming lots England Wales 2026 bridging finance" },
  development: { label: "Development Finance", color: "#2a7fc8", description: "Planning permissions granted, new build and conversion projects", searchQuery: "planning permission granted residential development England Wales 2026" },
  refurbishment: { label: "Refurbishment Loans", color: "#9b5cf6", description: "Heavy refurb, HMO conversions, property upgrades", searchQuery: "HMO conversion refurbishment property investor England Wales 2026" },
  businessloan: { label: "Business Loans", color: "#2ac87a", description: "SMEs in England and Wales seeking growth capital", searchQuery: "SME business expansion funding England Wales 2026" },
  mca: { label: "Merchant Cash Advance", color: "#ef4444", description: "Retail, hospitality and card-taking SMEs needing fast cash", searchQuery: "new restaurant retail shop business opening England Wales 2026" },
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
  construction: { label: "Construction Companies", sicCodes: ["41100","41201","41202","42110","42120","43110","43120","43130","43210","43220","43290","43310","43320","43330","43390","43910","43999"], description: "Construction and building firms" },
  restaurants: { label: "Restaurants and Hospitality", sicCodes: ["56101","56102","56103","56210","56290","56301","56302"], description: "Restaurants, cafes, bars and hospitality" },
  retail: { label: "Retail Businesses", sicCodes: ["47110","47190","47210","47220","47230","47240","47250","47260","47270","47280","47290","47300","47410","47510","47520","47530","47610","47620","47630","47640","47650","47710","47720","47730","47740","47750","47760","47770","47910","47990"], description: "Retail shops and stores" },
  property: { label: "Property Companies", sicCodes: ["41100","68100","68201","68202","68209","68310","68320"], description: "Property development and investment" },
  professional: { label: "Professional Services", sicCodes: ["69101","69102","69201","69202","69203","70100","70221","70229","71111","71112","71120","73110","73120","73200","74100","74201","74209","74300"], description: "Accountants, architects, consultants" },
  all: { label: "All SMEs", sicCodes: [], description: "Any SME in England and Wales" },
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

async function callClaude(apiKey, messages, useWebSearch, systemPrompt) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error " + r.status); }
  const d = await r.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("");
}

function parseLeadsFromText(text, isReferral, productLabel) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const leads = [];
  let current = null;

  for (const line of lines) {
    const companyMatch = line.match(/^(?:\d+[\.\)]\s*)?(?:\*\*)?([A-Z][^*\n]{2,60})(?:\*\*)?(?:\s*[-–]|$)/);
    const emailMatch = line.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const locationMatch = line.match(/(?:Location|Based|Located)[:\s]+([^,\n]{3,40}(?:,\s*[^,\n]{2,30})?)/i);
    const dealMatch = line.match(/[£$][\d,]+(?:k|K|m|M)?(?:\s*[-–]\s*[£$][\d,]+(?:k|K|m|M)?)?/);

    if (companyMatch && line.length < 80 && !line.startsWith("-") && !line.startsWith("•")) {
      if (current && current.companyName) leads.push(current);
      current = {
        companyName: companyMatch[1].trim(),
        contactName: null,
        location: "",
        emailAddress: null,
        emailConfidence: null,
        signal: "",
        estimatedDeal: "",
        urgency: "Medium",
        qualificationScore: 72,
        clientProfile: "",
        referralOpportunity: "",
        partnerScore: 72,
        contactHint: "",
        emailSubject: "",
        emailBodyCore: "",
        rawLines: [],
      };
    }

    if (current) {
      current.rawLines.push(line);
      if (emailMatch && !current.emailAddress) {
        current.emailAddress = emailMatch[0];
        current.emailConfidence = "Verified";
      }
      if (locationMatch && !current.location) current.location = locationMatch[1].trim();
      if (dealMatch && !current.estimatedDeal) current.estimatedDeal = dealMatch[0];
      if (line.toLowerCase().includes("high urgency") || line.toLowerCase().includes("urgent")) current.urgency = "High";
      if (line.toLowerCase().includes("low urgency")) current.urgency = "Low";
    }
  }
  if (current && current.companyName) leads.push(current);

  return leads.slice(0, 6).map(lead => {
    const context = lead.rawLines.slice(1, 5).join(" ").slice(0, 200);
    const signal = context || (isReferral ? "Potential referral partner for " + productLabel : "Potential client for " + productLabel);
    const emailBody = isReferral
      ? "I am reaching out from GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We work with " + lead.companyName + " type firms on a referral basis - when your clients need bridging, development finance, business loans or merchant cash advances, we handle everything and pay you a referral fee. We would love to explore a partnership."
      : "I am reaching out from GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We noticed " + lead.companyName + " may benefit from our " + productLabel + " solutions. We offer fast approvals and competitive rates tailored to businesses like yours. We would welcome the opportunity to discuss your requirements.";
    return {
      companyName: lead.companyName,
      contactName: lead.contactName,
      location: lead.location || "England / Wales",
      emailAddress: lead.emailAddress,
      emailConfidence: lead.emailConfidence,
      signal: signal.replace(/\n/g, " ").slice(0, 150),
      estimatedDeal: lead.estimatedDeal || "GBP 100,000-500,000",
      urgency: lead.urgency,
      qualificationScore: lead.qualificationScore,
      clientProfile: signal.slice(0, 100),
      referralOpportunity: signal.slice(0, 150),
      partnerScore: lead.partnerScore,
      contactHint: lead.emailAddress ? "Email found - reach out directly" : "Search company website or LinkedIn for contact details",
      emailSubject: isReferral ? "Referral partnership opportunity - GR Commercial Finance" : productLabel + " - GR Commercial Finance",
      emailBodyCore: emailBody,
    };
  });
}

async function getLeads(apiKey, searchQuery, productLabel, isReferral) {
  const prompt = isReferral
    ? `Search for real ${productLabel} firms in England and Wales that could become referral partners for GR Commercial Finance, a commercial finance broker. 

For each firm find:
1. Company name and location
2. Director or key contact name (search Companies House or LinkedIn)
3. Email address - check their website contact page, about page, team page. Also try searching "site:companyname.co.uk email" or "companyname director email"
4. Why they would be a good referral partner

List 4-6 real firms. For each one, explicitly state the email address if found.`
    : `Search for real companies in England and Wales who need ${productLabel} right now. Search: ${searchQuery}

For each prospect find:
1. Company or contact name and location  
2. Email address - search their website, contact page, team page, or try "companyname contact email" or "director name email companyname"
3. Why they need ${productLabel}

List 4-6 real prospects. For each one, explicitly state the email address if found publicly. Also search for the key decision maker name.`;

  const text = await callClaude(apiKey, [{ role: "user", content: prompt }], true, "You are a helpful research assistant. Search the web thoroughly. For each company, make a specific effort to find email addresses from their website contact pages, about pages, or public directories. Present each company on its own line starting with the company name.");
  const leads = parseLeadsFromText(text, isReferral, productLabel);
  return { leads, summary: text.slice(0, 200).replace(/\n/g, " ") };
}

async function searchCompaniesHouse(chApiKey, query, sicCodes, location, maxResults) {
  const params = new URLSearchParams({ q: query || "limited", items_per_page: String(Math.min(maxResults, 100)), restrictions: "active-companies" });
  if (location) params.append("location", location);
  const apiUrl = "https://api.company-information.service.gov.uk/advanced-search/companies?" + params.toString();
  let d = null;
  const proxies = [
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(apiUrl),
    "https://corsproxy.io/?" + encodeURIComponent(apiUrl),
    "https://proxy.cors.sh/" + apiUrl,
  ];
  let lastError = "";
  for (const proxyUrl of proxies) {
    try {
      const r = await fetch(proxyUrl, { headers: { Authorization: "Basic " + btoa(chApiKey + ":"), "x-cors-api-key": "temp_" + Math.random() } });
      if (r.ok) { d = await r.json(); break; }
      lastError = "Status " + r.status;
    } catch (err) { lastError = err.message; }
  }
  if (!d) throw new Error("Companies House search failed: " + lastError + ". Please check your CH API key.");
  let companies = d.items || [];
  if (sicCodes && sicCodes.length > 0) companies = companies.filter(c => c.sic_codes && c.sic_codes.some(s => sicCodes.includes(s)));
  return companies.map(c => ({
    companyName: c.company_name || "",
    companyNumber: c.company_number || "",
    location: [c.registered_office_address?.locality, c.registered_office_address?.region].filter(Boolean).join(", "),
    postcode: c.registered_office_address?.postal_code || "",
    incorporatedOn: c.date_of_creation || "",
    sicCodes: c.sic_codes || [],
  }));
}

async function enrichCompany(apiKey, company, profileLabel) {
  const prompt = `For this UK company, provide:
1. Most likely email address (format: name@domain.co.uk)
2. One sentence why they might need commercial finance
3. A brief 2-sentence outreach message from GR Commercial Finance

Company: ${company.companyName}
Location: ${company.location}
Type: ${profileLabel}

Reply in this exact format (one item per line):
EMAIL: info@example.co.uk
REASON: They are a growing construction company likely needing working capital.
OUTREACH: We are GR Commercial Finance, specialist brokers covering England and Wales. We help ${profileLabel.toLowerCase()} access competitive business finance and would love to support ${company.companyName}.`;

  try {
    const text = await callClaude(apiKey, [{ role: "user", content: prompt }], false, "You are a helpful assistant. Reply only in the exact format requested.");
    const emailMatch = text.match(/EMAIL:\s*([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/i);
    const reasonMatch = text.match(/REASON:\s*(.+)/i);
    const outreachMatch = text.match(/OUTREACH:\s*(.+)/i);
    return {
      emailAddress: emailMatch ? emailMatch[1] : "info@" + company.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".co.uk",
      emailConfidence: emailMatch ? "Likely" : "Guessed",
      signal: reasonMatch ? reasonMatch[1].trim() : profileLabel + " company seeking finance",
      estimatedDeal: "GBP 50,000-250,000",
      urgency: "Medium",
      qualificationScore: 68,
      contactHint: "Find directors at company-information.service.gov.uk/company/" + company.companyNumber,
      emailSubject: "Business finance options for " + company.companyName,
      emailBodyCore: outreachMatch ? outreachMatch[1].trim() : "We are GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We help " + profileLabel.toLowerCase() + " access competitive finance solutions.",
    };
  } catch {
    return {
      emailAddress: "info@" + company.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".co.uk",
      emailConfidence: "Guessed",
      signal: profileLabel + " company seeking finance",
      estimatedDeal: "GBP 50,000-250,000",
      urgency: "Medium",
      qualificationScore: 65,
      contactHint: "Find directors at company-information.service.gov.uk/company/" + company.companyNumber,
      emailSubject: "Business finance options for " + company.companyName,
      emailBodyCore: "We are GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We help " + profileLabel.toLowerCase() + " access competitive finance solutions.",
    };
  }
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
    if (pw === LOGIN_PASSWORD) { setAuthed(true); setPwError(false); } else setPwError(true);
  };

  const handleSearch = async () => {
    if (!apiKey.trim()) { setError("Please enter your Anthropic API key."); return; }
    setError(""); setIsSearching(true); setLeads([]); setSummary(""); setExpanded(null);
    try {
      const isReferral = mode === "referral";
      const prod = isReferral ? REFERRAL_PARTNERS[activePartner] : DIRECT_PRODUCTS[activeProduct];
      const result = await getLeads(apiKey, prod.searchQuery, prod.label, isReferral);
      setLeads(result.leads);
      setSummary(result.summary);
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
      setChProgress("Searching Companies House...");
      const companies = await searchCompaniesHouse(chApiKey, query, profile.sicCodes, chLocation, chResults);
      if (companies.length === 0) { setChError("No companies found. Try different search terms or location."); setChSearching(false); return; }
      setChProgress("Found " + companies.length + " companies. Writing outreach emails...");
      const toEnrich = companies.slice(0, 20);
      const enriched = [];
      for (let i = 0; i < toEnrich.length; i++) {
        setChProgress("Email " + (i + 1) + " of " + toEnrich.length + "...");
        const extra = await enrichCompany(apiKey, toEnrich[i], profile.label);
        enriched.push({ ...toEnrich[i], ...extra });
        if (i < toEnrich.length - 1) await new Promise(res => setTimeout(res, 200));
      }
      const remaining = companies.slice(20).map(c => ({
        ...c,
        emailAddress: "info@" + c.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".co.uk",
        emailConfidence: "Guessed",
        signal: profile.description + " company",
        estimatedDeal: "GBP 50,000-250,000",
        urgency: "Medium",
        qualificationScore: 60,
        contactHint: "Find directors at company-information.service.gov.uk/company/" + c.companyNumber,
        emailSubject: "Business finance for " + c.companyName,
        emailBodyCore: "We are GR Commercial Finance, specialist commercial finance brokers covering England and Wales. We help " + profile.description.toLowerCase() + " access competitive finance. We would love to discuss your requirements.",
      }));
      setChLeads([...enriched, ...remaining]);
      setChProgress("Done - " + (enriched.length + remaining.length) + " leads ready");
    } catch (e) { setChError("Search failed: " + e.message); }
    finally { setChSearching(false); }
  };

  const buildEmail = (lead) => (lead.emailBodyCore || "") + "\n\n" + EMAIL_SIG;

  const exportCSV = (data, isReferral) => {
    if (!data.length) return;
    const h = isReferral ? ["Company","Contact","Location","Email","Confidence","Profile","Opportunity","Score","Approach","Subject","Email Body"] : ["Company","Contact","Location","Email","Confidence","Signal","Est Deal","Urgency","Score","Approach","Subject","Email Body"];
    const rows = data.map(l => isReferral
      ? [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.clientProfile,l.referralOpportunity,l.partnerScore,l.contactHint,l.emailSubject,buildEmail(l).replace(/\n/g," ")]
      : [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.signal,l.estimatedDeal,l.urgency,l.qualificationScore,l.contactHint,l.emailSubject,buildEmail(l).replace(/\n/g," ")]
    );
    const csv = [h,...rows].map(r=>r.map(c=>'"'+(c||"").toString().replace(/"/g,'""')+'"').join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download = "gr-leads-"+new Date().toISOString().slice(0,10)+".csv"; a.click();
  };

  const copyFull = (e, lead, i, fn) => { e.stopPropagation(); navigator.clipboard.writeText("To: "+(lead.emailAddress||"")+"\nSubject: "+lead.emailSubject+"\n\n"+buildEmail(lead)); fn(i); setTimeout(()=>fn(null),2000); };

  const openInEmail = (e, lead) => {
    e.stopPropagation();
    const full = "To: " + (lead.emailAddress || "") + "\nSubject: " + (lead.emailSubject || "") + "\n\n" + buildEmail(lead);
    navigator.clipboard.writeText(full);
    window.open("https://mail.zoho.eu/zm/#compose", "_blank");
  };

  const urgBg = u => ({High:"#7f1d1d",Medium:"#78350f",Low:"#1f2937"}[u]||"#1f2937");
  const urgFg = u => ({High:"#fca5a5",Medium:"#fcd34d",Low:"#9ca3af"}[u]||"#9ca3af");
  const scoreCol = s => s>=80?"#4ade80":s>=65?"#fbbf24":"#f87171";
  const confBg = c => ({Verified:"#14532d",Likely:"#78350f",Guessed:"#1e1e2a"}[c]||"#1e1e2a");
  const confFg = c => ({Verified:"#86efac",Likely:"#fcd34d",Guessed:"#9ca3af"}[c]||"#9ca3af");
  const cur = mode==="direct" ? DIRECT_PRODUCTS[activeProduct] : REFERRAL_PARTNERS[activePartner];

  const Card = ({lead,i,exp,setExp,cop,setCop,isRef}) => {
    const score = lead.qualificationScore||lead.partnerScore;
    return (
      <div onClick={()=>setExp(exp===i?null:i)} style={{background:"#0f0f16",border:"1px solid "+(exp===i?"#c8952a44":"#1c1c28"),borderRadius:8,overflow:"hidden",cursor:"pointer",marginBottom:8}}>
        <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.companyName}</span>
              {lead.contactName&&<span style={{fontSize:11,color:"#4b5563"}}>{lead.contactName}</span>}
              {lead.urgency&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency)}}>{lead.urgency}</span>}
              {lead.companyNumber&&<span style={{fontSize:10,color:"#374151"}}>#{lead.companyNumber}</span>}
            </div>
            <div style={{fontSize:11,color:"#374151",marginBottom:5}}>{lead.location}{lead.postcode?" "+lead.postcode:""}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
              {lead.emailAddress?<><span style={{fontSize:11,color:"#c8952a",fontFamily:"monospace",background:"#c8952a11",padding:"2px 8px",borderRadius:3}}>{lead.emailAddress}</span>{lead.emailConfidence&&<span style={{fontSize:10,padding:"2px 5px",borderRadius:3,background:confBg(lead.emailConfidence),color:confFg(lead.emailConfidence)}}>{lead.emailConfidence}</span>}</>:<span style={{fontSize:11,color:"#374151"}}>No email found</span>}
            </div>
            <div style={{fontSize:12,color:"#6b7280"}}>{isRef?lead.referralOpportunity:lead.signal}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            {!isRef&&lead.estimatedDeal&&<><div style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.estimatedDeal}</div><div style={{fontSize:10,color:"#374151",marginBottom:6}}>est. deal</div></>}
            {score&&<div style={{width:32,height:32,borderRadius:"50%",border:"2px solid "+scoreCol(score),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:scoreCol(score),marginLeft:"auto"}}>{score}</div>}
          </div>
        </div>
        {exp===i&&(
          <div style={{borderTop:"1px solid #1c1c28",padding:"13px 16px",background:"#09090d"}}>
            {lead.contactHint&&<div style={{marginBottom:12}}><div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>How to Approach</div><div style={{fontSize:12,color:"#6b7280"}}>{lead.contactHint}</div></div>}
            {lead.emailSubject&&<div>
              <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Outreach Email</div>
              <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:6,padding:"10px 13px",marginBottom:8}}>
                {lead.emailAddress&&<div style={{fontSize:11,color:"#374151",marginBottom:4}}>To: <span style={{color:"#c8952a",fontFamily:"monospace"}}>{lead.emailAddress}</span></div>}
                <div style={{fontSize:11,color:"#374151",marginBottom:8}}>Subject: <span style={{color:"#ede8de",fontWeight:500}}>{lead.emailSubject}</span></div>
                <div style={{fontSize:11,color:"#6b7280",lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:"1px solid #1c1c28",paddingTop:8}}>{buildEmail(lead)}</div>
              </div>
              <button onClick={e=>copyFull(e,lead,i,setCop)} style={{padding:"5px 14px",borderRadius:4,border:"1px solid #1c1c28",background:cop===i?"#14532d":"transparent",color:cop===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:11}}>{cop===i?"Copied!":"Copy full email"}</button>
              <button onClick={e=>openInEmail(e,lead)} style={{padding:"5px 14px",borderRadius:4,border:"none",background:"#c8952a",color:"#fff",cursor:"pointer",fontSize:11,marginLeft:6}}>Open Zoho (then Ctrl+V)</button>
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
        <input type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",background:"#09090d",border:"1px solid "+(pwError?"#7f1d1d":"#1c1c28"),borderRadius:6,padding:"10px 14px",color:"#ddd8ce",fontSize:14,outline:"none",marginBottom:8,textAlign:"center",boxSizing:"border-box"}}/>
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
            <input type="password" placeholder="Companies House..." value={chApiKey} onChange={e=>setChApiKey(e.target.value)} style={{width:150,background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"6px 10px",color:"#ddd8ce",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
          </div>
        </div>
      </div>

      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex"}}>
        {[["direct","Direct Leads","#c8952a"],["referral","Referral Partners","#2ac87a"],["companies","Companies House","#f59e0b"]].map(([m,label,col])=>(
          <button key={m} onClick={()=>{setMode(m);setLeads([]);setSummary("");setError("");}} style={{padding:"12px 18px",border:"none",borderBottom:mode===m?"2px solid "+col:"2px solid transparent",background:"transparent",color:mode===m?col:"#4b5563",cursor:"pointer",fontSize:12,fontWeight:700}}>{label}</button>
        ))}
      </div>

      {mode==="companies"&&(
        <div style={{maxWidth:1040,margin:"0 auto",padding:"20px 24px"}}>
          <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:8,padding:"20px",marginBottom:20}}>
            <div style={{fontSize:14,color:"#f59e0b",fontWeight:700,marginBottom:4}}>Companies House Bulk Search</div>
            <div style={{fontSize:11,color:"#374151",marginBottom:16}}>Search millions of registered UK companies. First 20 results get personalised AI outreach emails.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Industry</label>
                <select value={chProfile} onChange={e=>setChProfile(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none"}}>
                  {Object.entries(CH_PROFILES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Location (optional)</label>
                <input placeholder="e.g. Manchester, Bristol..." value={chLocation} onChange={e=>setChLocation(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Keyword (optional)</label>
                <input placeholder="e.g. pizza restaurant, roofing..." value={chQuery} onChange={e=>setChQuery(e.target.value)} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div><label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Max results</label>
                <select value={chResults} onChange={e=>setChResults(Number(e.target.value))} style={{width:"100%",background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"8px 10px",color:"#ddd8ce",fontSize:12,outline:"none"}}>
                  <option value={20}>20 (all with AI emails)</option>
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
                <tbody>{chLeads.map((l,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #1c1c28",background:i%2===0?"#09090d":"#0c0c12"}}>
                    <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:600}}>{l.companyName}</td>
                    <td style={{padding:"8px 10px",color:"#374151",fontFamily:"monospace"}}>{l.companyNumber}</td>
                    <td style={{padding:"8px 10px",color:"#4b5563"}}>{l.location}</td>
                    <td style={{padding:"8px 10px"}}>{l.emailAddress?<span style={{color:"#c8952a",fontFamily:"monospace",fontSize:10}}>{l.emailAddress}</span>:<span style={{color:"#1f2937"}}>-</span>}</td>
                    <td style={{padding:"8px 10px"}}>{l.emailConfidence&&<span style={{padding:"2px 6px",borderRadius:3,background:confBg(l.emailConfidence),color:confFg(l.emailConfidence),fontSize:10}}>{l.emailConfidence}</span>}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{l.signal}</td>
                    <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:700}}>{l.estimatedDeal}</td>
                    <td style={{padding:"8px 10px"}}>{l.qualificationScore&&<span style={{color:scoreCol(l.qualificationScore),fontWeight:700}}>{l.qualificationScore}</span>}</td>
                    <td style={{padding:"8px 10px"}}><button onClick={e=>copyFull(e,l,i,setChCopied)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:chCopied===i?"#14532d":"transparent",color:chCopied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{chCopied===i?"Copied":"Copy"}</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {viewMode==="cards"&&chLeads.map((l,i)=><Card key={i} lead={l} i={i} exp={chExpanded} setExp={setChExpanded} cop={chCopied} setCop={setChCopied} isRef={false}/>)}
          {!chSearching&&chLeads.length===0&&!chError&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:14,color:"#374151",marginBottom:6}}>Search Companies House for bulk leads</div>
              <div style={{fontSize:12,color:"#1f2937"}}>Select an industry, optional location, and click Search</div>
            </div>
          )}
        </div>
      )}

      {mode!=="companies"&&(
        <>
          <div style={{background:"#0c0c12",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex",overflowX:"auto"}}>
            {(mode==="direct"?Object.entries(DIRECT_PRODUCTS):Object.entries(REFERRAL_PARTNERS)).map(([key,cfg])=>(
              <button key={key} onClick={()=>{mode==="direct"?setActiveProduct(key):setActivePartner(key);setLeads([]);setSummary("");setError("");}} style={{padding:"9px 14px",border:"none",borderBottom:(mode==="direct"?activeProduct:activePartner)===key?"2px solid "+cfg.color:"2px solid transparent",background:"transparent",color:(mode==="direct"?activeProduct:activePartner)===key?cfg.color:"#374151",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div style={{maxWidth:1040,margin:"0 auto",padding:"20px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:12,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:13,color:cur.color,fontWeight:600,marginBottom:2}}>{cur.label}</div>
                <div style={{fontSize:11,color:"#374151"}}>{cur.description}</div>
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
                  <tbody>{leads.map((l,i)=>{
                    const score=l.qualificationScore||l.partnerScore;
                    return(<tr key={i} style={{borderBottom:"1px solid #1c1c28",background:i%2===0?"#09090d":"#0c0c12"}}>
                      <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:600}}>{l.companyName}</td>
                      <td style={{padding:"8px 10px",color:"#6b7280"}}>{l.contactName||"-"}</td>
                      <td style={{padding:"8px 10px",color:"#4b5563"}}>{l.location}</td>
                      <td style={{padding:"8px 10px"}}>{l.emailAddress?<span style={{color:"#c8952a",fontFamily:"monospace",fontSize:10}}>{l.emailAddress}</span>:<span style={{color:"#1f2937"}}>-</span>}</td>
                      <td style={{padding:"8px 10px"}}>{l.emailConfidence&&<span style={{padding:"2px 6px",borderRadius:3,background:confBg(l.emailConfidence),color:confFg(l.emailConfidence),fontSize:10}}>{l.emailConfidence}</span>}</td>
                      {mode==="direct"?<>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{l.signal}</td>
                        <td style={{padding:"8px 10px",color:"#ede8de",fontWeight:700,whiteSpace:"nowrap"}}>{l.estimatedDeal}</td>
                        <td style={{padding:"8px 10px"}}><span style={{padding:"2px 6px",borderRadius:3,background:urgBg(l.urgency),color:urgFg(l.urgency),fontSize:10}}>{l.urgency}</span></td>
                      </>:<>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{l.clientProfile}</td>
                        <td style={{padding:"8px 10px",color:"#6b7280",maxWidth:150}}>{l.referralOpportunity}</td>
                      </>}
                      <td style={{padding:"8px 10px"}}><span style={{color:scoreCol(score),fontWeight:700}}>{score}</span></td>
                      <td style={{padding:"8px 10px"}}><button onClick={e=>copyFull(e,l,i,setCopied)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{copied===i?"Copied":"Copy"}</button></td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            )}
            {viewMode==="cards"&&leads.map((l,i)=><Card key={i} lead={l} i={i} exp={expanded} setExp={setExpanded} cop={copied} setCop={setCopied} isRef={mode==="referral"}/>)}
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
