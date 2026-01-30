# Backend MongoDB Migration TODO

- [x] Update backend/config/db.js to use Mongoose for MongoDB connection instead of Sequelize/MySQL
- [x] Update backend/models/Asset.js to convert from Sequelize model to Mongoose schema
- [x] Update backend/package.json to add mongoose dependency and remove sequelize/mysql2
- [x] Update backend/server.js to use the new MongoDB connection
- [ ] Test the backend to ensure it runs without errors
