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
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || "API error"); }
  const d = await r.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("");
}

async function searchAndFormat(apiKey, searchQuery, formatPrompt) {
  // Step 1: Search with web search tool
  const searchR = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: `Search for: ${searchQuery}. Find real companies and contacts in England and Wales. Return a detailed summary of what you found including company names, locations, contact details and why they might need finance.` }]
    })
  });
  if (!searchR.ok) { const e = await searchR.json(); throw new Error(e.error?.message || "Search API error"); }
  const searchD = await searchR.json();
  const searchResults = searchD.content.filter(b => b.type === "text").map(b => b.text).join("");

  // Step 2: Format into JSON
  const jsonText = await apiCall(apiKey,
    `You are a JSON formatter. You receive search results and output ONLY a valid JSON object. Never include markdown, backticks, or any text outside the JSON object. Always start your response with { and end with }.`,
    `${formatPrompt}\n\nSearch results to use:\n${searchResults}\n\nRespond with ONLY the JSON object, starting with { and ending with }. No other text.`
  );

  // Parse JSON
  const trimmed = jsonText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(trimmed.slice(start, end + 1));
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
  const [copied, setCopied] = useState(null);
  const [viewMode, setViewMode] = useState("cards");

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
        const formatPrompt = `Based on the search results, create a JSON object with leads for GR Commercial Finance.
The JSON must have this exact structure with real data from the search results:
{
  "leads": [
    {
      "companyName": "Company Name",
      "contactName": "Contact Name or null",
      "location": "Town, County",
      "emailAddress": "email or null",
      "emailConfidence": "Verified or Likely or Guessed",
      "signal": "Why they need ${p.label}",
      "estimatedDeal": "GBP amount",
      "urgency": "High or Medium or Low",
      "qualificationScore": 75,
      "contactHint": "How to reach them",
      "emailSubject": "Subject line for outreach email",
      "emailBody": "Full email body from GR Commercial Finance about ${p.label}. End with: ${EMAIL_SIG}"
    }
  ],
  "searchSummary": "Brief summary of what was found"
}
Include 3 to 5 leads. Use only real data from the search results.`;

        const result = await searchAndFormat(apiKey, p.searchQuery, formatPrompt);
        setLeads(result.leads || []);
        setSummary(result.searchSummary || "");
      } else {
        const p = REFERRAL_PARTNERS[activePartner];
        const formatPrompt = `Based on the search results, create a JSON object with referral partners for GR Commercial Finance.
The JSON must have this exact structure with real data from the search results:
{
  "partners": [
    {
      "companyName": "Firm Name",
      "contactName": "Contact Name or null",
      "location": "Town, County",
      "emailAddress": "email or null",
      "emailConfidence": "Verified or Likely or Guessed",
      "clientProfile": "Type of clients they work with",
      "referralOpportunity": "Why they would be a good referral partner",
      "partnerScore": 75,
      "contactHint": "How to approach them",
      "emailSubject": "Subject line for partnership email",
      "emailBody": "Full email body from GR Commercial Finance about a referral partnership. End with: ${EMAIL_SIG}"
    }
  ],
  "searchSummary": "Brief summary of what was found"
}
Include 3 to 5 partners. Use only real data from the search results.`;

        const result = await searchAndFormat(apiKey, p.searchQuery, formatPrompt);
        setLeads(result.partners || []);
        setSummary(result.searchSummary || "");
      }
    } catch (e) {
      setError("Search failed: " + e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const exportCSV = () => {
    if (!leads.length) return;
    const isR = mode === "referral";
    const headers = isR
      ? ["Company","Contact","Location","Email","Confidence","Client Profile","Opportunity","Score","Approach","Subject","Email Body"]
      : ["Company","Contact","Location","Email","Confidence","Signal","Est Deal","Urgency","Score","Approach","Subject","Email Body"];
    const rows = leads.map(l => isR
      ? [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.clientProfile,l.referralOpportunity,l.partnerScore,l.contactHint,l.emailSubject,l.emailBody?.replace(/\n/g," ")]
      : [l.companyName,l.contactName,l.location,l.emailAddress,l.emailConfidence,l.signal,l.estimatedDeal,l.urgency,l.qualificationScore,l.contactHint,l.emailSubject,l.emailBody?.replace(/\n/g," ")]
    );
    const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `gr-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const copyEmail = (e, i, lead) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`To: ${lead.emailAddress||""}\nSubject: ${lead.emailSubject}\n\n${lead.emailBody}`);
    setCopied(i); setTimeout(()=>setCopied(null),2000);
  };

  const urgBg = u => ({High:"#7f1d1d",Medium:"#78350f",Low:"#1f2937"}[u]||"#1f2937");
  const urgFg = u => ({High:"#fca5a5",Medium:"#fcd34d",Low:"#9ca3af"}[u]||"#9ca3af");
  const scoreCol = s => s>=80?"#4ade80":s>=65?"#fbbf24":"#f87171";
  const confBg = c => ({Verified:"#14532d",Likely:"#78350f",Guessed:"#1e1e2a"}[c]||"#1e1e2a");
  const confFg = c => ({Verified:"#86efac",Likely:"#fcd34d",Guessed:"#9ca3af"}[c]||"#9ca3af");
  const curProduct = mode === "direct" ? DIRECT_PRODUCTS[activeProduct] : REFERRAL_PARTNERS[activePartner];

  if (!authed) return (
    <div style={{fontFamily:"Arial,sans-serif",background:"#09090d",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:12,padding:"40px 36px",width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:10,background:"linear-gradient(135deg,#c8952a,#8a6018)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",margin:"0 auto 20px"}}>GR</div>
        <div style={{fontSize:18,fontWeight:700,color:"#ede8de",marginBottom:4}}>GR Commercial Finance</div>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:28}}>Lead Intelligence System</div>
        <input type="password" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          style={{width:"100%",background:"#09090d",border:`1px solid ${pwError?"#7f1d1d":"#1c1c28"}`,borderRadius:6,padding:"10px 14px",color:"#ddd8ce",fontSize:14,outline:"none",marginBottom:8,textAlign:"center",boxSizing:"border-box"}}/>
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
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>GR Commercial Finance</div>
            <div style={{fontSize:10,color:"#374151"}}>Lead Intelligence - grcommercialfinance.co.uk</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1}}>API Key</span>
          <input type="password" placeholder="sk-ant-api..." value={apiKey} onChange={e=>setApiKey(e.target.value)}
            style={{width:190,background:"#09090d",border:"1px solid #1c1c28",borderRadius:5,padding:"6px 10px",color:"#ddd8ce",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
        </div>
      </div>

      <div style={{background:"#0f0f16",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex"}}>
        <button onClick={()=>{setMode("direct");setLeads([]);setSummary("");setError("");}}
          style={{padding:"12px 20px",border:"none",borderBottom:mode==="direct"?"2px solid #c8952a":"2px solid transparent",background:"transparent",color:mode==="direct"?"#c8952a":"#4b5563",cursor:"pointer",fontSize:13,fontWeight:700}}>
          Direct Leads
        </button>
        <button onClick={()=>{setMode("referral");setLeads([]);setSummary("");setError("");}}
          style={{padding:"12px 20px",border:"none",borderBottom:mode==="referral"?"2px solid #2ac87a":"2px solid transparent",background:"transparent",color:mode==="referral"?"#2ac87a":"#4b5563",cursor:"pointer",fontSize:13,fontWeight:700}}>
          Referral Partners
        </button>
      </div>

      <div style={{background:"#0c0c12",borderBottom:"1px solid #1c1c28",padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {(mode==="direct"?Object.entries(DIRECT_PRODUCTS):Object.entries(REFERRAL_PARTNERS)).map(([key,cfg])=>(
          <button key={key} onClick={()=>{mode==="direct"?setActiveProduct(key):setActivePartner(key);setLeads([]);setSummary("");setError("");}}
            style={{padding:"9px 14px",border:"none",borderBottom:(mode==="direct"?activeProduct:activePartner)===key?`2px solid ${cfg.color}`:"2px solid transparent",background:"transparent",color:(mode==="direct"?activeProduct:activePartner)===key?cfg.color:"#374151",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
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
              <button onClick={exportCSV} style={{padding:"7px 14px",borderRadius:5,border:"1px solid #1c1c28",background:"transparent",color:"#4b5563",cursor:"pointer",fontSize:12}}>Export CSV</button>
            </>}
            <button onClick={handleSearch} disabled={isSearching}
              style={{padding:"8px 22px",borderRadius:5,border:"none",background:isSearching?"#1c1c28":mode==="direct"?"#c8952a":"#2ac87a",color:isSearching?"#4b5563":"#fff",cursor:isSearching?"not-allowed":"pointer",fontSize:13,fontWeight:700,minWidth:140}}>
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
                {(mode==="direct"?["Company","Contact","Location","Email","Conf","Signal","Deal","Urgency","Score",""]
                  :["Firm","Contact","Location","Email","Conf","Profile","Opportunity","Score",""]).map(h=>(
                  <th key={h} style={{padding:"9px 10px",textAlign:"left",color:"#374151",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
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
                  <td style={{padding:"8px 10px"}}><button onClick={e=>copyEmail(e,i,lead)} style={{padding:"3px 9px",borderRadius:3,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:10}}>{copied===i?"Copied":"Copy"}</button></td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        )}

        {viewMode==="cards"&&leads.length>0&&(
          <div style={{display:"grid",gap:8}}>
            {leads.map((lead,i)=>{
              const score=lead.qualificationScore||lead.partnerScore;
              return(<div key={i} onClick={()=>setExpanded(expanded===i?null:i)}
                style={{background:"#0f0f16",border:`1px solid ${expanded===i?"#c8952a44":"#1c1c28"}`,borderRadius:8,overflow:"hidden",cursor:"pointer"}}>
                <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:700,color:"#ede8de"}}>{lead.companyName}</span>
                      {lead.contactName&&<span style={{fontSize:11,color:"#4b5563"}}>{lead.contactName}</span>}
                      {mode==="direct"&&lead.urgency&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:3,background:urgBg(lead.urgency),color:urgFg(lead.urgency)}}>{lead.urgency}</span>}
                    </div>
                    <div style={{fontSize:11,color:"#374151",marginBottom:5}}>{lead.location}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                      {lead.emailAddress
                        ?<><span style={{fontSize:11,color:"#c8952a",fontFamily:"monospace",background:"#c8952a11",padding:"2px 8px",borderRadius:3}}>{lead.emailAddress}</span>
                          <span style={{fontSize:10,padding:"2px 5px",borderRadius:3,background:confBg(lead.emailConfidence),color:confFg(lead.emailConfidence)}}>{lead.emailConfidence}</span></>
                        :<span style={{fontSize:11,color:"#374151"}}>No email found</span>}
                    </div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{mode==="direct"?lead.signal:lead.referralOpportunity}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {mode==="direct"&&<><div style={{fontSize:15,fontWeight:700,color:"#ede8de"}}>{lead.estimatedDeal}</div><div style={{fontSize:10,color:"#374151",marginBottom:6}}>est. deal</div></>}
                    <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${scoreCol(score)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:scoreCol(score),marginLeft:"auto"}}>{score}</div>
                  </div>
                </div>
                {expanded===i&&(
                  <div style={{borderTop:"1px solid #1c1c28",padding:"13px 16px",background:"#09090d"}}>
                    {lead.contactHint&&<div style={{marginBottom:12}}>
                      <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>How to Approach</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{lead.contactHint}</div>
                    </div>}
                    {lead.emailSubject&&<div>
                      <div style={{fontSize:10,color:"#374151",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Outreach Email</div>
                      <div style={{background:"#0f0f16",border:"1px solid #1c1c28",borderRadius:6,padding:"10px 13px",marginBottom:8}}>
                        {lead.emailAddress&&<div style={{fontSize:11,color:"#374151",marginBottom:4}}>To: <span style={{color:"#c8952a",fontFamily:"monospace"}}>{lead.emailAddress}</span></div>}
                        <div style={{fontSize:11,color:"#374151",marginBottom:8}}>Subject: <span style={{color:"#ede8de",fontWeight:500}}>{lead.emailSubject}</span></div>
                        <div style={{fontSize:11,color:"#6b7280",lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:"1px solid #1c1c28",paddingTop:8}}>{lead.emailBody}</div>
                      </div>
                      <button onClick={e=>copyEmail(e,i,lead)} style={{padding:"5px 14px",borderRadius:4,border:"1px solid #1c1c28",background:copied===i?"#14532d":"transparent",color:copied===i?"#86efac":"#4b5563",cursor:"pointer",fontSize:11}}>
                        {copied===i?"Copied!":"Copy full email"}
                      </button>
                    </div>}
                  </div>
                )}
              </div>);
            })}
          </div>
        )}

        {!isSearching&&leads.length===0&&!error&&(
          <div style={{textAlign:"center",padding:"48px 20px"}}>
            <div style={{fontSize:14,color:"#374151",marginBottom:6}}>{mode==="direct"?"Ready to hunt direct leads":"Ready to find referral partners"}</div>
            <div style={{fontSize:12,color:"#1f2937"}}>Enter your API key - select a product - click {mode==="direct"?"Hunt Leads":"Find Partners"}</div>
          </div>
        )}

        <div style={{marginTop:28,paddingTop:14,borderTop:"1px solid #1c1c28",display:"flex",justifyContent:"space-between",fontSize:10,color:"#1f2937",flexWrap:"wrap",gap:8}}>
          <span>GR Commercial Finance - enquiries@grcommercialfinance.co.uk - 07510 859352 - Manchester</span>
          <span>Public data only - Comply with UK GDPR and FCA rules before outreach</span>
        </div>
      </div>
    </div>
  );
}
