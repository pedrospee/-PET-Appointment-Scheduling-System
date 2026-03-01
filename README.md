# &PET — Appointment Scheduling System

Modular appointment scheduling system built with vanilla JavaScript (ES Modules), featuring accessibility-first modal design, conflict prevention, and REST API integration.

This project simulates a real-world appointment workflow for a pet service business, including time validation, conflict prevention, optimistic UI updates, and API persistence using a mock server.


**Overview**

&Pet is a client-side application that allows users to:
	•	View daily appointments grouped by time period
	•	Create new appointments through an accessible modal interface
	•	Prevent scheduling conflicts
	•	Block past dates and times
	•	Persist data using a REST-like API (json-server)
	•	Delete appointments with optimistic UI updates

The project focuses on architecture clarity, separation of concerns, and predictable UI behavior.


**Tech Stack**

	•	JavaScript (ES Modules)
	•	Webpack 5
	•	Babel
	•	dayjs
	•	nanoid
	•	json-server (mock REST API)

No UI frameworks were used. All DOM rendering is implemented with native APIs.


**Architecture**

The project follows a modular structure to separate responsibilities clearly:

```
src/
 ├── libs/               # Utilities (date normalization, time comparison)
 ├── services/           # API layer (fetch abstraction, CRUD operations)
 ├── modules/
 │    ├── form/          # Form validation, masking, submission
 │    ├── schedules/     # State management and rendering
 │    └── page-load.js   # Application bootstrap
 ├── styles/             # Modular CSS files
 └── main.js             # Entry point
```


**Engineering Highlights**

	- Modular ES Modules architecture (no framework dependency)
	- Deterministic rendering strategy
	- Optimistic UI with rollback handling
	- Client-side state per date
	- Defensive validation layer
	- Accessible modal with focus trap
	- API abstraction layer


**Design Principles**

	•	Clear separation between business logic and DOM manipulation
	•	State stored in memory per date
	•	Deterministic rendering (no hidden implicit mutations)
	•	Defensive validation on both UI interaction and submit
	•	Accessibility-first approach (aria attributes, focus management, live regions)
	

**Features**
```
1. Daily Agenda View
	•	Appointments are grouped into:
	•	Morning (09:00–12:00)
	•	Afternoon (13:00–18:00)
	•	Night (19:00–22:00)
	•	Sorted by time
	•	Dynamically rendered using safe DOM APIs (no innerHTML for user content)

2. Appointment Creation
	•	Accessible modal dialog
	•	Scroll lock and focus trapping
	•	Field-level validation
	•	Automatic phone mask formatting
	•	Time range enforcement
	•	Prevention of past scheduling
	•	Conflict detection per date and time

3. Appointment Removal
	•	Optimistic UI update
	•	API deletion
	•	Rollback on failure
```


**Validation Rules**

	•	Required fields: tutor, pet, phone, service, date, time
	•	Phone format: (00)0 0000-0000 (11 digits enforced)
	•	No past dates allowed
	•	No past time allowed when scheduling for today
	•	No duplicate appointments at the same time on the same date
	•	Only allowed scheduling windows:
  	•	09:00–12:00
  	•	13:00–18:00
  	•	19:00–22:00


**Accessibility Considerations**

	•	aria-modal and role=“dialog”
	•	Focus trap inside modal
	•	ESC to close modal
	•	Overlay click closes modal
	•	aria-live region for global alerts
	•	Per-field aria-describedby for validation errors
	•	Visible keyboard focus indicators


**Development Setup**

Install dependencies
```
npm install
```

Start development environment
```
npm run start
```

This runs:

	•	Webpack Dev Server → http://localhost:3000
	•	json-server → http://localhost:3333

API endpoint:
```
GET    /appointments?date=YYYY-MM-DD&_sort=time
POST   /appointments
DELETE /appointments/:id
```


**Data Model**
```
{
  "id": "string",
  "tutor": "string",
  "pet": "string",
  "phone": "string",
  "service": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm"
}
```


**Why This Project Matters**

This project demonstrates:

	•	Strong modular architecture without frameworks
	•	Practical front-end state management
	•	Real-world validation logic
	•	Accessibility-first implementation
	•	API abstraction patterns
	•	Defensive UI programming
	•	Clean code and structured comments

It intentionally avoids UI libraries to show control over core JavaScript concepts and DOM manipulation.


**Future Improvements**

Potential production-level extensions:

	•	Time-slot picker component
	•	Real backend integration
	•	Authentication
	•	Pagination and filtering
	•	Unit and integration testing
	•	E2E test coverage
	•	CI/CD pipeline
	•	Dockerized environment


**Author**

Pedro — Automation Manager with a focus on scalable front-end architecture and modular JavaScript applications.
