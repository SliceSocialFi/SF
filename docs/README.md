# Documentation Index

This folder contains comprehensive technical documentation for the Slice platform.

## 📚 Documentation Files

### Backend Implementation Guides

#### 1. **BACKEND_RELEASE_AFTER_DEADLINE_IMPLEMENTATION.md**
Complete backend implementation guide for the redesigned `/tasks/:id/release-after-deadline` API endpoint.

**Key Topics:**
- Security-first approach: Backend auto-finds freelancer from database
- Graceful handling of "already settled" blockchain errors
- Database sync logic when escrow already settled on-chain
- Complete error handling guide
- cURL test commands for all scenarios

**When to read:** Backend developers implementing the release-after-deadline feature.

#### 2. **RELEASE_AFTER_DEADLINE_API_REDESIGN.md**
High-level API design specification for the release-after-deadline endpoint.

**Key Topics:**
- Problem statement: Why recipientAddress from client is dangerous
- Solution architecture: Backend-controlled recipient determination
- Complete API specification (endpoints, request/response formats)
- Database schema and SQL queries
- Security improvements comparison (before/after)
- Testing scenarios and migration checklist

**When to read:** Product managers, backend architects, and QA engineers planning the feature.

### Frontend Implementation Guides

#### 3. **DEADLINE_INPUT_ENHANCEMENT.md**
Implementation guide for the flexible deadline input component in task creation.

**Key Topics:**
- Two input modes: Datetime Picker (specific date/time) and Duration (Hours/Days)
- ISO 8601 string conversion for backend compatibility
- React Hook Form integration
- UI/UX features with dark mode support
- Validation and error handling
- Browser compatibility notes
- Testing checklist

**When to read:** Frontend developers working on task creation/editing forms.

#### 4. **DEADLINE_INPUT_VISUAL_GUIDE.md**
Visual reference and UI/UX specification for the DeadlineInput component.

**Key Topics:**
- ASCII mockups of both input modes (Light & Dark mode)
- Real-world use case examples with data flow
- Error state visualizations
- Browser-specific rendering differences
- Accessibility features and keyboard navigation
- Responsive behavior across screen sizes
- Integration examples with different form libraries

**When to read:** Designers, QA engineers, and frontend developers needing visual reference.

---

## 🏗️ Related Documentation

### Root-level Docs

These documentation files are located in the project root and provide broader context:

#### **TECHNICAL_DOCUMENTATION.md** (Root)
Complete system architecture and technical implementation guide.

**Sections:**
1. System Overview
2. Workflow Analysis (Task creation, Application, Escrow flows)
3. Technical Implementation (Frontend stack, Web3 integration, Smart contracts)
4. Component Architecture
5. Database Schema
6. API Specifications

**When to read:** New developers onboarding, understanding full system architecture.

#### **TASK_BACKEND_INTEGRATION.md** (`apps/web/`)
Frontend integration guide for backend API (slice-api).

**Topics:**
- Environment configuration
- JWT authentication flow
- API endpoints (Tasks, Users, Applications)
- Testing with cURL commands
- Debugging checklist

**When to read:** Frontend developers integrating with backend APIs.

#### **NOTIFICATION_SYSTEM.md** (Root)
Complete notification system documentation.

**Topics:**
- Dedicated notifications page architecture
- Polling mechanism for unread count
- Page-based pagination
- Mark as read functionality
- Navigation rules for task notifications

**When to read:** Developers working on notification features.

#### **TASK_DETAIL_NAVIGATION.md** (Root)
Task detail page and navigation implementation guide.

**Topics:**
- TaskDetailPage component architecture
- Notification-to-task navigation flow
- Backend API integration
- UI/UX features

**When to read:** Frontend developers working on task detail views.

#### **LENS_APP_CONFIGURATION_ANALYSIS.md** (Root)
Comprehensive analysis of Lens Protocol integration.

**Topics:**
- Hey app configuration (contract addresses)
- Lens SDK & libraries usage
- Authentication flow (SIWE)
- Apollo Client setup
- Web3 Provider configuration

**When to read:** Developers working with Lens Protocol integration.

---

## 🎯 Quick Start Guides

### For Backend Developers

1. Start with **RELEASE_AFTER_DEADLINE_API_REDESIGN.md** to understand requirements
2. Read **BACKEND_RELEASE_AFTER_DEADLINE_IMPLEMENTATION.md** for implementation details
3. Reference **TECHNICAL_DOCUMENTATION.md** for database schema and overall architecture
4. Use **TASK_BACKEND_INTEGRATION.md** for API endpoint patterns

### For Frontend Developers

1. Read **TECHNICAL_DOCUMENTATION.md** sections 3.1-3.2 (Frontend stack, Web3 integration)
2. Follow **TASK_BACKEND_INTEGRATION.md** for API integration
3. Reference **NOTIFICATION_SYSTEM.md** for notification flows
4. Check **TASK_DETAIL_NAVIGATION.md** for task page implementation

### For Product/QA

1. Start with **RELEASE_AFTER_DEADLINE_API_REDESIGN.md** for feature overview
2. Review testing scenarios in all docs
3. Use **TECHNICAL_DOCUMENTATION.md** section 2 for user workflow understanding

---

## 🔄 Document Updates

### Recent Changes (November 27, 2025)

#### Removed Files
- ~~`ESCROW_SYSTEM.md`~~ - Outdated, contained incorrect contract addresses and deprecated patterns
- ~~`ESCROW_RELEASE_SECURITY_REFACTOR.md`~~ - Superseded by more comprehensive docs

#### Current Files
- ✅ **BACKEND_RELEASE_AFTER_DEADLINE_IMPLEMENTATION.md** - Up-to-date, production-ready
- ✅ **RELEASE_AFTER_DEADLINE_API_REDESIGN.md** - Complete specification

---

## 🤝 Contributing to Documentation

When updating docs, follow these guidelines:

### File Naming
- Use `SCREAMING_SNAKE_CASE.md` for technical docs
- Use descriptive names (e.g., `BACKEND_RELEASE_AFTER_DEADLINE_IMPLEMENTATION.md`)
- Prefix with component/feature name if specific (e.g., `NOTIFICATION_SYSTEM.md`)

### Structure
- Start with overview/problem statement
- Include clear sections with headers
- Add code examples with syntax highlighting
- Include diagrams for complex flows (Mermaid preferred)
- End with testing guide and related links

### Maintenance
- Update "Last Updated" date when making changes
- Mark deprecated information clearly
- Cross-reference related documents
- Keep this README.md index up to date

---

## 📞 Getting Help

- **General questions:** Check **TECHNICAL_DOCUMENTATION.md** first
- **API integration:** See **TASK_BACKEND_INTEGRATION.md**
- **Specific features:** Use this README index to find relevant doc
- **Not found?** Create a GitHub issue or contact the team

---

**Last Updated:** November 27, 2025  
**Maintained by:** Development Team
