export async function GET() {
  const results = {};

  // Test Anthropic via AI Gateway
  try {
    const anthropicRes = await fetch('https://ai-gateway.vercel.sh/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AI_GATEWAY_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      }),
    });
    const anthropicData = await anthropicRes.json();
    results.anthropic = {
      status: anthropicRes.status,
      working: anthropicRes.ok,
      response: anthropicRes.ok
        ? anthropicData.content?.[0]?.text
        : anthropicData.error || anthropicData,
    };
  } catch (err) {
    results.anthropic = { working: false, error: err.message };
  }

  // Test OpenAI via AI Gateway
  try {
    const openaiRes = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      }),
    });
    const openaiData = await openaiRes.json();
    results.openai = {
      status: openaiRes.status,
      working: openaiRes.ok,
      response: openaiRes.ok
        ? openaiData.choices?.[0]?.message?.content
        : openaiData.error || openaiData,
    };
  } catch (err) {
    results.openai = { working: false, error: err.message };
  }

  const allWorking = results.anthropic?.working && results.openai?.working;

  return Response.json({
    success: allWorking,
    message: allWorking
      ? '✅ Both Anthropic and OpenAI keys are working via AI Gateway!'
      : '⚠️ One or more keys have issues — check details below.',
    results,
  });
}
