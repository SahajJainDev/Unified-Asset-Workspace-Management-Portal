const XLSX = require('./backend/node_modules/xlsx');
const path = require('path');

// Convert assets CSV to XLSX
const csvPath = path.join(__dirname, 'sample-files', 'sample_assets_with_employees_and_type.csv');
const workbook = XLSX.readFile(csvPath);

const xlsxPath = path.join(__dirname, 'sample-files', 'sample_assets_with_employees_and_type.xlsx');
XLSX.writeFile(workbook, xlsxPath);

console.log('✅ Successfully converted CSV to XLSX');
console.log(`📄 Output: ${xlsxPath}`);
