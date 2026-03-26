export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { kundnamn, kontext } = req.body;

  if (!kundnamn || !kontext) {
    return res.status(400).json({ error: 'kundnamn och kontext krävs' });
  }

  const prompt = `Du är en hjälpsam assistent för Tegel & Hatt, en designbyrå i Stockholm som jobbar med kommunikation och grafisk design.

Johanna på Tegel & Hatt har haft en första dialog med en kund som heter ${kundnamn}. Här är kontexten från den dialogen:

---
${kontext}
---

Baserat på denna kontext, generera 5-7 frågor som Johanna ska skicka till kunden. Frågorna ska:
- Hjälpa kunden förstå vad de faktiskt behöver (inte bara vad de bad om)
- Vara formulerade ur kundens perspektiv – varma, nyfikna, enkla att svara på
- Undvika byråjargong som "varumärkesplattform", "brief", "förstudie"
- Kännas som att de är till nytta för kunden, inte för byrån
- Vara konkreta och specifika för just denna kunds situation
- Max 2 meningar per fråga

Svara ENBART med ett JSON-objekt i detta format, inget annat:
{
  "fragor": [
    {
      "id": 1,
      "fraga": "Frågetexten här",
      "hint": "En kort förklaring varför vi frågar detta (max 15 ord)"
    }
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Kunde inte generera frågor' });
  }
}
