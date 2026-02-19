import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aviation Stand Finder</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; color: white; margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            margin-bottom: 20px;
        }
        .search-form { display: flex; gap: 10px; margin-bottom: 20px; }
        input[type="text"] {
            flex: 1;
            padding: 15px;
            font-size: 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
        }
        button {
            padding: 15px 30px;
            font-size: 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        button:hover { background: #5568d3; }
        .result { margin-top: 20px; }
        .stand-number {
            font-size: 3rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .confidence {
            background: #e0e7ff;
            padding: 10px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .metadata { color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ Aviation Stand Finder</h1>
            <p>Real-world parking stand identification for arriving flights</p>
        </div>
        <div class="card">
            <form class="search-form" id="searchForm">
                <input type="text" id="flightInput" placeholder="Enter flight number (e.g., BA1489, BAW1489)" required />
                <button type="submit">Find Stand</button>
            </form>
            <div id="result"></div>
        </div>
    </div>
    <script>
        document.getElementById('searchForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const flight = document.getElementById('flightInput').value;
            const result = document.getElementById('result');
            result.innerHTML = '<p>🔍 Searching for stand information...</p>';
            
            try {
                const res = await fetch(\`/api/stand?flight=\${encodeURIComponent(flight)}\`);
                const data = await res.json();
                
                if (res.ok) {
                    const confidencePercent = Math.round(data.confidence * 100);
                    result.innerHTML = \`
                        <div class="result">
                            <div class="stand-number">Stand \${data.stand}</div>
                            <div class="confidence">
                                <strong>Confidence:</strong> \${confidencePercent}%
                            </div>
                            <div class="metadata">
                                <p><strong>Flight:</strong> \${data.flight}</p>
                                <p><strong>Airport:</strong> \${data.airport || 'Auto-detected'}</p>
                                <p><strong>Terminal:</strong> \${data.terminal || 'N/A'}</p>
                                <p><strong>Method:</strong> \${data.fallbackStageName}</p>
                                <p><strong>Sources:</strong> \${data.sources.join(', ')}</p>
                            </div>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<p style="color:red;">❌ \${data.error}</p>\`;
                }
            } catch (error) {
                result.innerHTML = '<p style="color:red;">❌ Failed to connect to API</p>';
            }
        });
    </script>
</body>
</html>
  `);
}
