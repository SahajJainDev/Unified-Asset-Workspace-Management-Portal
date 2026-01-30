# TODO: Fix License API Validation Error

## Tasks
- [x] Update backend/models/License.js to make softwareName optional
- [x] Update backend/routes/licenseRoutes.js to make softwareName optional in validation
- [x] Update components/AddLicenseModal.tsx to remove required attribute from softwareName input
- [x] Update services/apiService.ts to make softwareName optional in License interface
- [x] Test the API with curl to ensure it accepts requests without softwareName
