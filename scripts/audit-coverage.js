/**
 * One-off audit: which contract props/events/api methods are never even
 * mentioned in their component's vitest file? (Mention is a weak proxy
 * for behavioral coverage — absence is a definite gap.)
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'components');
let totalEntries = 0;
let totalMissing = 0;
const noTestFile = [];
const report = [];

for (const name of fs.readdirSync(dir)) {
    const cPath = path.join(dir, name, 'contract.json');
    if (!fs.existsSync(cPath)) {
        continue;
    }
    const contract = JSON.parse(fs.readFileSync(cPath, 'utf8'));
    const entries = [
        ...Object.keys(contract.props || {}),
        ...(contract.events || []),
        ...(contract.api || []),
    ];
    totalEntries += entries.length;
    const tPath = path.join(dir, name, name + '.test.ts');
    if (!fs.existsSync(tPath)) {
        noTestFile.push(name);
        totalMissing += entries.length;
        continue;
    }
    const test = fs.readFileSync(tPath, 'utf8');
    const missing = entries.filter((p) => {
        // word-boundary mention anywhere in the test source
        return !new RegExp('\\b' + p + '\\b').test(test);
    });
    totalMissing += missing.length;
    if (missing.length) {
        report.push(name + ' (' + missing.length + '): ' + missing.join(', '));
    }
}

console.log('Components without a test file:', noTestFile.length ? noTestFile.join(', ') : 'none');
console.log('');
console.log('Contract entries (props/events/api) never mentioned in the test file:');
if (report.length === 0) {
    console.log('  none — every entry is at least referenced');
} else {
    report.forEach((r) => console.log('  ' + r));
}
console.log('');
console.log('Total contract entries: ' + totalEntries + ' | unreferenced: ' + totalMissing);
