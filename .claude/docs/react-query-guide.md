# TanStack Query (React Query) Complete Guide

## Table of Contents
- [Overview & Introduction](#overview--introduction)
- [Installation & Setup](#installation--setup)
- [Core Concepts](#core-concepts)
- [Essential Hooks](#essential-hooks)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
- [Code Examples](#code-examples)
- [Migration from v4 to v5](#migration-from-v4-to-v5)
- [Additional Resources](#additional-resources)

---

## Overview & Introduction

### What is TanStack Query?

TanStack Query (formerly React Query) is a powerful data synchronization library for React applications. It manages server state, providing caching, background updates, and synchronization with minimal boilerplate.

**Latest Version:** v5.x (as of 2025)

### Why Use React Query?

- **Automatic Caching:** Intelligent cache management with configurable strategies
- **Background Updates:** Automatic refetching to keep data fresh
- **Optimistic Updates:** Update UI immediately for better UX
- **Deduplication:** Automatically deduplicates identical requests
- **Window Focus Refetching:** Refresh data when users return to the tab
- **Pagination & Infinite Scroll:** Built-in support with minimal code
- **Request Cancellation:** Automatic cleanup of outdated requests
- **TypeScript Support:** First-class TypeScript integration

### When to Use React Query

Use React Query for:
- API data fetching and synchronization
- Server state management (user data, posts, products, etc.)
- Data that needs background updates
- Paginated or infinite scroll lists

Don't use React Query for:
- Client-only state (use useState, Zustand, or Context)
- Form state (use React Hook Form or Formik)
- One-time API calls that don't need caching

---

## Installation & Setup

### Installation

```bash
# npm
npm install @tanstack/react-query

# yarn
yarn add @tanstack/react-query

# pnpm
pnpm add @tanstack/react-query
```

### Install DevTools (Recommended)

```bash
npm install @tanstack/react-query-devtools
```

### Basic Setup

Create a QueryClient and wrap your app with QueryClientProvider:

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
```

---

## Core Concepts

### Queries

Queries are for fetching data. They're identified by unique query keys.

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

### Mutations

Mutations are for creating, updating, or deleting data.

```typescript
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Query Keys

Query keys uniquely identify queries. They can be strings or arrays.

```typescript
// Simple key
['users']

// Hierarchical key
['users', userId]

// With parameters
['users', { status: 'active', page: 1 }]

// Nested resources
['users', userId, 'posts', postId]
```

**Important:** Query keys are compared using deep equality. Order matters in arrays!

### staleTime vs gcTime (formerly cacheTime)

**staleTime:** How long data is considered "fresh"
- Default: 0 (immediately stale)
- Fresh data = served from cache without refetch
- Stale data = refetched in background

**gcTime (garbage collection time):** How long inactive cache is kept in memory
- Default: 5 minutes
- After this time, unused cache is garbage collected
- Renamed from `cacheTime` in v5

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
});
```

### Query States

Queries can be in multiple states simultaneously:

- **isLoading:** No cached data, query is running (first load)
- **isFetching:** Query is running (any time, including background)
- **isError:** Query encountered an error
- **isSuccess:** Query succeeded and has data
- **isPending:** Query has not yet completed (replaces isLoading in v5)

```typescript
const { data, isPending, isError, error, isFetching } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

if (isPending) return <Spinner />;
if (isError) return <div>Error: {error.message}</div>;

return (
  <div>
    {isFetching && <BackgroundSpinner />}
    {data.map(user => <UserCard key={user.id} user={user} />)}
  </div>
);
```

---

## Essential Hooks

### useQuery

Fetch and cache data.

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

interface User {
  id: string;
  name: string;
  email: string;
}

function useUser(userId: string) {
  return useQuery<User, Error>({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId, // Only run if userId exists
  });
}

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isPending, isError, error } = useUser(userId);

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### useMutation

Create, update, or delete data.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

interface CreateUserData {
  name: string;
  email: string;
}

function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateUserData>({
    mutationFn: (userData) => api.createUser(userData),
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Or manually update cache
      queryClient.setQueryData<User[]>(['users'], (oldUsers) => {
        return oldUsers ? [...oldUsers, newUser] : [newUser];
      });
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
}

// Usage in component
function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = (data: CreateUserData) => {
    createUser.mutate(data, {
      onSuccess: () => {
        console.log('User created!');
      },
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      });
    }}>
      <input name="name" placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
      {createUser.isError && (
        <div>Error: {createUser.error.message}</div>
      )}
    </form>
  );
}
```

### useQueryClient

Access the QueryClient to manually manipulate cache.

```typescript
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  // Get cached data
  const users = queryClient.getQueryData<User[]>(['users']);

  // Set data manually
  const addUserToCache = (user: User) => {
    queryClient.setQueryData<User[]>(['users'], (old) =>
      old ? [...old, user] : [user]
    );
  };

  // Invalidate queries
  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  // Prefetch data
  const prefetchUser = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => api.getUser(userId),
    });
  };

  // Remove query from cache
  const removeUserFromCache = (userId: string) => {
    queryClient.removeQueries({ queryKey: ['users', userId] });
  };

  return <div>{/* Your UI */}</div>;
}
```

### useInfiniteQuery

Implement infinite scroll or load more functionality.

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsResponse {
  posts: Post[];
  nextCursor: number | null;
}

function usePosts() {
  return useInfiniteQuery<PostsResponse, Error>({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) => api.getPosts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor,
  });
}

// Usage in component
function PostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = usePosts();

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  );
}
```

### useSuspenseQuery

Use with React Suspense for simplified loading states.

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

function useUser(userId: string) {
  return useSuspenseQuery<User>({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
  });
}

function UserProfile({ userId }: { userId: string }) {
  // No need to check isPending - Suspense handles it
  const { data: user } = useUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Wrap with Suspense boundary
function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

---

## Best Practices

### Query Key Factories

Create consistent, hierarchical query keys using factories.

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Posts
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) =>
      [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    byUser: (userId: string) =>
      [...queryKeys.posts.all, 'user', userId] as const,
  },
} as const;

// Usage
useQuery({
  queryKey: queryKeys.users.detail('123'),
  queryFn: () => api.getUser('123'),
});

// Invalidation becomes easier and more precise
queryClient.invalidateQueries({ queryKey: queryKeys.users.details() });
```

### QueryClient Configuration

Configure sensible defaults based on your app's needs.

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no refetch)
      staleTime: 1000 * 60 * 5, // 5 minutes

      // How long inactive data stays in cache
      gcTime: 1000 * 60 * 10, // 10 minutes

      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },

      // Exponential backoff
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (good for real-time-ish apps)
      refetchOnWindowFocus: true,

      // Refetch on network reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Only retry mutations once
      retry: 1,

      // Network mode
      networkMode: 'online',
    },
  },
});
```

### TypeScript Best Practices

```typescript
// Define API response types
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Type your hooks completely
function useUser(userId: string) {
  return useQuery<User, ApiError>({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }
      return response.json();
    },
    enabled: !!userId,
  });
}

