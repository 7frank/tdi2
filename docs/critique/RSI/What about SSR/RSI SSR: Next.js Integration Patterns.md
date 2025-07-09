# RSI SSR: Next.js Integration Patterns

## Next.js + RSI Integration Challenges

Next.js introduces unique challenges for RSI due to its App Router, React Server Components, and complex rendering pipeline. We need to carefully navigate these while maintaining RSI's core benefits.

## React Server Components Compatibility

### RSI Services in Server Components

```typescript
// app/users/[id]/page.tsx - Server Component
import { createServerContainer } from '@/lib/server-container'
import { UserServiceInterface } from '@/services/UserService'

export default async function UserPage({ params }: { params: { id: string } }) {
  // Create container for this request
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  // Pre-load data in server component
  await userService.loadUser(params.id)
  
  // Extract state for client hydration
  const initialState = {
    UserService: {
      currentUser: userService.state.currentUser,
      loading: false
    }
  }
  
  return (
    <div>
      <h1>{userService.state.currentUser?.name}</h1>
      
      {/* Client component with RSI */}
      <UserProfileClient initialState={initialState} />
    </div>
  )
}
```

### Client Components with RSI

```typescript
// components/UserProfileClient.tsx - Client Component
'use client'

import { useEffect } from 'react'
import { useDIContainer } from '@/lib/rsi-nextjs'
import { UserServiceInterface } from '@/services/UserService'

interface UserProfileClientProps {
  initialState: SerializedServiceState
}

export function UserProfileClient({ initialState }: UserProfileClientProps) {
  const container = useDIContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  // Hydrate with server state
  useEffect(() => {
    if (initialState.UserService) {
      Object.assign(userService.state, initialState.UserService)
    }
  }, [initialState])
  
  const user = userService.state.currentUser
  
  return (
    <div>
      <h2>Client Profile</h2>
      <p>{user?.email}</p>
      <button onClick={() => userService.updateUser(user.id, { name: 'Updated' })}>
        Update Name
      </button>
    </div>
  )
}
```

## Next.js App Router Integration

### Layout with RSI Provider

```typescript
// app/layout.tsx
import { createClientContainer } from '@/lib/client-container'
import { RSIProvider } from '@/lib/rsi-nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RSIProvider>
          {children}
        </RSIProvider>
      </body>
    </html>
  )
}
```

### RSI Provider for Next.js

```typescript
// lib/rsi-nextjs.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { DIContainer } from '@tdi2/di-core'
import { createClientContainer } from './client-container'

const DIContext = createContext<DIContainer | null>(null)

export function RSIProvider({ 
  children,
  initialState 
}: { 
  children: React.ReactNode
  initialState?: SerializedServiceState 
}) {
  const [container, setContainer] = useState<DIContainer | null>(null)
  
  useEffect(() => {
    const clientContainer = createClientContainer()
    
    // Hydrate with initial state if provided
    if (initialState) {
      hydrateServiceStates(clientContainer, initialState)
    }
    
    setContainer(clientContainer)
  }, [initialState])
  
  if (!container) {
    return <div>Loading...</div> // Or your loading component
  }
  
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  )
}

export function useDIContainer(): DIContainer {
  const container = useContext(DIContext)
  if (!container) {
    throw new Error('useDIContainer must be used within RSIProvider')
  }
  return container
}

// Hook for service access in client components
export function useService<T>(token: string): T {
  const container = useDIContainer()
  return container.get<T>(token)
}
```

## Data Fetching Patterns

### Server Actions with RSI

```typescript
// app/actions/user-actions.ts
'use server'

import { createServerContainer } from '@/lib/server-container'
import { UserServiceInterface } from '@/services/UserService'
import { revalidatePath } from 'next/cache'

export async function updateUserAction(userId: string, updates: Partial<User>) {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  try {
    await userService.updateUser(userId, updates)
    revalidatePath(`/users/${userId}`)
    
    return { success: true, user: userService.state.currentUser }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Client component using server action
'use client'

export function UserEditForm() {
  const userService = useService<UserServiceInterface>('UserService')
  
  const handleSubmit = async (formData: FormData) => {
    const updates = {
      name: formData.get('name') as string,
      email: formData.get('email') as string
    }
    
    const result = await updateUserAction(userService.state.currentUser.id, updates)
    
    if (result.success) {
      // Update local service state
      userService.state.currentUser = result.user
    }
  }
  
  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Static Generation with RSI

```typescript
// app/users/[id]/page.tsx
import { createServerContainer } from '@/lib/server-container'

