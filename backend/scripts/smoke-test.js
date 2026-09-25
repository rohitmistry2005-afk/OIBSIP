const base = process.env.SMOKE_URL || `http://localhost:${process.env.PORT || 5000}`;
const response = await fetch(`${base}/api/health`);
if (!response.ok) throw new Error(`Health check failed: HTTP ${response.status}`);
const body = await response.json();
if (!body.success) throw new Error('Health endpoint returned success=false');
console.log(`Smoke test passed: ${base}/api/health`);
