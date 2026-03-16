import { exec } from 'child_process';
import fs from 'fs';

exec('npm run check', (err, stdout, stderr) => {
  fs.writeFileSync('tsc_output.txt', stdout + '\n' + stderr);
  console.log("Done");
});
