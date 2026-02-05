# Employee Bulk Upload - Enhanced with Workstation Mapping

## New Fields Added

The employee bulk upload now supports the following additional fields:

### Required Fields
- **EMP ID**: Unique employee identifier (Required)
- **Full Name**: Employee's full name (Required)

### Optional Fields
- **Email**: Employee email address
- **Mobile**: Employee mobile/phone number
- **Department**: Primary department (e.g., Engineering, HR, Finance)
- **Sub Department**: Sub-department or team (e.g., Software Development, Talent Acquisition)
- **Workstation ID**: Desk/seat identifier for floor map integration (e.g., WS-3A-101, WS-2B-205)

## Workstation ID Format

Workstation IDs follow a structured format for floor mapping:
- **WS-3A-101**: Wing/Block 3A, Seat 101
- **WS-2B-205**: Wing/Block 2B, Seat 205

You can customize this format based on your organization's floor plan structure.

## Field Mapping Flexibility

The bulk upload supports flexible column naming. Any of these variations will work:

### Workstation Field
- "Workstation ID"
- "Workstation"
- "Desk ID"
- "Desk"
- "Seat ID"
- "Seat"

### Email Field
- "Email"
- "Email Address"
- "E-mail"

### Mobile Field
- "Mobile"
- "Phone"
- "Mobile Number"
- "Phone Number"
- "Contact"
- "Contact Number"

### Department Field
- "Department"
- "Dept"

### Sub Department Field
- "Sub Department"
- "SubDepartment"
- "Sub Dept"

## Sample Files

- **CSV**: `sample_employees_with_workstations.csv`
- **XLSX**: `sample_employees_with_workstations.xlsx`

Both files contain 25 sample employees with complete information including workstation assignments.

## Database Schema Updates

### Employee Model
```javascript
{
  empId: String (unique, required),
  fullName: String (required),
  email: String,
  mobile: String,
  department: String,
  subDepartment: String,
  workstationId: String,  // NEW: Links to Desk collection
  role: String (Admin/Employee),
  isActive: Boolean
}
```

### Desk Model (Existing)
```javascript
{
  workstationId: String (unique),
  empId: String,  // Links to Employee
  userName: String,
  block: String,
  status: String (Available/Occupied)
}
```

## Integration with Floor Map

When employees are uploaded with workstation IDs:
1. Employee record is created/updated with the workstationId field
2. Floor map can query employees by workstationId to show seating assignments
3. Desk availability status can be synchronized with employee assignments

## Usage

1. Download the sample file (`sample_employees_with_workstations.xlsx` or `.csv`)
2. Fill in your employee data
3. Include Workstation ID column if you want to assign seats
4. Upload via the Employees page bulk upload feature
5. System will create or update employees with all provided information

## Notes

- Empty or invalid values (NA, N/A, 0, -, empty) are skipped and won't overwrite existing data
- Duplicate EMP IDs will update the existing employee record
- Workstation ID is optional - employees without workstations will have empty workstationId field
- For floor map integration, ensure Workstation IDs match your Desk collection records
