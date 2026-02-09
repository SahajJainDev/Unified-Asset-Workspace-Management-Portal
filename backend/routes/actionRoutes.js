const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Employee = require('../models/Employee');
const Desk = require('../models/Desk');
const { logActivity } = require('../utils/activityLogger');

/**
 * POST /api/actions/execute
 * Executes an AI-interpreted action after user confirmation
 */
router.post('/execute', async (req, res) => {
    const { intent, entities, actor = 'AI Assistant' } = req.body;

    try {
        if (!intent || !entities) {
            return res.status(400).json({ message: 'Intent and entities are required' });
        }

        switch (intent) {
            case 'assignAsset':
                return await handleAssign(req, res, entities, actor);
            case 'releaseAsset':
                return await handleRelease(req, res, entities, actor);
            case 'reassignAsset':
                return await handleReassign(req, res, entities, actor);
            case 'getStatus':
                return await handleGetStatus(req, res, entities);
            case 'getWorkspaceStatus':
                return await handleGetWorkspaceStatus(req, res, entities);
            case 'getStats':
                return await handleGetStats(req, res, entities);
            default:
                return res.status(400).json({ message: `Unsupported intent: ${intent}` });
        }
    } catch (error) {
        console.error('[ActionRoutes] Execution Error:', error);
        res.status(500).json({ message: error.message || 'Failed to execute action' });
    }
});

async function handleAssign(req, res, entities, actor) {
    const { asset: assetQuery, employee: empQuery } = entities;

    // 1. Find Asset
    const asset = await Asset.findOne({
        $or: [
            { assetTag: assetQuery },
            { assetName: { $regex: new RegExp(assetQuery, 'i') } }
        ]
    });

    if (!asset) {
        return res.status(404).json({ message: `Asset not found: ${assetQuery}` });
    }

    if (asset.status === 'Assigned') {
        return res.status(400).json({ message: `Asset ${asset.assetTag} is already assigned to ${asset.employee?.name || 'someone'}.` });
    }

    // 2. Find Employee
    const employee = await Employee.findOne({
        $or: [
            { empId: empQuery },
            { fullName: { $regex: new RegExp(empQuery, 'i') } }
        ]
    });

    if (!employee) {
        return res.status(404).json({ message: `Employee not found: ${empQuery}` });
    }

    // 3. Update Asset
    asset.status = 'Assigned';
    asset.assignedTo = employee.empId;
    asset.employee = {
        number: employee.empId,
        name: employee.fullName,
        department: employee.department,
        subDepartment: employee.subDepartment
    };
    asset.assignmentDate = new Date();
    await asset.save();

    // 4. Log Activity
    await logActivity(
        'AI: Asset Assigned',
        `${actor} (via AI) assigned ${asset.assetName} to ${employee.fullName}`,
        'assignment_ind',
        'bg-blue-50 text-blue-600',
        'asset'
    );

    res.json({
        success: true,
        message: `Successfully assigned ${asset.assetName} (${asset.assetTag}) to ${employee.fullName}.`,
        asset
    });
}

async function handleRelease(req, res, entities, actor) {
    const { asset: assetQuery } = entities;

    const asset = await Asset.findOne({
        $or: [
            { assetTag: assetQuery },
            { assetName: { $regex: new RegExp(assetQuery, 'i') } }
        ]
    });

    if (!asset) {
        return res.status(404).json({ message: `Asset not found: ${assetQuery}` });
    }

    if (asset.status !== 'Assigned') {
        return res.status(400).json({ message: `Asset ${asset.assetTag} is not currently assigned.` });
    }

    const previousOwner = asset.employee?.name || 'Employee';

    // Update Asset
    asset.status = 'STORAGE'; // Or 'Available'
    asset.assignedTo = '';
    asset.employee = {};
    asset.assignmentDate = null;
    await asset.save();

    // Log Activity
    await logActivity(
        'AI: Asset Released',
        `${actor} (via AI) released ${asset.assetName} from ${previousOwner}`,
        'assignment_return',
        'bg-gray-50 text-gray-600',
        'asset'
    );

    res.json({
        success: true,
        message: `Successfully released ${asset.assetName} (${asset.assetTag}).`,
        asset
    });
}

