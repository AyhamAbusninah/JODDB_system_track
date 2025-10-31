# JODDB Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Components](#components)
6. [Pages & Routing](#pages--routing)
7. [State Management](#state-management)
8. [Services & API Integration](#services--api-integration)
9. [Types & Interfaces](#types--interfaces)
10. [Setup & Installation](#setup--installation)
11. [Development Guide](#development-guide)
12. [Build & Deployment](#build--deployment)

---

## Overview

JODDB Frontend is a modern, responsive React application built with TypeScript and Tailwind CSS. It provides role-based dashboards for managing job orders, tasks, quality inspections, and performance metrics in a manufacturing/assembly environment.

**Purpose**: Deliver an intuitive, role-specific user interface for technicians, quality inspectors, supervisors, planning engineers, and testers to efficiently manage their workflows.

---

## Technology Stack

### Core Technologies
- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **Styling**: Tailwind CSS 4.1.16
- **HTTP Client**: Axios 1.6.5
- **Icons**: Lucide React 0.548.0
- **PDF Generation**: jsPDF 3.0.3 + jspdf-autotable 5.0.2

### Development Tools
```json
{
  "typescript": "~5.9.3",
  "eslint": "^9.36.0",
  "typescript-eslint": "^8.45.0",
  "autoprefixer": "^10.4.21",
  "vite": "^7.1.7"
}
```

---

## Project Structure

```
frontend/
├── public/
│   └── vite.svg               # Static assets
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── App.css               # Global styles
│   ├── index.css             # Tailwind imports
│   ├── components/           # Reusable components
│   │   ├── BackToTop.tsx
│   │   ├── CompletionReportDialog.tsx
│   │   ├── Dialog.tsx
│   │   ├── Header.tsx
│   │   ├── JobItem.tsx
│   │   ├── JobOrdersView.tsx
│   │   ├── LoginView.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── TaskSelectionDialog.tsx
│   │   ├── TechnicianTaskCard.tsx
│   │   ├── Toast.tsx
│   │   ├── WorkTimingDetailsDialog.tsx
│   │   ├── planner/          # Planner-specific components
│   │   ├── qa/               # Quality assurance components
│   │   ├── quality/          # Quality inspector components
│   │   ├── supervisor/       # Supervisor-specific components
│   │   ├── technician/       # Technician-specific components
│   │   ├── test-technician/  # Test technician components
│   │   └── tester/           # Tester components
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── ToastContext.tsx  # Toast notifications
│   ├── data/                 # Mock data (for development)
│   │   └── plannerMockData.ts
│   ├── pages/                # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── JobsPage.tsx
│   │   ├── JobTemplatesPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PlannerPage.tsx
│   │   ├── QualityPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── SupervisorPage.tsx
│   │   ├── TaskPage.tsx
│   │   ├── TechnicianPage.tsx
│   │   ├── TesterPage.tsx
│   │   └── TestTechnicianPage.tsx
│   ├── services/             # API integration layer
│   │   └── api.ts
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   └── utils/                # Utility functions
├── eslint.config.js          # ESLint configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
└── package.json              # Dependencies and scripts
```

---

## Architecture

### Design Patterns

#### 1. Component-Based Architecture
- **Atomic Design**: Components organized from atoms to organisms
- **Role-Based Components**: Dedicated component folders per user role
- **Shared Components**: Reusable UI elements in root components/

#### 2. Context API for State Management
```
AuthContext: Global authentication state
ToastContext: Application-wide notifications
```

#### 3. Service Layer Pattern
- API calls abstracted in `services/api.ts`
- Centralized HTTP client configuration
- Automatic token management and refresh

#### 4. Protected Routes
- Role-based route protection
- Automatic redirection for unauthorized access
- Persistent authentication state

### Application Flow

```
User Login → AuthContext Stores Token & User
    ↓
Role-Based Redirect (Planning/Supervisor/Technician/etc.)
    ↓
Protected Route Validation
    ↓
Role-Specific Dashboard
    ↓
API Calls via Axios (with auto token injection)
    ↓
UI Updates with Data
```

---

## Components

### Shared Components

#### Dialog
Generic modal dialog component.

**Props**:
```typescript
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}
```

**Usage**:
```tsx
<Dialog isOpen={isOpen} onClose={handleClose} title="Edit Task">
  <TaskForm onSubmit={handleSubmit} />
</Dialog>
```

#### Header
Application header with navigation and user menu.

**Props**:
```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  onLogout: () => void;
}
```

#### Toast
Notification component for user feedback.

**Context API**:
```typescript
const { showToast } = useToast();
showToast('Task completed successfully', 'success');
```

**Types**: `success`, `error`, `warning`, `info`

#### BackToTop
Floating button to scroll to top (appears on scroll).

**Features**:
- Auto-hide when at top
- Smooth scroll animation
- Mobile-friendly

#### MobileBottomNav
Mobile navigation bar for small screens.

**Features**:
- Auto-hide on desktop
- Role-specific navigation items
- Active route highlighting

### Role-Specific Component Structure

#### Planner Components (`components/planner/`)
- **PlannerDashboard**: Main dashboard with KPIs and analytics
- **PlannerKPIs**: Key performance indicators
- **JobOrdersPanel**: Job order management interface
- **JobOrderDetails**: Detailed view of job order
- **TaskReviewQueue**: Pending task approvals
- **TaskApprovalDrawer**: Task approval/rejection interface
- **CreateJobOrderModal**: New job order creation form
- **CreateTasksModal**: Manual task creation
- **AddTasksFromJobModal**: Create tasks from job template
- **UserManagement**: User CRUD operations
- **CreateUserModal**: New user creation form
- **EditUserModal**: User editing form
- **AnalyticsDashboard**: Charts and analytics

#### Supervisor Components (`components/supervisor/`)
- **SupervisorDashboard**: Main supervisor dashboard
- **DashboardKPIs**: Performance metrics overview
- **ReviewQueue**: Items pending supervisor review
- **ReviewDrawer**: Review interface with decision options
- **QAReviewDialog**: Quality assurance review details
- **ReportsView**: Technician reports listing
- **ReportDetailDialog**: Detailed report view
- **JobOrdersSummary**: Job order status overview
- **AlertsCenter**: System alerts and warnings
- **AlertsPanel**: Alert management panel
- **TechnicianPerformanceTable**: Technician metrics table

#### Technician Components (`components/technician/`)
- **TechnicianDashboard**: Main technician interface
- **TechnicianTaskCard**: Individual task card
- **TaskListView**: Available tasks listing
- **ActiveTaskView**: Currently active task details
- **CompletionReportDialog**: Task completion form

#### Quality Inspector Components (`components/quality/`)
- **QualityInspectorDashboard**: QA dashboard
- **InspectionTaskCard**: Task awaiting inspection
- **InspectionHistoryList**: Past inspections
- **QualityMetricsCard**: QA performance metrics

#### QA Components (`components/qa/`)
- **InspectionDialog**: Inspection decision interface

#### Tester Components (`components/tester/`)
- Tester-specific testing task components

#### Test Technician Components (`components/test-technician/`)
- **TestTechnicianDashboard**: Testing technician interface

---

## Pages & Routing

### Route Structure

```typescript
<Router>
  <Routes>
    <Route path="/" element={<LoginPage />} />
    
    {/* Planning Engineer */}
    <Route path="/planner" element={<ProtectedRoute allowedRoles={['planning']} />}>
      <Route index element={<PlannerPage />} />
    </Route>
    <Route path="/jobs" element={<JobTemplatesPage />} />
    
    {/* Supervisor */}
    <Route path="/supervisor" element={<SupervisorPage />} />
    
    {/* Technician */}
    <Route path="/technician" element={<TechnicianPage />} />
    
    {/* Quality Inspector */}
    <Route path="/quality" element={<QualityPage />} />
    
    {/* Tester */}
    <Route path="/tester" element={<TesterPage />} />
    
    {/* Test Technician */}
    <Route path="/test-technician" element={<TestTechnicianPage />} />
    
    {/* Shared */}
    <Route path="/tasks" element={<TaskPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
  </Routes>
</Router>
```

### Protected Route Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
};
```

### Page Descriptions

#### LoginPage
- Username/password authentication
- Role-based redirect after login
- Error handling and validation
- Token storage in localStorage

#### PlannerPage
Full planning engineer dashboard with:
- KPI cards (job orders, technicians, utilization)
- Job orders panel with filtering
- Task approval queue
- User management
- Analytics charts
- Data import/export

#### SupervisorPage
Supervisor oversight dashboard with:
- Performance metrics
- Review queue (inspections pending approval)
- QA review interface
- Technician performance table
- Alerts center
- Job order summary

#### TechnicianPage
Technician work interface with:
- Available tasks list
- Active task tracking
- Task start/end controls
- Time tracking
- Completion report submission
- Personal performance metrics

#### QualityPage
Quality inspector interface with:
- Tasks pending inspection
- Inspection form (accept/reject)
- Inspection history
- Quality metrics
- Comments and notes

#### JobTemplatesPage
Job template management (Planning only):
- List all job templates
- Create new job with processes
- Edit job details
- Delete jobs
- View process workflows

#### SettingsPage
User settings and preferences:
- Profile information
- Password change
- Notification preferences
- Theme settings

---

## State Management

### AuthContext

**Location**: `src/contexts/AuthContext.tsx`

**State**:
```typescript
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Usage**:
```tsx
const { user, login, logout, isAuthenticated } = useAuth();

// Login
const success = await login('username', 'password');

// Logout
logout();

// Access user data
console.log(user.role, user.name);
```

**Features**:
- Persistent authentication (localStorage)
- Automatic session restoration
- Token management
- Role information

### ToastContext

**Location**: `src/contexts/ToastContext.tsx`

**State**:
```typescript
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';
```

**Usage**:
```tsx
const { showToast } = useToast();

showToast('Operation successful!', 'success');
showToast('An error occurred', 'error');
showToast('Please review this item', 'warning');
showToast('Data loaded', 'info');
```

**Features**:
- Auto-dismiss (configurable duration)
- Multiple toast stacking
- Type-based styling
- Smooth animations

### Local Component State

Most components use React hooks for local state:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## Services & API Integration

### API Service Architecture

**Location**: `src/services/api.ts`

### Axios Instance Configuration

```typescript
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Request Interceptor (Token Injection)

```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor (Token Refresh)

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await axios.post('/auth/token/refresh/', { refresh: refreshToken });
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      
      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return axiosInstance(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### API Modules

#### authAPI
Authentication operations:
```typescript
authAPI.login(username, password): Promise<LoginResponse>
authAPI.refreshToken(): Promise<{ access: string }>
authAPI.logout(): Promise<void>
```

#### taskAPI
Task management:
```typescript
taskAPI.getTasks(): Promise<Task[]>
taskAPI.getTask(taskId): Promise<Task>
taskAPI.createTask(taskData): Promise<Task>
taskAPI.startTask(taskId): Promise<Task>
taskAPI.endTask(taskId, notes): Promise<Task>
```

#### jobOrderAPI
Job order operations:
```typescript
jobOrderAPI.getJobOrders(): Promise<JobOrder[]>
jobOrderAPI.getJobOrder(id): Promise<JobOrder>
jobOrderAPI.createJobOrder(data): Promise<JobOrder>
jobOrderAPI.importJobOrders(file): Promise<ImportSummary>
```

#### jobAPI
Job template operations:
```typescript
jobAPI.getJobs(): Promise<Job[]>
jobAPI.getJob(id): Promise<Job>
jobAPI.createJob(data): Promise<Job>
jobAPI.updateJob(id, data): Promise<Job>
jobAPI.deleteJob(id): Promise<void>
```

#### processAPI
Process management:
```typescript
processAPI.getProcesses(jobId?): Promise<Process[]>
processAPI.createProcess(data): Promise<Process>
processAPI.updateProcess(id, data): Promise<Process>
processAPI.deleteProcess(id): Promise<void>
```

#### inspectionAPI
Quality inspections:
```typescript
inspectionAPI.createInspection(data): Promise<Inspection>
inspectionAPI.getInspections(): Promise<Inspection[]>
```

#### supervisorReviewAPI
Supervisor reviews:
```typescript
supervisorReviewAPI.createReview(data): Promise<SupervisorReview>
supervisorReviewAPI.getReviews(): Promise<SupervisorReview[]>
```

#### metricsAPI
Performance metrics:
```typescript
metricsAPI.getTechnicianMetrics(technicianId, date?): Promise<TechnicianMetrics>
metricsAPI.getJobOrderProgress(jobOrderId): Promise<JobOrderProgress>
metricsAPI.getPlannerStatistics(): Promise<PlannerStatistics>
```

#### userAPI
User management:
```typescript
userAPI.getUsers(): Promise<User[]>
userAPI.createUser(data): Promise<User>
userAPI.updateUser(id, data): Promise<User>
userAPI.deleteUser(id): Promise<void>
```

#### exportAPI
Data export:
```typescript
exportAPI.exportDailyReport(date?, format?): Promise<Blob>
exportAPI.exportJobOrderPDF(jobOrderId): Promise<Blob>
```

### Usage Example

```tsx
import { api } from '../services/api';

const MyComponent = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await api.tasks.getTasks();
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  return <TaskList tasks={tasks} />;
};
```

---

## Types & Interfaces

**Location**: `src/types/index.ts`

### Core Types

#### User
```typescript
interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  username?: string;
}

type UserRole = 'technician' | 'supervisor' | 'planning' | 'quality' | 'test_technician' | 'tester';
```

#### JobOrder
```typescript
interface JobOrder {
  id: string;
  title: string;
  description: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  detailsOfWork: string;
}
```

#### PlannerJobOrder (Extended)
```typescript
interface PlannerJobOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  dueDate: string;
  createdBy: string;
  totalDevices: number;
  devicesCompleted: number;
  devicesRejected: number;
  progressPercent: number;
  efficiency: number;
  status: 'active' | 'completed' | 'overdue' | 'archived';
  taskStandardTime: number;
}
```

#### PlannerTask
```typescript
interface PlannerTask {
  id: string;
  jobOrderCode: string;
  jobOrderId: string;
  deviceSerial: string;
  technicianName: string;
  operationName: string;
  status: 'available' | 'in-progress' | 'done' | 'pending-approval' | 'approved' | 'rejected';
  standardTime: number;
  actualTime: number;
  efficiency: number;
  startTime: string;
  endTime: string;
  notes: string;
  submittedAt: string;
}
```

#### TechnicianMetrics
```typescript
interface TechnicianMetrics {
  technicianId: string;
  technicianName: string;
  productivity: number;
  efficiency: number;
  utilization: number;
  tasksCompleted: number;
  averageTimePerTask: number;
}
```

#### QATask & QAInspection
```typescript
interface QATask {
  id: string;
  operationName: string;
  deviceSerial: string;
  technicianName: string;
  jobOrderCode: string;
  status: 'pending_qa' | 'done';
  qaDecision?: 'accepted' | 'rejected';
  qaComments?: string;
  qaInspectedAt?: string;
}

interface QAInspection {
  id: string;
  taskId: string;
  deviceSerial: string;
  jobOrderCode: string;
  technicianName: string;
  operationName: string;
  decision: 'accepted' | 'rejected';
  comments: string;
  inspectorId: string;
  inspectorName: string;
  inspectedAt: string;
}
```

#### Alert
```typescript
interface Alert {
  id: string;
  type: 'performance' | 'deadline' | 'data-integrity';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  relatedJobId?: string;
  relatedTechnicianId?: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}
```

#### SupervisorQAReview
```typescript
interface SupervisorQAReview {
  id: string;
  inspectionId: string;
  taskId: string;
  deviceSerial: string;
  jobOrderCode: string;
  technicianName: string;
  operationName: string;
  qaDecision: 'accepted' | 'rejected';
  qaComments: string;
  qaInspector: string;
  qaInspectedAt: string;
  supervisorDecision?: 'accepted' | 'rejected';
  supervisorComments?: string;
  supervisorReviewedAt?: string;
  status: 'pending-supervisor' | 'supervisor-approved' | 'supervisor-rejected';
}
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

#### 1. Navigate to Frontend Directory
```bash
cd frontend
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Configure Environment Variables
Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:8000/api
```

#### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

Application runs at: `http://localhost:5173`

#### 5. Build for Production
```bash
npm run build
# or
yarn build
```

Build output in `dist/` directory.

#### 6. Preview Production Build
```bash
npm run preview
# or
yarn preview
```

---

## Development Guide

### Code Style

#### TypeScript
- Use interfaces for object types
- Avoid `any` type
- Enable strict mode
- Use type inference where possible

```typescript
// Good
interface TaskProps {
  task: Task;
  onComplete: (id: string) => void;
}

// Avoid
const handleClick = (data: any) => { ... }
```

#### React Components
- Functional components with hooks
- Props destructuring
- TypeScript for props

```tsx
interface ButtonProps {
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ onClick, label, variant = 'primary' }) => {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};
```

#### Tailwind CSS
- Use utility classes
- Follow mobile-first approach
- Create custom classes in CSS files for repeated patterns

```tsx
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Component Organization

#### File Naming
- PascalCase for components: `TaskCard.tsx`
- camelCase for utilities: `formatDate.ts`
- kebab-case for CSS: `custom-styles.css`

#### Component Structure
```tsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../services/api';

// 2. Types/Interfaces
interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

// 3. Component
export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
  // 4. State
  const [loading, setLoading] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 7. Render
  return (
    <div className="task-card">
      {/* JSX */}
    </div>
  );
};
```

### API Integration Patterns

#### Fetching Data
```tsx
const [data, setData] = useState<Task[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.tasks.getTasks();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

#### Submitting Data
```tsx
const handleSubmit = async (formData: TaskData) => {
  try {
    setSubmitting(true);
    const result = await api.tasks.createTask(formData);
    showToast('Task created successfully', 'success');
    onSuccess(result);
  } catch (err) {
    showToast('Failed to create task', 'error');
    console.error(err);
  } finally {
    setSubmitting(false);
  }
};
```

### Error Handling

```tsx
try {
  await api.tasks.deleteTask(taskId);
  showToast('Task deleted', 'success');
} catch (error: any) {
  if (error.response?.status === 404) {
    showToast('Task not found', 'error');
  } else if (error.response?.status === 403) {
    showToast('Permission denied', 'error');
  } else {
    showToast('An error occurred', 'error');
  }
}
```

---

## Build & Deployment

### Development Build
```bash
npm run dev
```
- Hot module replacement (HMR)
- Source maps enabled
- Development warnings

### Production Build
```bash
npm run build
```
- Minified JavaScript
- Optimized assets
- Tree shaking
- Code splitting

### Build Output
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [asset files]
└── index.html
```

### Deployment Options

#### Static Hosting (Netlify, Vercel, GitHub Pages)
1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy `dist/` directory

3. Configure redirects for SPA routing:
   ```
   /* /index.html 200
   ```

#### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```

### Environment Variables

**Development (.env.development)**:
```env
VITE_API_URL=http://localhost:8000/api
```

**Production (.env.production)**:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Performance Optimization

#### Code Splitting
```tsx
// Lazy load routes
const PlannerPage = lazy(() => import('./pages/PlannerPage'));

<Suspense fallback={<Loading />}>
  <PlannerPage />
</Suspense>
```

#### Image Optimization
- Use WebP format
- Lazy load images
- Implement responsive images

#### Bundle Analysis
```bash
npm run build -- --analyze
```

---

## Key Features

### 1. Role-Based UI
- Dynamic routing based on user role
- Role-specific components and navigation
- Automatic role validation

### 2. Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Mobile bottom navigation
- Touch-friendly interactions

### 3. Real-Time Updates
- Toast notifications for user actions
- Automatic data refresh
- Optimistic UI updates

### 4. Performance Metrics Visualization
- KPI cards
- Progress bars
- Efficiency indicators
- Charts and graphs (via analytics components)

### 5. Data Management
- CRUD operations for all entities
- Bulk import/export
- PDF report generation
- Excel/CSV support

### 6. Authentication & Security
- JWT token management
- Automatic token refresh
- Session persistence
- Secure logout

### 7. User Experience
- Loading states
- Error handling
- Form validation
- Confirmation dialogs
- Keyboard shortcuts
- Accessibility features

### 8. Developer Experience
- TypeScript for type safety
- Hot module replacement
- ESLint code quality
- Organized project structure
- Comprehensive API service layer

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Troubleshooting

### Common Issues

#### API Connection Errors
```bash
# Check API URL in .env
VITE_API_URL=http://localhost:8000/api

# Ensure backend is running
cd backend
python manage.py runserver
```

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

#### Type Errors
```bash
# Regenerate TypeScript cache
npm run build
```

---

## Development Workflow

### Feature Development
1. Create feature branch: `git checkout -b feature/new-feature`
2. Develop component/feature
3. Test thoroughly
4. Commit changes: `git commit -m "Add new feature"`
5. Push and create PR: `git push origin feature/new-feature`

### Testing
```bash
# Run linter
npm run lint

# Type check
npm run build

# Manual testing in browser
npm run dev
```

---

## Future Enhancements

### Planned Features
- [ ] Real-time WebSocket notifications
- [ ] Advanced charts and analytics
- [ ] Dark mode support
- [ ] Offline mode with service workers
- [ ] Multi-language support (i18n)
- [ ] Advanced filtering and search
- [ ] Drag-and-drop task management
- [ ] Calendar view for scheduling
- [ ] Mobile app (React Native)

---

## Support & Resources

- **React Documentation**: https://react.dev/
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/
- **Vite Documentation**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com/
- **Axios**: https://axios-http.com/docs/intro

---

## Scripts Reference

```json
{
  "dev": "vite",                    // Start development server
  "build": "tsc -b && vite build",  // Build for production
  "lint": "eslint .",               // Run ESLint
  "preview": "vite preview"         // Preview production build
}
```

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Maintainer**: JODDB Development Team
