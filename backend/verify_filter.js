const http = require('http');

const request = (method, path, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
                catch (e) { resolve({ status: res.statusCode, body: body }); }
            });
        });
        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

async function runVerification() {
    try {
        console.log("--- Verifying Asset Filter Logic ---");

        // 1. Create Available Asset (Unassigned)
        const tag1 = "FILTER_TEST_" + Math.floor(Math.random() * 1000);
        console.log(`1. Creating Unassigned Asset ${tag1}...`);
        const res1 = await request('POST', '/assets', {
            assetName: "Unassigned Item", assetTag: tag1, status: "Available"
        });
        const asset1 = res1.body;

        // 2. Create Assigned Asset but status 'Available' (Inconsistent state test)
        // Note: The API validation might allow this if we don't enforce strictness on creation, 
        // but let's try to create one with 'Available' status but 'employee' data if possible, 
        // OR better, create an Assigned one and see if it's excluded.
        const tag2 = "FILTER_TEST_" + Math.floor(Math.random() * 1000);
        console.log(`2. Creating Assigned Asset ${tag2}...`);
        const res2 = await request('POST', '/assets', {
            assetName: "Assigned Item", assetTag: tag2, status: "Assigned",
            employee: { number: "EMP001", name: "Employee 1" }
        });
        const asset2 = res2.body;

        // 3. Fetch with status=Available
        console.log("3. Fetching assets?status=Available...");
        const filterRes = await request('GET', '/assets?status=Available');
        const assets = filterRes.body;

        const found1 = assets.find(a => a.assetTag === tag1);
        const found2 = assets.find(a => a.assetTag === tag2);

        if (found1) console.log("   PASSED: Unassigned asset found.");
        else console.error("   FAILED: Unassigned asset NOT found.");

        if (!found2) console.log("   PASSED: Assigned asset NOT found.");
        else console.error("   FAILED: Assigned asset FOUND in Available list!");

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

runVerification();