// Type mutations with all generic parameters
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    User,              // Success response type
    ApiError,          // Error type
    { id: string; data: Partial<User> }, // Variables type
    { previousUser: User | undefined }    // Context type
  >({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(['users', id]);

      // Return context
      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback using context
      if (context?.previousUser) {
        queryClient.setQueryData(['users', variables.id], context.previousUser);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['users', data.id], data);
    },
  });
}
```

### Cache Invalidation Patterns

```typescript
const queryClient = useQueryClient();

// Invalidate all queries
queryClient.invalidateQueries();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['users', '123'] });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidate only exact match
queryClient.invalidateQueries({
  queryKey: ['users', '123'],
  exact: true
});

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => {
    return query.queryKey[0] === 'users' && query.state.data?.status === 'inactive';
  },
});

// Remove queries from cache (no refetch)
queryClient.removeQueries({ queryKey: ['users', '123'] });

// Reset queries to initial state
queryClient.resetQueries({ queryKey: ['users'] });
```

---

## Common Patterns

### Optimistic Updates

Update UI immediately, rollback on error.

```typescript
function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, { id: string; data: Partial<Post> }>({
    mutationFn: ({ id, data }) => api.updatePost(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts', id] });

      // Snapshot the previous value
      const previousPost = queryClient.getQueryData<Post>(['posts', id]);

      // Optimistically update to the new value
      queryClient.setQueryData<Post>(['posts', id], (old) =>
        old ? { ...old, ...data } : old
      );

      // Return context with snapshot
      return { previousPost };
    },

    onError: (err, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousPost) {
        queryClient.setQueryData(['posts', id], context.previousPost);
      }
    },

    onSuccess: (updatedPost) => {
      // Update with server response
      queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
    },

    onSettled: (data, error, { id }) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts', id] });
    },
  });
}
```

### Dependent Queries

Query that depends on data from another query.

```typescript
function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => api.getUserPosts(userId!),
    enabled: !!userId, // Only run when userId exists
  });
}

