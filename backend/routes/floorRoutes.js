const express = require("express");
const router = express.Router();
const Floor = require("../models/Floor");

// Middleware for validating floor data
const validateFloorData = (req, res, next) => {
  const { name, building, level } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Floor name is required and must be a non-empty string' });
  }

  if (!building || typeof building !== 'string' || building.trim().length === 0) {
    return res.status(400).json({ message: 'Building is required and must be a non-empty string' });
  }

  if (level === undefined || typeof level !== 'number') {
    return res.status(400).json({ message: 'Level is required and must be a number' });
  }

  next();
};

// CREATE Floor
router.post("/", validateFloorData, async (req, res) => {
  try {
    const floor = new Floor(req.body);
    const savedFloor = await floor.save();
    res.status(201).json(savedFloor);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Floor name must be unique' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// GET All Floors
router.get("/", async (req, res) => {
  try {
    const floors = await Floor.find().populate('rooms').populate('workstations');
    res.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ message: 'Failed to fetch floors' });
  }
});

// GET Floor by ID
router.get("/:id", async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id).populate('rooms').populate('workstations');
    if (!floor) return res.status(404).json({ message: "Floor not found" });
    res.json(floor);
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid floor ID format' });
    } else {
      console.error('Error fetching floor:', error);
      res.status(500).json({ message: 'Failed to fetch floor' });
    }
  }
});

// UPDATE Floor
router.put("/:id", validateFloorData, async (req, res) => {
  try {
    const updatedFloor = await Floor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('rooms').populate('workstations');
    if (!updatedFloor) return res.status(404).json({ message: "Floor not found" });
    res.json(updatedFloor);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Floor name must be unique' });
    } else if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid floor ID format' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// DELETE Floor
router.delete("/:id", async (req, res) => {
  try {
    const deletedFloor = await Floor.findByIdAndDelete(req.params.id);
    if (!deletedFloor) return res.status(404).json({ message: "Floor not found" });
    res.json({ message: "Floor deleted successfully" });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid floor ID format' });
    } else {
      console.error('Error deleting floor:', error);
      res.status(500).json({ message: 'Failed to delete floor' });
    }
  }
});

// Workstation routes under floors
const Workstation = require("../models/Workstation");

// Middleware for validating workstation data
const validateWorkstationData = (req, res, next) => {
  const { workstationId, seatNumber, floorType } = req.body;

  if (!workstationId || typeof workstationId !== 'string' || workstationId.trim().length === 0) {
    return res.status(400).json({ message: 'Workstation ID is required and must be a non-empty string' });
  }

  if (!seatNumber || typeof seatNumber !== 'string' || seatNumber.trim().length === 0) {
    return res.status(400).json({ message: 'Seat Number is required and must be a non-empty string' });
  }

  if (workstationId !== seatNumber) {
    return res.status(400).json({ message: 'Seat Number must be equal to Workstation ID' });
  }

  if (!floorType || typeof floorType !== 'string' || !/^[A-Z]$/.test(floorType)) {
    return res.status(400).json({ message: 'Floor Type must be a single uppercase letter (A-Z)' });
  }

  next();
};

// GET All Workstations
router.get("/workstations", async (req, res) => {
  try {
    const workstations = await Workstation.find().populate('floor').populate('room');
    res.json(workstations);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ message: 'Failed to fetch workstations' });
  }
});

// CREATE Workstation
router.post("/workstations", validateWorkstationData, async (req, res) => {
  try {
    const workstation = new Workstation(req.body);
    const savedWorkstation = await workstation.save();
    res.status(201).json(savedWorkstation);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Workstation ID must be unique' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// UPDATE Workstation
router.put("/workstations/:id", async (req, res) => {
  try {
    const updatedWorkstation = await Workstation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedWorkstation) return res.status(404).json({ message: "Workstation not found" });
    res.json(updatedWorkstation);
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid workstation ID format' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// DELETE Workstation
router.delete("/workstations/:id", async (req, res) => {
  try {
    const deletedWorkstation = await Workstation.findByIdAndDelete(req.params.id);
    if (!deletedWorkstation) return res.status(404).json({ message: "Workstation not found" });
    res.json({ message: "Workstation deleted successfully" });
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid workstation ID format' });
    } else {
      console.error('Error deleting workstation:', error);
      res.status(500).json({ message: 'Failed to delete workstation' });
    }
  }
});

module.exports = router;
