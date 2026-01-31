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
        console.log("--- Starting Feature Verification ---");

        // 1. Create User
        const empId = "FEAT_TEST_" + Math.floor(Math.random() * 1000);
        console.log(`1. Creating User ${empId}...`);
        const createRes = await request('POST', '/employees', {
            empId: empId, fullName: "Feature Test User", email: "test@feat.com", role: "Employee"
        });
        if (createRes.status !== 201) throw new Error("Create failed");
        const user = createRes.body;
        console.log("   User Created:", user._id);

        // 2. Create Unassigned Asset
        const assetTag = "ASSET_" + Math.floor(Math.random() * 1000);
        console.log(`2. Creating Unassigned Asset ${assetTag}...`);
        const createAssetRes = await request('POST', '/assets', {
            assetName: "Unassigned Laptop", assetTag: assetTag, status: "Available"
        });
        const asset = createAssetRes.body;
        console.log("   Asset Created:", asset._id);

        // 3. Verify Get Unassigned Assets
        console.log("3. Fetching Unassigned Assets...");
        const unassignedRes = await request('GET', '/assets?status=Available');
        const found = unassignedRes.body.find(a => a._id === asset._id);
        if (!found) console.error("   FAILED: Asset not found in unassigned list");
        else console.log("   PASSED: Asset found in unassigned list");

        // 4. Assign Asset (Allocate)
        console.log("4. Allocating Asset to User...");
        const assignRes = await request('PUT', `/assets/${asset._id}`, {
            ...asset,
            status: 'Assigned',
            assignedTo: user.empId,
            employee: { number: user.empId, name: user.fullName }
        });
        if (assignRes.status !== 200) console.error("   FAILED: Allocation failed");
        else console.log("   PASSED: Asset allocated");

        // 5. Edit User
        console.log("5. Editing User...");
        const editRes = await request('PATCH', `/employees/${user._id}`, { fullName: "Updated Name" });
        if (editRes.body.fullName !== "Updated Name") console.error("   FAILED: Edit failed");
        else console.log("   PASSED: User name updated");

        // 6. Delete User
        console.log("6. Deleting User...");
        const delRes = await request('DELETE', `/employees/${user._id}`);
        if (delRes.status !== 200) console.error("   FAILED: Delete failed");
        else console.log("   PASSED: User deleted");

        // Verify Delete
        const getRes = await request('GET', `/employees/${user._id}`);
        if (getRes.status === 404) console.log("   PASSED: User not found after delete");
        else console.error("   FAILED: User still exists");

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

runVerification();