function UserPostsComponent() {
  const { data: user } = useUser('123');
  const { data: posts } = useUserPosts(user?.id);

  return <div>{/* Render posts */}</div>;
}
```

### Parallel Queries

Run multiple queries in parallel.

```typescript
function useDashboardData(userId: string) {
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
  });

  const postsQuery = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => api.getUserPosts(userId),
  });

  const commentsQuery = useQuery({
    queryKey: ['users', userId, 'comments'],
    queryFn: () => api.getUserComments(userId),
  });

  return {
    user: userQuery.data,
    posts: postsQuery.data,
    comments: commentsQuery.data,
    isLoading: userQuery.isPending || postsQuery.isPending || commentsQuery.isPending,
    isError: userQuery.isError || postsQuery.isError || commentsQuery.isError,
  };
}

// Or use useQueries for dynamic arrays
function useMultipleUsers(userIds: string[]) {
  return useQueries({
    queries: userIds.map(id => ({
      queryKey: ['users', id],
      queryFn: () => api.getUser(id),
      staleTime: 1000 * 60 * 5,
    })),
  });
}
```

### Prefetching

Prefetch data before it's needed.

```typescript
function PostsList() {
  const queryClient = useQueryClient();
  const { data: posts } = usePosts();

  // Prefetch on hover
  const prefetchPost = (postId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['posts', postId],
      queryFn: () => api.getPost(postId),
      staleTime: 1000 * 60 * 5, // Only prefetch if older than 5 minutes
    });
  };

  return (
    <div>
      {posts?.map(post => (
        <Link
          key={post.id}
          to={`/posts/${post.id}`}
          onMouseEnter={() => prefetchPost(post.id)}
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}

// Prefetch on route change prediction
function App() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Prefetch common routes
    queryClient.prefetchQuery({
      queryKey: ['users'],
      queryFn: api.getUsers,
    });
  }, [queryClient]);

  return <Router />;
}
```

### Polling / Refetch Interval

Automatically refetch data at intervals.

```typescript
function useRealtimeData() {
  return useQuery({
    queryKey: ['realtime-data'],
    queryFn: api.getRealtimeData,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: false, // Stop when tab is not focused
  });
}

// Conditional polling
function useConditionalPolling(enabled: boolean) {
  return useQuery({
    queryKey: ['data'],
    queryFn: api.getData,
    refetchInterval: enabled ? 5000 : false,
  });
}
```

### Error Handling

```typescript
// Global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404) return false;
        return failureCount < 3;
      },
      onError: (error: any) => {
        if (error?.response?.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        }
      },
    },
  },
});

// Per-query error handling
function useUserWithErrorHandling(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
    retry: false,
    throwOnError: false, // Don't throw to error boundary
  });
}

// Error boundary integration
function UserProfileWithBoundary({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
    throwOnError: true, // Throw to nearest error boundary
  });

  return <div>{user.name}</div>;
}

// Wrap with error boundary
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <UserProfileWithBoundary userId="123" />
    </ErrorBoundary>
  );
}
```

### Pagination

```typescript
interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
}

function usePosts(page: number, pageSize: number = 10) {
  return useQuery<PostsResponse>({
    queryKey: ['posts', { page, pageSize }],
    queryFn: () => api.getPosts(page, pageSize),
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    staleTime: 1000 * 60 * 5,
  });
}