export async function generateStaticParams() {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  await userService.loadUsers()
  
  return userService.state.users.map((user) => ({
    id: user.id,
  }))
}

export default async function StaticUserPage({ params }: { params: { id: string } }) {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  // This runs at build time for static generation
  await userService.loadUser(params.id)
  
  const user = userService.state.currentUser
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>Generated at build time</p>
    </div>
  )
}
```

## Middleware Integration

### RSI-Aware Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerContainer } from '@/lib/server-container'
import { AuthServiceInterface } from '@/services/AuthService'

export async function middleware(request: NextRequest) {
  const container = createServerContainer()
  const authService = container.get<AuthServiceInterface>('AuthService')
  
  // Extract auth token from request
  const token = request.headers.get('authorization')
  
  if (token) {
    await authService.validateToken(token)
    
    if (!authService.state.isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Pass user context to RSI services
    const response = NextResponse.next()
    response.headers.set('x-user-id', authService.state.currentUser.id)
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

## Error Boundaries with RSI

### RSI-Aware Error Boundary

```typescript
// components/RSIErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { DIContainer } from '@tdi2/di-core'
import { ErrorServiceInterface } from '@/services/ErrorService'

interface Props {
  children: ReactNode
  container: DIContainer
}

interface State {
  hasError: boolean
  error?: Error
}

export class RSIErrorBoundary extends Component<Props, State> {
  private errorService: ErrorServiceInterface
  
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
    this.errorService = props.container.get<ErrorServiceInterface>('ErrorService')
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error through RSI service
    this.errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'RSIErrorBoundary'
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>Error ID: {this.errorService.state.lastErrorId}</p>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage in layout
export default function Layout({ children }: { children: ReactNode }) {
  const container = useDIContainer()
  
  return (
    <RSIErrorBoundary container={container}>
      {children}
    </RSIErrorBoundary>
  )
}
```

## Performance Optimization

### Service-Based Caching

```typescript
// lib/rsi-cache.ts
import { unstable_cache } from 'next/cache'
import { createServerContainer } from './server-container'

export function createCachedServiceCall<T>(
  serviceName: string,
  methodName: string,
  cacheKey: string,
  revalidate?: number
) {
  return unstable_cache(
    async (...args: any[]) => {
      const container = createServerContainer()
      const service = container.get(serviceName)
      return await service[methodName](...args)
    },
    [cacheKey],
    { revalidate }
  )
}

// Usage
const getCachedUser = createCachedServiceCall(
  'UserService',
  'loadUser', 
  'user-profile',
  3600 // 1 hour cache
)

export async function UserProfile({ userId }: { userId: string }) {
  const user = await getCachedUser(userId)
  
  return <div>{user.name}</div>
}
```

### Progressive Enhancement

```typescript
// components/ProgressiveUserProfile.tsx
import { Suspense } from 'react'
import { UserProfileServer } from './UserProfileServer'
import { UserProfileClient } from './UserProfileClient'

export function ProgressiveUserProfile({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      {/* Server-rendered content */}
      <UserProfileServer userId={userId} />
      
      {/* Progressive enhancement with client features */}
      <UserProfileClient userId={userId} />
    </Suspense>
  )
}

// Server component - static content
async function UserProfileServer({ userId }: { userId: string }) {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  await userService.loadUser(userId)
  const user = userService.state.currentUser
  
  return (
    <div className="user-profile-static">
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      {/* Static, SEO-friendly content */}
    </div>
  )
}

// Client component - interactive features
'use client'

function UserProfileClient({ userId }: { userId: string }) {
  const userService = useService<UserServiceInterface>('UserService')
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <div className="user-profile-interactive">
      {isEditing ? (
        <UserEditForm 
          user={userService.state.currentUser}
          onSave={() => setIsEditing(false)}
        />
      ) : (
        <button onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      )}
    </div>
  )
}
```

## Route Handlers with RSI

### API Routes Using Services

```typescript
// app/api/users/[id]/route.ts
import { createServerContainer } from '@/lib/server-container'
import { UserServiceInterface } from '@/services/UserService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  try {
    await userService.loadUser(params.id)
    
    return NextResponse.json({
      user: userService.state.currentUser,
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const container = createServerContainer()
  const userService = container.get<UserServiceInterface>('UserService')
  
  try {
    const updates = await request.json()
    await userService.updateUser(params.id, updates)
    
    return NextResponse.json({
      user: userService.state.currentUser,
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    )
  }
}
```

### tRPC Integration with RSI

```typescript
// lib/trpc/router.ts
import { initTRPC } from '@trpc/server'
import { createServerContainer } from '@/lib/server-container'
import { UserServiceInterface } from '@/services/UserService'
import { z } from 'zod'

const t = initTRPC.create()

// Create tRPC context with RSI container
export const createTRPCContext = () => {
  return {
    container: createServerContainer()
  }
}

export const appRouter = t.router({
  user: t.router({
    getById: t.procedure
      .input(z.string())
      .query(async ({ input, ctx }) => {
        const userService = ctx.container.get<UserServiceInterface>('UserService')
        await userService.loadUser(input)
        return userService.state.currentUser
      }),
      
    update: t.procedure
      .input(z.object({
        id: z.string(),
        updates: z.object({
          name: z.string().optional(),
          email: z.string().email().optional()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        const userService = ctx.container.get<UserServiceInterface>('UserService')
        await userService.updateUser(input.id, input.updates)
        return userService.state.currentUser
      })
  })
})

// Client-side tRPC with RSI
'use client'

export function UserProfileWithTRPC({ userId }: { userId: string }) {
  const userService = useService<UserServiceInterface>('UserService')
  const { data: user, isLoading } = trpc.user.getById.useQuery(userId)
  
  // Sync tRPC data with RSI service
  useEffect(() => {
    if (user) {
      userService.state.currentUser = user
    }
  }, [user])
  
  const updateMutation = trpc.user.update.useMutation({
    onSuccess: (updatedUser) => {
      userService.state.currentUser = updatedUser
    }
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{user?.name}</h1>
      <button 
        onClick={() => updateMutation.mutate({
          id: userId,
          updates: { name: 'Updated Name' }
        })}
      >
        Update via tRPC
      </button>
    </div>
  )
}
```

## Next.js Configuration for RSI

### Enhanced Next.js Config

```typescript
// next.config.js
const { withRSI } = require('@rsi/nextjs-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@tdi2/di-core'],
  },
  
  // RSI-specific webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add RSI transformation
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        defaultLoaders.babel,
        {
          loader: '@rsi/webpack-loader',
          options: {
            isServer,
            enableStateExtraction: !dev,
            enableServiceProfiles: true
          }
        }
      ]
    })
    
    // Environment-specific service resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@rsi/config': isServer 
        ? require.resolve('./.rsi/server-config.js')
        : require.resolve('./.rsi/client-config.js')
    }
    
    return config
  }
}

