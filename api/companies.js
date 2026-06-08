export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, sic_codes, location, items_per_page = "50" } = req.query;
  const apiKey = process.env.CH_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "CH_API_KEY not configured" });

  const params = new URLSearchParams({
    q: q || "limited",
    items_per_page,
    restrictions: "active-companies",
  });
  if (location) params.append("location", location);
  if (sic_codes) {
    sic_codes.split(",").forEach(s => params.append("sic_codes", s.trim()));
  }

  try {
    const r = await fetch(
      `https://api.company-information.service.gov.uk/advanced-search/companies?${params}`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
        },
      }
    );
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: "CH API error: " + r.status, detail: txt });
    }
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
