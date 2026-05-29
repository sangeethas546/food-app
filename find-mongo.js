const fs = require('fs');
const path = require('path');

const candidates = [
  'C:/Program Files/MongoDB',
  'C:/Program Files (x86)/MongoDB',
  'C:/mongodb',
  'C:/data/db',
  `${process.env.USERPROFILE}/AppData/Local/Programs`,
  `${process.env.USERPROFILE}/AppData/Roaming`,
];

const exes = ['mongod.exe', 'mongo.exe', 'mongosh.exe'];
const results = [];

for (const base of candidates) {
  if (!base) continue;
  try {
    if (!fs.existsSync(base)) continue;
    const stack = [base];
    while (stack.length) {
      const current = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch (err) {
        continue;
      }
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (exes.includes(entry.name.toLowerCase())) {
          results.push(full);
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

if (results.length === 0) {
  console.log('No MongoDB executables found in standard locations.');
  process.exit(1);
}
console.log('Found MongoDB executables:');
results.forEach((res) => console.log(res));
