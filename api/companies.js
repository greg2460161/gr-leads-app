export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, sic_codes, location, size = "50" } = req.query;
  const apiKey = process.env.CH_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "CH_API_KEY not configured" });

  try {
    const searchTerm = q || (sic_codes ? "construction" : "limited");
    const params = new URLSearchParams({
      q: searchTerm,
      items_per_page: Math.min(Number(size), 100).toString(),
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

    const items = (data.items || [])
      .filter(c => {
        const status = (c.company_status || "").toLowerCase();
        return status === "active" || status === "";
      })
      .map(c => ({
        company_name: c.title || c.company_name || "",
        company_number: c.company_number || "",
        company_status: c.company_status || "active",
        date_of_creation: c.date_of_creation || "",
        sic_codes: c.sic_codes || [],
        registered_office_address: {
          locality: c.address?.locality || c.registered_office_address?.locality || "",
          region: c.address?.region || c.registered_office_address?.region || "",
          postal_code: c.address?.postal_code || c.registered_office_address?.postal_code || "",
          address_line_1: c.address?.address_line_1 || "",
        },
        company_type: c.company_type || "",
        description: c.description || "",
      }));

    return res.status(200).json({ items, total_results: data.hits || items.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
