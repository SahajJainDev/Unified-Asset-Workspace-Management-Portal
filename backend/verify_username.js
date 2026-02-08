const http = require('http');

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

async function verifyUsername() {
    try {
        console.log("1. Creating Test Employee with Space in Name...");
        const empId = "TEST_USER_" + Math.floor(Math.random() * 10000);
        const fullName = "Adithya Komatireddy";
        const expectedUserName = "Adithya.Komatireddy";

        const createRes = await request('POST', '/employees', {
            empId: empId,
            fullName: fullName,
            email: "test.user@example.com",
            role: "Employee"
        });

        console.log("Create Status:", createRes.status);
        if (createRes.status !== 201) throw new Error("Failed to create employee");
        
        const emp = createRes.body;
        console.log(`Created Employee: ${emp.fullName}, UserName: ${emp.userName}`);

        if (emp.userName === expectedUserName) {
            console.log("PASSED: UserName generated correctly on creation.");
        } else {
            console.error(`FAILED: Expected ${expectedUserName}, got ${emp.userName}`);
        }

        console.log("\n2. Updating Full Name...");
        const newFullName = "Sahaj Jain";
        const expectedNewUserName = "Sahaj.Jain";

        const updateRes = await request('PATCH', `/employees/${emp._id}`, {
            fullName: newFullName
        });

        console.log("Update Status:", updateRes.status);
        if (updateRes.status !== 200) throw new Error("Failed to update employee");

        const updatedEmp = updateRes.body;
        console.log(`Updated Employee: ${updatedEmp.fullName}, UserName: ${updatedEmp.userName}`);

        if (updatedEmp.userName === expectedNewUserName) {
             console.log("PASSED: UserName updated correctly on patch.");
        } else {
             console.error(`FAILED: Expected ${expectedNewUserName}, got ${updatedEmp.userName}`);
        }
        
        console.log("\n3. Cleaning up...");
        await request('DELETE', `/employees/${emp._id}`);
        console.log("Test employee deleted.");

    } catch (error) {
        console.error("Verification logic failed:", error);
    }
}

verifyUsername();
