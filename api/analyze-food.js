export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const image = body.image;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if ((!image || typeof image !== 'string' || !image.startsWith('data:image/')) && !notes) {
      return res.status(400).json({ error: 'Add a meal photo or describe what you ate and the quantity.' });
    }
    if (image && image.length > 6_500_000) return res.status(413).json({ error: 'Image is too large. Please upload a smaller photo.' });

    const content = [
      { type: 'input_text', text: `You are a careful nutrition estimation assistant. Analyze the meal photo and/or meal details. Identify the most likely foods and estimate the edible serving for the quantities the user describes. If multiple foods are listed, combine them into one daily meal result. Return estimates for calories, protein, carbohydrates, fat, and fiber. Never claim exactness. If the user gives a quantity such as 1 cup, 2 rotis, 1 spoon sabzi, use that quantity rather than a generic serving. Return ONLY valid JSON with exactly these keys: name, serving, calories, protein_g, carbs_g, fat_g, fiber_g. All nutrition fields must be numbers. Example: {"name":"Tea + roti + sabzi","serving":"1 cup tea + 2 rotis + 1 tbsp sabzi","calories":420,"protein_g":12,"carbs_g":60,"fat_g":14,"fiber_g":6}.

User meal details: ${notes || '(none provided)'}` }
    ];
    if (image) content.push({ type: 'input_image', image_url: image });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content }],
        
        max_output_tokens: 300
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'OpenAI request failed.' });
    let text = data.output_text || '';
    if (!text) {
      const chunks = [];
      for (const item of data.output || []) for (const c of item.content || []) if (c.type === 'output_text') chunks.push(c.text);
      text = chunks.join('');
    }
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const result = JSON.parse(cleaned);
    return res.status(200).json({
      name: String(result.name || 'Unknown food'),
      serving: String(result.serving || '1 serving'),
      calories: Number(result.calories) || 0,
      protein_g: Number(result.protein_g) || 0,
      carbs_g: Number(result.carbs_g) || 0,
      fat_g: Number(result.fat_g) || 0,
      fiber_g: Number(result.fiber_g) || 0
    });
  } catch (err) {
    console.error('Food analysis error:', err);
    return res.status(500).json({ error: 'Food analysis failed. Check the live server AI configuration and try again.' });
  }
}