function PostsListPaginated() {
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData } = usePosts(page);

  return (
    <div>
      {data?.posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}

      <div>
        <button
          onClick={() => setPage(old => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => {
            if (!isPlaceholderData && data?.posts.length === data?.pageSize) {
              setPage(old => old + 1);
            }
          }}
          disabled={isPlaceholderData || data?.posts.length! < data?.pageSize!}
        >
          Next
        </button>
      </div>

      {isPlaceholderData && <span>Loading new page...</span>}
    </div>
  );
}
```

### Request Cancellation

```typescript
function useSearchUsers(searchTerm: string) {
  return useQuery({
    queryKey: ['users', 'search', searchTerm],
    queryFn: async ({ signal }) => {
      // Pass AbortSignal to fetch
      const response = await fetch(
        `/api/users/search?q=${searchTerm}`,
        { signal }
      );
      return response.json();
    },
    enabled: searchTerm.length > 2,
  });
}

// React Query automatically cancels previous requests when:
// 1. Query key changes (new search term)
// 2. Component unmounts
// 3. Query is manually cancelled
```

---

## Common Pitfalls to Avoid

### 1. Not Using Query Key Factories

**Bad:**
```typescript
// Inconsistent keys throughout codebase
useQuery({ queryKey: ['user', id], ... })
useQuery({ queryKey: ['users', id], ... })
useQuery({ queryKey: ['user', id, 'details'], ... })
```

**Good:**
```typescript
// Consistent, hierarchical keys
const userKeys = {
  all: ['users'],
  detail: (id: string) => [...userKeys.all, id],
};

useQuery({ queryKey: userKeys.detail(id), ... })
```

**Why:** Inconsistent keys lead to cache misses, difficult invalidation, and bugs.

### 2. Over-Invalidating Queries

**Bad:**
```typescript
// Invalidates ALL queries!
queryClient.invalidateQueries();