async function handleReassign(req, res, entities, actor) {
    // Reassign is basically Release + Assign
    // For simplicity, we can just find both and update
    const { asset: assetQuery, targetEmployee: targetEmpQuery } = entities;

    const asset = await Asset.findOne({
        $or: [
            { assetTag: assetQuery },
            { assetName: { $regex: new RegExp(assetQuery, 'i') } }
        ]
    });

    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const targetEmployee = await Employee.findOne({
        $or: [
            { empId: targetEmpQuery },
            { fullName: { $regex: new RegExp(targetEmpQuery, 'i') } }
        ]
    });

    if (!targetEmployee) return res.status(404).json({ message: 'Target employee not found' });

    const previousOwner = asset.employee?.name || 'Someone';

    asset.status = 'Assigned';
    asset.assignedTo = targetEmployee.empId;
    asset.employee = {
        number: targetEmployee.empId,
        name: targetEmployee.fullName,
        department: targetEmployee.department,
        subDepartment: targetEmployee.subDepartment
    };
    asset.assignmentDate = new Date();
    await asset.save();

    await logActivity(
        'AI: Asset Reassigned',
        `${actor} (via AI) reassigned ${asset.assetName} from ${previousOwner} to ${targetEmployee.fullName}`,
        'swap_horiz',
        'bg-purple-50 text-purple-600',
        'asset'
    );

    res.json({
        success: true,
        message: `Successfully reassigned ${asset.assetName} to ${targetEmployee.fullName}.`,
        asset
    });
}

async function handleGetStatus(req, res, entities) {
    const { asset: assetQuery } = entities;

    const asset = await Asset.findOne({
        $or: [
            { assetTag: assetQuery },
            { assetName: { $regex: new RegExp(assetQuery, 'i') } }
        ]
    });

    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const statusMsg = asset.status === 'Assigned'
        ? `Asset ${asset.assetName} is currently assigned to ${asset.employee?.name || asset.assignedTo}.`
        : `Asset ${asset.assetName} is currently ${asset.status}.`;

    res.json({
        success: true,
        message: statusMsg,
        status: asset.status,
        assignee: asset.employee?.name
    });
}

async function handleGetWorkspaceStatus(req, res, entities) {
    const { workstation: wsQuery } = entities;

    if (!wsQuery) {
        return res.status(400).json({ message: "Which workstation would you like to check? (e.g., A-101)" });
    }

    const desk = await Desk.findOne({
        $or: [
            { workstationId: wsQuery },
            { workstationId: { $regex: new RegExp(wsQuery, 'i') } }
        ]
    });

    if (!desk) return res.status(404).json({ message: `Workstation ${wsQuery} not found.` });

    let message = `Workstation ${desk.workstationId} is currently ${desk.status}.`;
    if (desk.status !== 'Available' && desk.userName) {
        message += ` It is assigned to ${desk.userName}.`;
    }

    res.json({
        success: true,
        message,
        status: desk.status,
        occupant: desk.userName
    });
}

async function handleGetStats(req, res, entities) {
    const stats = {
        totalAssets: await Asset.countDocuments({}),
        assignedAssets: await Asset.countDocuments({ status: 'Assigned' }),
        totalDesks: await Desk.countDocuments({}),
        occupiedDesks: await Desk.countDocuments({ status: { $ne: 'Available' } }),
        totalEmployees: await Employee.countDocuments({})
    };

    const message = `Here is a summary of the current inventory:
- **Assets**: ${stats.totalAssets} total (${stats.assignedAssets} assigned)
- **Workstations**: ${stats.totalDesks} total (${stats.occupiedDesks} occupied/assigned)
- **Employees**: ${stats.totalEmployees} registered`;

    res.json({
        success: true,
        message,
        stats
    });
}

module.exports = router;
