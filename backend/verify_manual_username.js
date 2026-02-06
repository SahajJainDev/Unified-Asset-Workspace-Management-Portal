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

async function verifyManualUsername() {
    try {
        console.log("1. Creating Employee with MANUAL UserName...");
        const empId1 = "TEST_MANUAL_" + Math.floor(Math.random() * 10000);
        const fullName1 = "Manual User";
        const manualUserName = "Custom.User.Name";

        const createRes1 = await request('POST', '/employees', {
            empId: empId1,
            fullName: fullName1,
            userName: manualUserName,
            email: "manual@example.com",
            role: "Employee"
        });

        console.log("Create Manual Status:", createRes1.status);
        if (createRes1.status !== 201) throw new Error("Failed to create employee");
        
        const emp1 = createRes1.body;
        console.log(`Created: ${emp1.fullName}, UserName: ${emp1.userName}`);

        if (emp1.userName === manualUserName) {
            console.log("PASSED: Manual UserName preserved.");
        } else {
            console.error(`FAILED: Expected ${manualUserName}, got ${emp1.userName}`);
        }

        console.log("\n2. Creating Employee with AUTO UserName (No userName provided)...");
        const empId2 = "TEST_AUTO_" + Math.floor(Math.random() * 10000);
        const fullName2 = "Auto Generator";
        const expectedAutoUserName = "Auto.Generator";

        const createRes2 = await request('POST', '/employees', {
            empId: empId2,
            fullName: fullName2,
            email: "auto@example.com",
            role: "Employee"
        });

        console.log("Create Auto Status:", createRes2.status);
        if (createRes2.status !== 201) throw new Error("Failed to create employee");
        
        const emp2 = createRes2.body;
        console.log(`Created: ${emp2.fullName}, UserName: ${emp2.userName}`);

        if (emp2.userName === expectedAutoUserName) {
            console.log("PASSED: Auto UserName generated correctly.");
        } else {
            console.error(`FAILED: Expected ${expectedAutoUserName}, got ${emp2.userName}`);
        }

        console.log("\n3. Updating Employee (Name Change ONLY - Should auto-update UserName)...");
        const newName = "Updated Name";
        const expectedUpdatedUserName = "Updated.Name";
        
        const updateRes1 = await request('PATCH', `/employees/${emp2._id}`, {
            fullName: newName
        });
        
        const updatedEmp1 = updateRes1.body;
        console.log(`Updated Name: ${updatedEmp1.fullName}, UserName: ${updatedEmp1.userName}`);
        
        if (updatedEmp1.userName === expectedUpdatedUserName) {
             console.log("PASSED: UserName auto-updated with name change.");
        } else {
             console.error(`FAILED: Expected ${expectedUpdatedUserName}, got ${updatedEmp1.userName}`);
        }

        console.log("\n4. Updating Employee (Manual UserName Change - Should preserved)...");
        const newManualUserName = "My.New.Username";
        
        const updateRes2 = await request('PATCH', `/employees/${emp2._id}`, {
            userName: newManualUserName
        });
        
        const updatedEmp2 = updateRes2.body;
        console.log(`Updated Manual UserName: ${updatedEmp2.userName}`);
        
        if (updatedEmp2.userName === newManualUserName) {
             console.log("PASSED: Manual UserName update preserved.");
        } else {
             console.error(`FAILED: Expected ${newManualUserName}, got ${updatedEmp2.userName}`);
        }

        console.log("\n5. Cleaning up...");
        await request('DELETE', `/employees/${emp1._id}`);
        await request('DELETE', `/employees/${emp2._id}`);
        console.log("Test employees deleted.");

    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verifyManualUsername();
