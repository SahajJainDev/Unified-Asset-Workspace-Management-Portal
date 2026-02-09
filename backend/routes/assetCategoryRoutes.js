const express = require('express');
const router = express.Router();
const AssetCategory = require('../models/AssetCategory');

// Default categories with icons (seeded on first request if empty)
const DEFAULT_CATEGORIES = [
  { name: 'Laptop', icon: 'laptop_mac', isDefault: true },
  { name: 'Monitor', icon: 'desktop_windows', isDefault: true },
  { name: 'Mouse', icon: 'mouse', isDefault: true },
  { name: 'Keyboard', icon: 'keyboard', isDefault: true },
  { name: 'Smartphone', icon: 'smartphone', isDefault: true },
  { name: 'Tablet', icon: 'tablet_mac', isDefault: true },
  { name: 'Other', icon: 'devices', isDefault: true }
];

// Seed defaults if collection is empty
const seedDefaults = async () => {
  const count = await AssetCategory.countDocuments();
  if (count === 0) {
    await AssetCategory.insertMany(DEFAULT_CATEGORIES);
    console.log('Default asset categories seeded');
  }
};

// GET all categories (active only by default)
router.get('/', async (req, res) => {
  try {
    await seedDefaults();
    const includeInactive = req.query.all === 'true';
    const filter = includeInactive ? {} : { isActive: true };
    const categories = await AssetCategory.find(filter).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// GET category names only (for validation)
router.get('/names', async (req, res) => {
  try {
    await seedDefaults();
    const categories = await AssetCategory.find({ isActive: true }).select('name');
    res.json(categories.map(c => c.name));
  } catch (error) {
    console.error('Error fetching category names:', error);
    res.status(500).json({ message: 'Failed to fetch category names' });
  }
});

// POST create a new category
router.post('/', async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check for duplicates (case-insensitive)
    const existing = await AssetCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      if (!existing.isActive) {
        // Re-activate if it was deactivated
        existing.isActive = true;
        existing.icon = icon || existing.icon;
        await existing.save();
        return res.json(existing);
      }
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = new AssetCategory({
      name: name.trim(),
      icon: icon || 'devices',
      isDefault: false,
      isActive: true
    });

    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// PATCH update a category
router.patch('/:id', async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name !== undefined) category.name = name.trim();
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// DELETE a category (soft-delete: set isActive false)
router.delete('/:id', async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(403).json({ message: 'Cannot delete default categories. You can deactivate them instead.' });
    }

    category.isActive = false;
    await category.save();
    res.json({ message: 'Category deactivated', category });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
