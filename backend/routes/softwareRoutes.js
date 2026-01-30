const express = require("express");
const router = express.Router();
const Software = require("../models/Software");

// GET all software
router.get("/", async (req, res) => {
  try {
    const software = await Software.find().sort({ createdAt: -1 });
    res.json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Failed to fetch software' });
  }
});

// GET software by ID
router.get("/:id", async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json(software);
  } catch (error) {
    console.error('Error fetching software:', error);
    res.status(500).json({ message: 'Failed to fetch software' });
  }
});

// POST create new software
router.post("/", async (req, res) => {
  try {
    const software = new Software(req.body);
    await software.save();
    res.status(201).json(software);
  } catch (error) {
    console.error('Error creating software:', error);
    res.status(500).json({ message: 'Failed to create software' });
  }
});

// PUT update software
router.put("/:id", async (req, res) => {
  try {
    const software = await Software.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json(software);
  } catch (error) {
    console.error('Error updating software:', error);
    res.status(500).json({ message: 'Failed to update software' });
  }
});

// DELETE software
router.delete("/:id", async (req, res) => {
  try {
    const software = await Software.findByIdAndDelete(req.params.id);
    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }
    res.json({ message: 'Software deleted successfully' });
  } catch (error) {
    console.error('Error deleting software:', error);
    res.status(500).json({ message: 'Failed to delete software' });
  }
});

module.exports = router;
