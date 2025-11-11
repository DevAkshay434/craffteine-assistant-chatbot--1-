const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('📦 Importing stock data from Excel files...\n');

// Read Flavors
console.log('Reading flavors...');
const flavorsWorkbook = XLSX.readFile('attached_assets/In Stock Flavors_1762867395033.xlsx');
const flavorsSheet = flavorsWorkbook.Sheets[flavorsWorkbook.SheetNames[0]];
const flavorsRaw = XLSX.utils.sheet_to_json(flavorsSheet, { header: 1 });
const flavors = flavorsRaw
  .map(row => row[0])
  .filter(name => name && typeof name === 'string' && name.trim().length > 0)
  .map((name, index) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: name.trim(),
    availableFor: ['stickPack'], // Flavors are for stick packs
    status: 'in_stock',
    category: categorizeFlavor(name),
    sortOrder: index
  }));

console.log(`✓ Found ${flavors.length} flavors`);

// Read Powders
console.log('Reading powders...');
const powdersWorkbook = XLSX.readFile('attached_assets/In Stock Powders_1762867404022.xlsx');
const powdersSheet = powdersWorkbook.Sheets[powdersWorkbook.SheetNames[0]];
const powdersRaw = XLSX.utils.sheet_to_json(powdersSheet, { header: 1 });
const powders = powdersRaw
  .map(row => row[0])
  .filter(name => name && typeof name === 'string' && name.trim().length > 0)
  .map((name, index) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: name.trim(),
    status: 'in_stock',
    type: categorizePowder(name),
    sortOrder: index
  }));

console.log(`✓ Found ${powders.length} powders`);

// Categorize flavors
function categorizeFlavor(name) {
  const n = name.toLowerCase();
  if (n.includes('lemon') || n.includes('lime') || n.includes('orange') || n.includes('sour cherry')) return 'citrus';
  if (n.includes('berry') || n.includes('strawberry') || n.includes('raspberry')) return 'berry';
  if (n.includes('fruit') || n.includes('tropical') || n.includes('mango') || n.includes('pineapple')) return 'tropical';
  if (n.includes('candy') || n.includes('gummy') || n.includes('bubble')) return 'candy';
  if (n.includes('vanilla') || n.includes('coconut') || n.includes('cream')) return 'creamy';
  return 'other';
}

// Categorize powders
function categorizePowder(name) {
  const n = name.toLowerCase();
  if (n.includes('protein')) return 'protein';
  if (n.includes('fiber') || n.includes('psyllium')) return 'fiber';
  if (n.includes('vitamin') || n.includes('ascorbic')) return 'vitamin';
  if (n.includes('mineral') || n.includes('magnesium') || n.includes('zinc') || n.includes('calcium')) return 'mineral';
  if (n.includes('caffeine') || n.includes('theanine') || n.includes('tyrosine')) return 'stimulant';
  if (n.includes('ashwagandha') || n.includes('rhodiola') || n.includes('ginseng')) return 'adaptogen';
  if (n.includes('probiotic') || n.includes('prebiotic') || n.includes('enzyme')) return 'digestive';
  if (n.includes('extract') || n.includes('berry') || n.includes('fruit')) return 'botanical';
  return 'supplement';
}

// Write JSON files
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const flavorsOutput = {
  lastUpdated: new Date().toISOString(),
  count: flavors.length,
  maxSelectionsPerFormula: 2,
  flavors: flavors
};

const powdersOutput = {
  lastUpdated: new Date().toISOString(),
  count: powders.length,
  powders: powders
};

fs.writeFileSync(
  path.join(dataDir, 'flavors.json'),
  JSON.stringify(flavorsOutput, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'powders.json'),
  JSON.stringify(powdersOutput, null, 2)
);

console.log('\n✅ Stock data imported successfully!');
console.log(`   - data/flavors.json (${flavors.length} flavors)`);
console.log(`   - data/powders.json (${powders.length} powders)`);
console.log('\n📊 Flavor Categories:');
const flavorCounts = flavors.reduce((acc, f) => {
  acc[f.category] = (acc[f.category] || 0) + 1;
  return acc;
}, {});
Object.entries(flavorCounts).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count}`);
});

console.log('\n📊 Powder Types:');
const powderCounts = powders.reduce((acc, p) => {
  acc[p.type] = (acc[p.type] || 0) + 1;
  return acc;
}, {});
Object.entries(powderCounts).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});
