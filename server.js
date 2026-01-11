const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/analyze', async (req, res) => {
    const { decision, inaction, reversible, fear } = req.body;

    const prompt = `You are a decision-making advisor. Analyze this decision and provide a recommendation.

Decision: ${decision}

Context:
- If I do nothing for 30 days: ${inaction || 'Not specified'}
- Is this decision reversible?: ${reversible || 'Not specified'}
- What scares me more?: ${fear || 'Not specified'}

Provide your response EXACTLY as JSON with no markdown or code blocks:
{
  "recommendation": "YES" or "NO",
  "rationale": ["Point 1 in one concise sentence", "Point 2 in one concise sentence", "Point 3 in one concise sentence"],
  "confidence": 85
}

CRITICAL: Return ONLY the JSON object, no explanatory text, no markdown formatting, no code blocks.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        const text = data.content[0].text;
        const cleanText = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanText);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));