// After updating one user
useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] }); // Refetches all user queries
  },
});
```

**Good:**
```typescript
// Only invalidate specific query
useMutation({
  onSuccess: (updatedUser) => {
    queryClient.setQueryData(['users', updatedUser.id], updatedUser);
    // Or only invalidate this user's queries
    queryClient.invalidateQueries({ queryKey: ['users', updatedUser.id] });
  },
});
```

**Why:** Over-invalidation causes unnecessary network requests and poor performance.

### 3. Not Setting staleTime

**Bad:**
```typescript
// Default staleTime is 0 - data is immediately stale
useQuery({ queryKey: ['users'], queryFn: fetchUsers });
// Refetches on every mount, window focus, etc.
```

**Good:**
```typescript
// Data is fresh for 5 minutes
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5,
});
```

**Why:** Without staleTime, you'll have excessive refetching and poor UX.

### 4. Forgetting enabled for Dependent Queries

**Bad:**
```typescript
function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => api.getUserPosts(userId!), // userId might be undefined!
  });
}
```

**Good:**
```typescript
function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => api.getUserPosts(userId!),
    enabled: !!userId, // Only run when userId exists
  });
}
```

**Why:** Without enabled, queries run with invalid parameters.

### 5. Not Handling Loading States Properly

**Bad:**
```typescript
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
// data is undefined initially!
return <div>{data.map(user => ...)}</div>; // Runtime error
```

**Good:**
```typescript
const { data, isPending, isError, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

if (isPending) return <Spinner />;
if (isError) return <div>Error: {error.message}</div>;

return <div>{data.map(user => ...)}</div>;
```

**Why:** Always handle all query states to prevent crashes.

### 6. Mutating Query Data Directly

**Bad:**
```typescript
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Directly mutating cache
users?.push(newUser); // Don't do this!
```

**Good:**
```typescript
queryClient.setQueryData<User[]>(['users'], (old) =>
  old ? [...old, newUser] : [newUser]
);
```

**Why:** React Query needs immutable updates to detect changes.

### 7. Not Using Optimistic Updates

**Bad:**
```typescript
const updateMutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    // User waits for refetch before seeing changes
  },
});
```

**Good:**
```typescript
const updateMutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });
    const previous = queryClient.getQueryData(['users', newUser.id]);

    queryClient.setQueryData(['users', newUser.id], newUser);
    // User sees changes immediately

    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['users', variables.id], context?.previous);
  },
});
```

**Why:** Optimistic updates provide instant feedback and better UX.

### 8. Ignoring TypeScript Types

**Bad:**
```typescript
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
// data is typed as unknown
```

**Good:**
```typescript
const { data } = useQuery<User[], Error>({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
// data is typed as User[] | undefined
```

**Why:** TypeScript helps catch errors and improves developer experience.

### 9. Using Queries in Event Handlers

**Bad:**
```typescript
function MyComponent() {
  const handleClick = () => {
    // Don't call useQuery in event handler!
    const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**Good:**
```typescript
function MyComponent() {
  const queryClient = useQueryClient();

  const handleClick = async () => {
    // Use queryClient.fetchQuery for imperative calls
    const data = await queryClient.fetchQuery({
      queryKey: ['data'],
      queryFn: fetchData,
    });
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**Why:** React hooks must be called at the top level of components.

### 10. Not Cancelling Queries on Unmount

**Bad:**
```typescript
function useSlowQuery() {
  return useQuery({
    queryKey: ['slow'],
    queryFn: async () => {
      const response = await fetch('/api/slow-endpoint');
      return response.json();
      // If component unmounts, request continues
    },
  });
}
```

**Good:**
```typescript
function useSlowQuery() {
  return useQuery({
    queryKey: ['slow'],
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/slow-endpoint', { signal });
      return response.json();
      // Request is cancelled on unmount
    },
  });
}
```

**Why:** Prevents memory leaks and unnecessary network requests.

---

## Code Examples

### Complete CRUD Example

```typescript
// src/api/users.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

class UsersApi {
  private baseUrl = '/api/users';

  async getUsers(): Promise<User[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async getUser(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  }
}

export const usersApi = new UsersApi();
```

```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, User, CreateUserDto, UpdateUserDto } from '../api/users';

// Query Keys Factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Queries
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersApi.getUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUser(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.createUser,
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists());

      // Optimistically update
      queryClient.setQueryData<User[]>(userKeys.lists(), (old) => {
        const optimisticUser: User = {
          id: `temp-${Date.now()}`,
          ...newUser,
          createdAt: new Date().toISOString(),
        };
        return old ? [...old, optimisticUser] : [optimisticUser];
      });

      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      // Rollback
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
    },
    onSuccess: (createdUser) => {
      // Update cache with real data
      queryClient.setQueryData(userKeys.detail(createdUser.id), createdUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.updateUser(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      const previousUser = queryClient.getQueryData<User>(userKeys.detail(id));

      queryClient.setQueryData<User>(userKeys.detail(id), (old) =>
        old ? { ...old, ...data } : old
      );

      return { previousUser };
    },
    onError: (err, { id }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists());

      queryClient.setQueryData<User[]>(userKeys.lists(), (old) =>
        old ? old.filter(user => user.id !== id) : []
      );

      return { previousUsers };
    },
    onError: (err, id, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

```typescript
// src/components/UsersList.tsx
import { useUsers, useDeleteUser } from '../hooks/useUsers';

export function UsersList() {
  const { data: users, isPending, isError, error } = useUsers();
  const deleteUser = useDeleteUser();

  if (isPending) {
    return <div>Loading users...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button
              onClick={() => deleteUser.mutate(user.id)}
              disabled={deleteUser.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Search with Debouncing

```typescript
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useSearchUsers(searchTerm: string) {
  const debouncedSearch = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => api.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 3,
    staleTime: 1000 * 60, // 1 minute
  });
}

function SearchUsers() {
  const [search, setSearch] = useState('');
  const { data, isPending, isFetching } = useSearchUsers(search);

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
      />
      {isFetching && <span>Searching...</span>}
      {data && (
        <ul>
          {data.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Authentication Pattern

```typescript
// src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

const authKeys = {
  user: ['auth', 'user'] as const,
};

export function useAuth() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: Infinity, // User data rarely changes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/login');
    }
  }, [user, isPending, navigate]);

  if (isPending) return <div>Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

---

## Migration from v4 to v5

### Breaking Changes

#### 1. cacheTime renamed to gcTime

**v4:**
```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  cacheTime: 1000 * 60 * 10,
});
```

**v5:**
```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  gcTime: 1000 * 60 * 10, // renamed from cacheTime
});
```

#### 2. isLoading renamed to isPending

**v4:**
```typescript
const { isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
```

**v5:**
```typescript
const { isPending } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
// isLoading still exists but means: isPending && isFetching
```

#### 3. useInfiniteQuery requires initialPageParam

**v4:**
```typescript
useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**v5:**
```typescript
useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 0, // Required in v5
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

#### 4. Query callbacks moved to useMutation

**v4:**
```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  onSuccess: (data) => console.log(data),
  onError: (error) => console.error(error),
});
```

**v5:**
```typescript
// Query callbacks removed, use useEffect instead
const { data, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

useEffect(() => {
  if (data) console.log(data);
}, [data]);

useEffect(() => {
  if (error) console.error(error);
}, [error]);
```

#### 5. QueryClient methods now require object parameters

**v4:**
```typescript
queryClient.invalidateQueries(['users']);
queryClient.setQueryData(['users'], data);
```

**v5:**
```typescript
queryClient.invalidateQueries({ queryKey: ['users'] });
queryClient.setQueryData({ queryKey: ['users'] }, data);
// Or shorthand still works:
queryClient.setQueryData(['users'], data);
```

#### 6. onSuccess/onError/onSettled in mutations run before invalidation

**v4:**
```typescript
// Callbacks ran after invalidation
useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // This ran after invalidation
  },
});
```

**v5:**
```typescript
// Callbacks run before invalidation
useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // This runs before any invalidation
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

