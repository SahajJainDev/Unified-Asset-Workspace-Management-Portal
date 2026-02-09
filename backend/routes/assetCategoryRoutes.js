const express = require('express');
const router = express.Router();
const AssetCategory = require('../models/AssetCategory');
const Asset = require('../models/Asset');

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

// GET all categories (with asset counts)
router.get('/', async (req, res) => {
  try {
    await seedDefaults();
    const categories = await AssetCategory.find({}).sort({ isDefault: -1, name: 1 });

    // Get asset counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const assetCount = await Asset.countDocuments({ assetType: cat.name });
        return { ...cat.toObject(), assetCount };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// GET category names only (for validation/dropdowns)
router.get('/names', async (req, res) => {
  try {
    await seedDefaults();
    const categories = await AssetCategory.find({}).select('name');
    res.json(categories.map(c => c.name));
  } catch (error) {
    console.error('Error fetching category names:', error);
    res.status(500).json({ message: 'Failed to fetch category names' });
  }
});

// POST create a new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check for duplicates (case-insensitive)
    const existing = await AssetCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = new AssetCategory({
      name: name.trim(),
      icon: 'devices',
      isDefault: false,
      isActive: true
    });

    const saved = await category.save();
    res.status(201).json({ ...saved.toObject(), assetCount: 0 });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// PATCH update a category name
router.patch('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name !== undefined && name.trim()) {
      // Check for duplicates (case-insensitive), excluding self
      const existing = await AssetCategory.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: category._id }
      });
      if (existing) {
        return res.status(409).json({ message: 'A category with that name already exists' });
      }

      // If renaming, also update all assets with the old category name
      const oldName = category.name;
      category.name = name.trim();
      await category.save();

      if (oldName !== name.trim()) {
        await Asset.updateMany({ assetType: oldName }, { assetType: name.trim() });
      }
    }

    const assetCount = await Asset.countDocuments({ assetType: category.name });
    res.json({ ...category.toObject(), assetCount });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// DELETE a category (hard delete — only if no assets use it)
router.delete('/:id', async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if any assets use this category
    const assetCount = await Asset.countDocuments({ assetType: category.name });
    if (assetCount > 0) {
      return res.status(400).json({
        message: `Cannot delete "${category.name}" — ${assetCount} asset(s) are using this category. Reassign them first.`,
        assetCount
      });
    }

    await AssetCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted permanently' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// POST reassign assets from one category to another, then delete the source category
router.post('/:id/reassign-and-delete', async (req, res) => {
  try {
    const { targetCategoryId } = req.body;
    const sourceCategory = await AssetCategory.findById(req.params.id);
    if (!sourceCategory) {
      return res.status(404).json({ message: 'Source category not found' });
    }

    const targetCategory = await AssetCategory.findById(targetCategoryId);
    if (!targetCategory) {
      return res.status(404).json({ message: 'Target category not found' });
    }

    if (sourceCategory._id.equals(targetCategory._id)) {
      return res.status(400).json({ message: 'Source and target category cannot be the same' });
    }

    // Reassign all assets from source to target
    const result = await Asset.updateMany(
      { assetType: sourceCategory.name },
      { assetType: targetCategory.name }
    );

    // Delete the source category
    await AssetCategory.findByIdAndDelete(req.params.id);

    res.json({
      message: `Reassigned ${result.modifiedCount} asset(s) to "${targetCategory.name}" and deleted "${sourceCategory.name}"`,
      reassignedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error reassigning and deleting category:', error);
    res.status(500).json({ message: 'Failed to reassign and delete category' });
  }
});

module.exports = router;
