export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, sic_codes, location, size = "100" } = req.query;
  const apiKey = process.env.CH_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "CH_API_KEY not configured" });

  try {
    // Use standard search endpoint - works with all API keys
    const params = new URLSearchParams({
      q: q || (sic_codes ? sic_codes.split(",")[0] : "construction"),
      items_per_page: size,
    });

    const r = await fetch(
      `https://api.company-information.service.gov.uk/search/companies?${params}`,
      { headers: { Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64") } }
    );

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: "CH API error: " + r.status, detail: txt });
    }

    const data = await r.json();

    // Filter to active companies only
    if (data.items) {
      data.items = data.items.filter(c =>
        c.company_status === "active" || c.company_status === "Active" || !c.company_status
      );
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
