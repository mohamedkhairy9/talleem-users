# Setup Guide

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update `VITE_API_BASE_URL` with your API base URL

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Adding a New Feature

### Step 1: Create Feature Structure

Create the feature directory structure:
```
src/features/[feature-name]/
├── components/
│   └── [FeatureComponent].jsx
├── hooks/
│   └── use[Feature].js
├── services/
│   └── [feature].service.js
└── constants/
    └── [feature].constants.js
```

### Step 2: Create Service

Example: `src/features/users/services/users.service.js`
```javascript
import { axiosInstance } from '@/api/axiosInstance';

export const usersService = {
    getUsers: (filters) => {
        return axiosInstance.get('/users', { params: filters });
    },
    // ... other methods
};
```

### Step 3: Create Hook

Example: `src/features/users/hooks/useUsers.js`
```javascript
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/users.service';

export const useUsers = (filters) => {
    return useQuery({
        queryKey: ['users', filters],
        queryFn: () => usersService.getUsers(filters)
    });
};
```

### Step 4: Create Component

Example: `src/features/users/components/UsersList.jsx`
```javascript
import React from 'react';
import Table from '@/globals/components/tables/Table';

const UsersList = ({ users, loading }) => {
    // Component implementation
};
```

### Step 5: Create Page

Example: `src/pages/UsersPage.jsx`
```javascript
import React from 'react';
import UsersList from '@/features/users/components/UsersList';
import { useUsers } from '@/features/users/hooks/useUsers';

const UsersPage = () => {
    const { data, isLoading } = useUsers();
    
    return (
        <div>
            <h1>Users</h1>
            <UsersList users={data?.data} loading={isLoading} />
        </div>
    );
};

export default UsersPage;
```

### Step 6: Add Route

Update `src/routes/routes.js`:
```javascript
import UsersPage from '@/pages/UsersPage';

export const routes = [
    // ... existing routes
    {
        path: '/users',
        element: <UsersPage />,
        roles: ['admin'] // Optional
    }
];
```

## Adding a New Icon

1. Create icon file: `src/globals/icons/[IconName].jsx`
```javascript
import React from 'react';
import IconBase from './IconBase';

const IconName = ({ width, height, className, ...props }) => {
    return (
        <IconBase width={width} height={height} className={className} {...props}>
            {/* SVG path elements */}
            <path d="..." />
        </IconBase>
    );
};

export default IconName;
```

2. Export from `src/globals/icons/index.js`:
```javascript
export { default as IconName } from './IconName';
```

## Form Handling

Use the `useFormWithValidation` hook with Yup schemas:

```javascript
import { useFormWithValidation } from '@/utils/hooks/useForm';
import * as yup from 'yup';
import FormInput from '@/globals/components/forms/FormInput';

const schema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email().required('Email is required')
});

const MyForm = () => {
    const { control, handleSubmit } = useFormWithValidation({
        schema,
        defaultValues: { name: '', email: '' }
    });

    const onSubmit = (data) => {
        // Handle form submission
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FormInput name="name" control={control} label="Name" />
            <FormInput name="email" control={control} label="Email" type="email" />
        </form>
    );
};
```

## URL Parameters

Use the `useUrlParams` hook for URL parameter management:

```javascript
import { useUrlParams } from '@/utils/hooks/useUrlParams';

const MyComponent = () => {
    const { getParam, setParam, getLanguage, setLanguage } = useUrlParams();
    
    const lang = getLanguage('en');
    const search = getParam('search', '');
    
    const handleSearch = (value) => {
        setParam('search', value);
    };
};
```

## Authentication

- Token is automatically stored in cookies
- Use `useAuthStore` for auth state:
```javascript
import { useAuthStore } from '@/stores/auth.store';

const { user, isAuthenticated, hasRole, logout } = useAuthStore();
```

## Filtering & Pagination

Use the `useFiltering` hook:

```javascript
import { useFiltering } from '@/utils/hooks/useFiltering';

const defaultFilters = { page: 1, per_page: 10, search: '' };

const MyComponent = () => {
    const { filters, handleFilter, pagination, handlePageChange } = 
        useFiltering(defaultFilters);
    
    // filters automatically sync with URL
};
```
