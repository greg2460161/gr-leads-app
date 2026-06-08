export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, sic_codes, location, items_per_page = "100", start_index = "0" } = req.query;
  const apiKey = process.env.CH_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "CH_API_KEY not configured" });

  const params = new URLSearchParams({
    items_per_page,
    start_index,
    company_status: "active",
  });

  if (q && q !== "limited") params.append("company_name_includes", q);
  if (location) params.append("registered_office_address.locality", location);
  if (sic_codes) {
    const codes = sic_codes.split(",").map(s => s.trim()).filter(Boolean);
    codes.forEach(s => params.append("sic_codes", s));
  }

  try {
    const url = `https://api.company-information.service.gov.uk/advanced-search/companies?${params}`;
    const r = await fetch(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
      },
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: "CH API error: " + r.status, detail: txt });
    }
    const data = await r.json();
    if (data.items) {
      data.items = data.items.filter(c =>
        c.company_status === "active" || !c.company_status
      );
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
