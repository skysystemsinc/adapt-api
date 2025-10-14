# Forms Module

A NestJS module for managing dynamic forms created from the frontend form builder.

## Overview

This module provides a complete CRUD API for dynamic forms, supporting both admin operations and public form access. It stores the entire form structure as JSON in a PostgreSQL JSONB column, making it flexible and ready for future expansions.

## Features

- ✅ Create, Read, Update, Delete forms
- ✅ Auto-generate unique slugs from form titles
- ✅ Store complete form schema as JSONB
- ✅ Admin routes for form management
- ✅ Public routes for form retrieval by slug
- ✅ Draft/Published status support
- ✅ Public/Private form visibility
- ✅ Full Swagger API documentation
- ✅ Comprehensive error handling

## Database Schema

### Table: `forms`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR | Form title |
| slug | VARCHAR | Unique URL-friendly identifier |
| description | TEXT | Optional form description |
| schema | JSONB | Complete form JSON from frontend |
| isPublic | BOOLEAN | Whether form is publicly accessible (default: true) |
| status | ENUM | 'draft' or 'published' (default: 'published') |
| createdBy | UUID | ID of user who created the form (nullable) |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

### Indexes
- Unique index on `slug`
- Index on `status`
- Index on `isPublic`

## API Endpoints

### Admin Endpoints (Prefix: `/api/admin/forms`)

#### Create Form
```
POST /api/admin/forms
```
**Body:**
```json
{
  "title": "Registration Form",
  "slug": "registration-form",  // Optional - auto-generated if not provided
  "description": "User registration form",  // Optional
  "schema": {
    "id": "form-1",
    "title": "Registration Form",
    "steps": [...]
  },
  "isPublic": true,  // Optional - default: true
  "status": "published",  // Optional - default: "published"
  "createdBy": "uuid"  // Optional
}
```

#### Get All Forms
```
GET /api/admin/forms
```

#### Get Form by ID
```
GET /api/admin/forms/:id
```

#### Update Form
```
PUT /api/admin/forms/:id
```
**Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "schema": { ... },
  "isPublic": false,
  "status": "draft"
}
```

#### Delete Form
```
DELETE /api/admin/forms/:id
```

### Public Endpoints (Prefix: `/api/forms`)

#### Get Public Form by Slug
```
GET /api/forms/:slug
```
Returns form only if `isPublic = true`

## Form Schema Structure

The `schema` field stores the complete form JSON from the frontend builder:

```json
{
  "id": "registration",
  "title": "Registration Form",
  "description": "Sign up for our platform",
  "steps": [
    {
      "id": "step-1",
      "title": "Personal Information",
      "fields": [
        {
          "id": "field-1",
          "type": "text",
          "label": "Full Name",
          "required": true,
          "placeholder": "Enter your name"
        },
        {
          "id": "heading-1",
          "type": "heading",
          "title": "Contact Details"
        }
      ]
    }
  ]
}
```

## Usage Examples

### Create a Form
```typescript
const newForm = {
  title: "Contact Form",
  description: "Get in touch with us",
  schema: {
    id: "contact",
    title: "Contact Form",
    steps: [
      {
        id: "step-1",
        title: "Your Details",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Name",
            required: true
          },
          {
            id: "email",
            type: "email",
            label: "Email",
            required: true
          }
        ]
      }
    ]
  },
  isPublic: true,
  status: "published"
};
```

### Slug Generation
If no slug is provided, it's auto-generated from the title:
- "Registration Form" → `registration-form`
- "Contact Us!" → `contact-us`
- "Apply Now - 2024" → `apply-now-2024`

## Module Structure

```
modules/forms/
├── dto/
│   ├── create-form.dto.ts       # Validation for creating forms
│   ├── update-form.dto.ts       # Validation for updating forms
│   └── form-response.dto.ts     # Response formatting
├── entities/
│   └── form.entity.ts           # TypeORM entity
├── forms.controller.ts          # API endpoints
├── forms.service.ts             # Business logic
├── forms.module.ts              # Module configuration
└── README.md                    # This file
```

## Error Handling

The module provides clear error messages:

- **404 Not Found:** Form doesn't exist
- **409 Conflict:** Slug already exists
- **400 Bad Request:** Invalid data provided

## Future Enhancements (Planned)

- [ ] Form versioning
- [ ] Form submission storage
- [ ] Form analytics
- [ ] Soft delete support
- [ ] Form templates
- [ ] Form duplication
- [ ] Authentication guards
- [ ] Role-based access control

## Migration

Run the migration to create the database table:

```bash
npm run typeorm migration:run
```

## Testing

The module is ready for:
- Unit tests (service methods)
- Integration tests (API endpoints)
- E2E tests (full flow)

## Notes

- Auth guards are not implemented yet (Phase 1)
- All endpoints are currently public
- Auth will be added in a future phase
- The module is designed to be easily extended for versioning and submissions

