const AssetHistory = require('../models/AssetHistory');

/**
 * Log a lifecycle event for an asset
 * @param {string} assetId - The asset ID (or Tag)
 * @param {string} eventType - The type of event (CREATED, ASSIGNED, etc.)
 * @param {object} details - Dynamic details about the event
 * @param {string} performedBy - Name or ID of the person who performed the action
 */
const logAssetEvent = async (assetId, eventType, details, performedBy) => {
    try {
        const history = new AssetHistory({
            assetId: assetId.toString(),
            eventType,
            eventDetails: details,
            performedBy: performedBy || 'System'
        });
        await history.save();
        console.log(`[HistoryService] Logged ${eventType} for asset ${assetId}`);
    } catch (error) {
        console.error('[HistoryService] Failed to log event:', error);
    }
};

module.exports = {
    logAssetEvent
};