module.exports = withRSI(nextConfig, {
  // RSI plugin options
  generateConfigs: true,
  enableProfiles: true,
  serverProfiles: ['server', 'isomorphic'],
  clientProfiles: ['client', 'isomorphic'],
  
  // Development features
  enableDevTools: true,
  enableHydrationValidation: true
})
```

### Container Configuration Files

```typescript
// lib/server-container.ts
import { CompileTimeDIContainer } from '@tdi2/di-core'
import { SERVER_DI_CONFIG } from '@rsi/config'

export function createServerContainer(): DIContainer {
  const container = new CompileTimeDIContainer()
  container.loadConfiguration(SERVER_DI_CONFIG)
  
  // Server-specific service overrides
  registerServerServices(container)
  
  return container
}

function registerServerServices(container: DIContainer) {
  // Register database connections, server-only services
  container.register('Database', DatabaseConnection)
  container.register('FileSystem', NodeFileSystem)
  container.register('EmailService', SMTPEmailService)
}

// lib/client-container.ts
import { CompileTimeDIContainer } from '@tdi2/di-core'
import { CLIENT_DI_CONFIG } from '@rsi/config'

export function createClientContainer(): DIContainer {
  const container = new CompileTimeDIContainer()
  container.loadConfiguration(CLIENT_DI_CONFIG)
  
  // Client-specific service overrides
  registerClientServices(container)
  
  return container
}

function registerClientServices(container: DIContainer) {
  // Register browser APIs, client-only services
  container.register('LocalStorage', BrowserLocalStorage)
  container.register('NotificationService', BrowserNotificationService)
  container.register('GeolocationService', BrowserGeolocationService)
}
```

## Development Experience

### Next.js Dev Tools Integration

```typescript
// components/RSIDevPanel.tsx (Development only)
'use client'

