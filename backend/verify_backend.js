const http = require('http');

const API_URL = 'http://localhost:5000/api';

const request = (method, path, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

async function runVerification() {
    try {
        console.log("1. Creating Test Employee...");
        const empId = "TEST_" + Math.floor(Math.random() * 1000);
        const createRes = await request('POST', '/employees', {
            empId: empId,
            fullName: "Test User",
            email: "test@example.com",
            role: "Admin",
            isActive: true
        });
        console.log("Create Status:", createRes.status);
        if (createRes.status !== 201) throw new Error("Failed to create employee");
        const emp = createRes.body;
        console.log("Created Emp ID:", emp._id);

        console.log("2. Verifying Filters (Role/Status)...");
        const getRes = await request('GET', `/employees/${emp._id}`);
        console.log("Get Status:", getRes.status);
        if (getRes.body.role !== 'Admin') console.error("FAILED: Role mismatch");
        else console.log("PASSED: Role is Admin");

        console.log("3. Updating Role to Employee...");
        const patchRes = await request('PATCH', `/employees/${emp._id}`, { role: 'Employee' });
        console.log("Patch Status:", patchRes.status);
        if (patchRes.body.role !== 'Employee') console.error("FAILED: Role update failed");
        else console.log("PASSED: Role updated to Employee");

        console.log("4. Creating Asset assigned to Employee...");
        const assetTag = "TAG_" + Math.floor(Math.random() * 1000);
        const assetRes = await request('POST', '/assets', {
            assetName: "Test Laptop",
            assetTag: assetTag,
            status: "Assigned",
            employee: {
                number: empId,
                name: "Test User"
            }
        });
        console.log("Create Asset Status:", assetRes.status);

        console.log("5. Fetching Assets by Assigned To...");
        const filterRes = await request('GET', `/assets?assignedTo=${empId}`);
        console.log("Filter Status:", filterRes.status);
        const assets = filterRes.body;
        if (Array.isArray(assets) && assets.length > 0 && assets[0].assetTag === assetTag) {
            console.log("PASSED: Asset found by assignedTo filter");
        } else {
            console.error("FAILED: Asset NOT found by filter", assets);
        }

        console.log("Verification Complete");

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

runVerification();
