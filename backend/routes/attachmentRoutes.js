const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Attachment = require('../models/Attachment');
const Asset = require('../models/Asset');
const mongoose = require('mongoose');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/attachments/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOCX are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

// UPLOAD Attachments
router.post('/assets/:assetId', upload.array('files', 5), async (req, res) => {
    try {
        let { assetId } = req.params;
        const uploadedBy = req.body.uploadedBy || 'Admin';

        // Resolve assetId to MongoDB _id if it's a tag
        if (!mongoose.Types.ObjectId.isValid(assetId)) {
            const asset = await Asset.findOne({ assetTag: assetId });
            if (!asset) return res.status(404).json({ message: 'Asset not found' });
            assetId = asset._id;
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const savedAttachments = [];

        for (const file of req.files) {
            const attachment = new Attachment({
                assetId,
                fileName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                uploadedBy
            });
            const saved = await attachment.save();
            savedAttachments.push(saved);
        }

        res.status(201).json(savedAttachments);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message || 'Failed to upload files' });
    }
});

// GET Attachments for an Asset
router.get('/assets/:assetId', async (req, res) => {
    try {
        let { assetId } = req.params;

        // Resolve if needed
        if (!mongoose.Types.ObjectId.isValid(assetId)) {
            const asset = await Asset.findOne({ assetTag: assetId });
            if (!asset) return res.json([]); // Return empty if asset tag not found
            assetId = asset._id;
        }

        const attachments = await Attachment.find({ assetId }).sort({ uploadedAt: -1 });
        res.json(attachments);
    } catch (error) {
        console.error('Fetch attachments error:', error);
        res.status(500).json({ message: 'Failed to fetch attachments' });
    }
});

// DOWNLOAD Attachment
router.get('/download/:id', async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        if (!fs.existsSync(attachment.filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(attachment.filePath, attachment.fileName);
    } catch (error) {
        res.status(500).json({ message: 'Download failed' });
    }
});

// DELETE Attachment
router.delete('/:id', async (req, res) => {
    try {
        const attachment = await Attachment.findById(req.params.id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Delete file from disk
        if (fs.existsSync(attachment.filePath)) {
            fs.unlinkSync(attachment.filePath);
        }

        // Delete from DB
        await Attachment.findByIdAndDelete(req.params.id);

        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete attachment' });
    }
});

module.exports = router;