#### 7. TypeScript generic order changed

**v4:**
```typescript
useQuery<User[], Error>(['users'], fetchUsers);
```

**v5:**
```typescript
useQuery<User[], Error>({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

### Migration Checklist

- [ ] Replace `cacheTime` with `gcTime`
- [ ] Replace `isLoading` with `isPending` where appropriate
- [ ] Add `initialPageParam` to all `useInfiniteQuery` calls
- [ ] Remove `onSuccess`/`onError` from queries, move to `useEffect`
- [ ] Update `queryClient` method calls to use object parameters
- [ ] Test mutation callback timing
- [ ] Update TypeScript generics to new format
- [ ] Test error handling and retry logic
- [ ] Update custom hooks to new API
- [ ] Run tests and fix any issues

### Codemod

TanStack provides a codemod to automate most migrations:

```bash
npx @tanstack/query-codemods v5/replace-use-query-options
```

---

## Additional Resources

### Official Documentation
- **TanStack Query Docs:** https://tanstack.com/query/latest
- **API Reference:** https://tanstack.com/query/latest/docs/reference
- **Examples:** https://tanstack.com/query/latest/docs/examples/react/simple

### Community Resources
- **GitHub:** https://github.com/TanStack/query
- **Discord:** https://discord.com/invite/WrRKjPJ
- **Twitter:** @TanStackQuery

### Video Tutorials
- **Official TanStack YouTube:** https://www.youtube.com/@tannerlins
- **Practical React Query (TkDodo):** https://tkdodo.eu/blog/practical-react-query

### Related Libraries
- **TanStack Router:** Deep integration with React Query
- **TanStack Table:** Data grid with React Query integration
- **Axios:** Popular HTTP client that works great with React Query

### TypeScript Resources
- **Type-safe API clients:** Leverage tRPC or GraphQL Code Generator
- **Zod:** Validate API responses at runtime

---

## Summary

TanStack Query is essential for managing server state in modern React applications. Key takeaways:

1. **Always define query keys consistently** using factories
2. **Configure appropriate staleTime** based on data volatility
3. **Implement optimistic updates** for better UX
4. **Use TypeScript** for type safety
5. **Handle all query states** (pending, error, success)
6. **Invalidate queries surgically** to avoid unnecessary refetches
7. **Leverage DevTools** for debugging
8. **Test thoroughly** especially around cache behavior

By following these patterns and best practices, you'll build performant, maintainable applications with excellent user experience.