import { useEffect, useState } from 'react'
import { useDIContainer } from '@/lib/rsi-nextjs'

export function RSIDevPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [serviceStates, setServiceStates] = useState<any>({})
  const container = useDIContainer()
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Capture service states for debugging
      const updateStates = () => {
        const states: any = {}
        for (const token of container.getRegisteredTokens()) {
          const service = container.get(token)
          if (service.state) {
            states[token] = service.state
          }
        }
        setServiceStates(states)
      }
      
      const interval = setInterval(updateStates, 1000)
      return () => clearInterval(interval)
    }
  }, [container])
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="rsi-dev-panel">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔧 RSI Dev Panel
      </button>
      
      {isOpen && (
        <div className="rsi-service-inspector">
          <h3>Service States</h3>
          {Object.entries(serviceStates).map(([token, state]) => (
            <details key={token}>
              <summary>{token}</summary>
              <pre>{JSON.stringify(state, null, 2)}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

// Add to layout in development
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <RSIProvider>
          {children}
          {process.env.NODE_ENV === 'development' && <RSIDevPanel />}
        </RSIProvider>
      </body>
    </html>
  )
}
```

## Deployment Considerations

### Vercel Deployment

```typescript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "RSI_ENABLE_PROFILES": "true",
    "RSI_SERVER_PROFILE": "server,isomorphic",
    "RSI_CLIENT_PROFILE": "client,isomorphic"
  }
}

// Build optimization for Vercel
// package.json
{
  "scripts": {
    "build": "rsi-generate-configs && next build",
    "postbuild": "rsi-optimize-bundles"
  }
}
```

### Docker Deployment

```dockerfile
# Dockerfile for RSI Next.js app
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Generate RSI configurations
RUN npm run rsi:generate-configs

# Build Next.js with RSI
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

## Testing Strategies

### Integration Testing with RSI + Next.js

```typescript
// __tests__/integration/user-profile.test.tsx
import { render, screen } from '@testing-library/react'
import { createTestContainer } from '@/lib/test-utils'
import { UserServiceInterface } from '@/services/UserService'
import UserProfile from '@/app/users/[id]/page'

describe('UserProfile Integration', () => {
  it('renders user profile with RSI services', async () => {
    const container = createTestContainer()
    
    // Mock user service
    const mockUserService: UserServiceInterface = {
      state: {
        currentUser: { id: '1', name: 'John Doe', email: 'john@example.com' },
        loading: false
      },
      loadUser: jest.fn(),
      updateUser: jest.fn()
    }
    
    container.register('UserService', () => mockUserService)
    
    const { container: testContainer } = render(
      <RSIProvider container={container}>
        <UserProfile params={{ id: '1' }} />
      </RSIProvider>
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

## Migration Strategy

### Gradual Next.js + RSI Adoption

```typescript
// Phase 1: Add RSI to specific routes
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RSIProvider>
      {/* Only dashboard routes use RSI */}
      {children}
    </RSIProvider>
  )
}

// Phase 2: Migrate pages route by route
// pages/api routes can be gradually moved to app/api with RSI

// Phase 3: Full application RSI integration
// Move RSIProvider to root layout for app-wide RSI support
```

## Benefits for Next.js Applications

### ✅ **Performance Improvements**
- Server-side data pre-loading with services
- Optimized bundle splitting between server/client
- Efficient state hydration

### ✅ **Developer Experience**
- Consistent patterns across server and client
- Type-safe service contracts
- Easy testing with service mocking

### ✅ **Scalability**
- Clear separation of concerns
- Service-based architecture scales with team size
- Framework-agnostic business logic

## Challenges

### ❌ **Complex Integration**
- Next.js rendering pipeline complexity
- React Server Components compatibility
- Build system integration requirements

### ❌ **Bundle Size Considerations**
- DI container overhead
- Dual-environment code generation
- Service state serialization cost

### ❌ **Learning Curve**
- Next.js + RSI concepts
- Server vs client service patterns
- Hydration debugging complexity

## Recommendation

RSI + Next.js integration is **highly promising** for enterprise applications but requires careful implementation. Start with client-side RSI adoption, then gradually add server-side integration as tooling matures.