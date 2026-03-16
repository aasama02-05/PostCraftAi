const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log("No TS errors!");
} catch(e) {
  const errText = e.stdout.toString('utf-8');
  fs.writeFileSync('tsc-errors.txt', errText);
  console.log("Wrote errors to tsc-errors.txt");
}
