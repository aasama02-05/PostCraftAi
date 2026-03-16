const fs = require('fs');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit --pretty false');
} catch (e) {
  const out = e.stdout ? e.stdout.toString('utf8') : '';
  fs.writeFileSync('tsc-errors.json', JSON.stringify({ errors: out.split('\n').filter(Boolean) }));
}
