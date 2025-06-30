```typescript
// ===== THE REVOLUTION: FROM PROPS TO PURE TEMPLATES =====

// ❌ OLD WAY: Components drowning in props
function UserProfile({ userId, userRole, permissions, theme, onUpdate }: {
  userId: string;
  userRole: string;
  permissions: string[];
  theme: 'light' | 'dark';
  onUpdate: (user: User) => void;
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  return loading ? <Spinner /> : <div>{user?.name}</div>;
}

// ✅ NEW WAY: Services handle ALL state, components are pure templates
interface UserServiceInterface {
  state: {
    currentUser: User | null;
    loading: boolean;
    profile: UserProfile | null;
    preferences: UserPreferences | null;
    permissions: string[];
  };
  loadUser(userId: string): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  getCurrentUser(): User | null;
}

@Service()
class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false,
    profile: null as UserProfile | null,
    preferences: null as UserPreferences | null,
    permissions: [] as string[]
  };

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private authService: AuthService
  ) {
    // Auto-load user when auth changes
    this.watchAuthChanges();
  }

  private watchAuthChanges(): void {
    subscribe(this.authService.state, () => {
      const userId = this.authService.state.currentUserId;
      if (userId) {
        this.loadUser(userId);
      } else {
        this.clearUser();
      }
    });
  }

  async loadUser(userId: string): Promise<void> {
    if (this.state.currentUser?.id === userId) return; // Already loaded

    this.state.loading = true;
    try {
      const [user, profile, preferences] = await Promise.all([
        this.userRepository.getUser(userId),
        this.userRepository.getProfile(userId),
        this.userRepository.getPreferences(userId)
      ]);

      this.state.currentUser = user;
      this.state.profile = profile;
      this.state.preferences = preferences;
      this.state.permissions = user.roles.flatMap(role => role.permissions);
    } finally {
      this.state.loading = false;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.state.currentUser) return;

    await this.userRepository.updateProfile(this.state.currentUser.id, updates);
    this.state.profile = { ...this.state.profile, ...updates };
  }

  getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  private clearUser(): void {
    this.state.currentUser = null;
    this.state.profile = null;
    this.state.preferences = null;
    this.state.permissions = [];
  }
}

// ===== COMPONENTS BECOME PURE TEMPLATES =====

// Component interface - ONLY services, NO data props!
interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
  };
}

// Pure template component - no props, no effects, no state management!
export function UserProfile({ services: { userService } }: UserProfileProps) {
  // Everything comes from service state - component is just a template
  const user = userService.state.currentUser;
  const loading = userService.state.loading;
  const profile = userService.state.profile;
  const permissions = userService.state.permissions;

  if (loading) return <ProfileSkeleton />;
  if (!user) return <LoginPrompt />;

  return (
    <div className="user-profile">
      <ProfileHeader user={user} />
      <ProfileDetails profile={profile} />
      {permissions.includes('edit') && (
        <ProfileEditor
          profile={profile}
          onSave={(updates) => userService.updateProfile(updates)}
        />
      )}
    </div>
  );
}

// ===== EVEN NESTED COMPONENTS NEED NO PROPS =====

interface ProfileHeaderProps {
  services: {
    userService: Inject<UserServiceInterface>;
    themeService: Inject<ThemeService>;
  };
}

function ProfileHeader({ services: { userService, themeService } }: ProfileHeaderProps) {
  // Gets everything from services - no prop drilling!
  const user = userService.state.currentUser;
  const theme = themeService.state.currentTheme;

  return (
    <header className={`profile-header profile-header--${theme}`}>
      <Avatar src={user?.avatar} size="large" />
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <StatusBadge status={user?.status} />
    </header>
  );
}

// ===== COMPLETE APP ARCHITECTURE: ZERO PROP DRILLING =====

// App root - no props to pass down!
interface AppProps {
  services: {
    authService: Inject<AuthService>;
    routerService: Inject<RouterService>;
    themeService: Inject<ThemeService>;
  };
}

function App({ services: { authService, routerService, themeService } }: AppProps) {
  const isAuthenticated = authService.state.isAuthenticated;
  const currentRoute = routerService.state.currentRoute;
  const theme = themeService.state.currentTheme;

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className={`app theme-${theme}`}>
      <Navigation />
      <main>
        {currentRoute === '/profile' && <UserProfile />}
        {currentRoute === '/dashboard' && <Dashboard />}
        {currentRoute === '/settings' && <Settings />}
      </main>
    </div>
  );
}

// Navigation - knows current route without props!
interface NavigationProps {
  services: {
    routerService: Inject<RouterService>;
    userService: Inject<UserServiceInterface>;
  };
}

function Navigation({ services: { routerService, userService } }: NavigationProps) {
  const currentRoute = routerService.state.currentRoute;
  const user = userService.state.currentUser;

  return (
    <nav className="navigation">
      <NavItem
        route="/dashboard"
        active={currentRoute === '/dashboard'}
        onClick={() => routerService.navigate('/dashboard')}
      >
        Dashboard
      </NavItem>
      <NavItem
        route="/profile"
        active={currentRoute === '/profile'}
        onClick={() => routerService.navigate('/profile')}
      >
        Profile
      </NavItem>
      <UserMenu user={user} />
    </nav>
  );
}

// ===== ADDITIONAL SERVICES FOR COMPLETE ARCHITECTURE =====

@Service()
class AuthService {
  state = {
    currentUserId: null as string | null,
    isAuthenticated: false,
    token: null as string | null
  };

  async login(credentials: LoginCredentials): Promise<void> {
    const { user, token } = await this.authRepository.login(credentials);
    this.state.currentUserId = user.id;
    this.state.isAuthenticated = true;
    this.state.token = token;
  }

  logout(): void {
    this.state.currentUserId = null;
    this.state.isAuthenticated = false;
    this.state.token = null;
  }
}

@Service()
class RouterService {
  state = {
    currentRoute: '/' as string,
    history: [] as string[]
  };

  navigate(route: string): void {
    this.state.history.push(this.state.currentRoute);
    this.state.currentRoute = route;
    window.history.pushState({}, '', route);
  }

  goBack(): void {
    const previousRoute = this.state.history.pop();
    if (previousRoute) {
      this.state.currentRoute = previousRoute;
      window.history.back();
    }
  }
}

@Service()
class ThemeService {
  state = {
    currentTheme: 'light' as 'light' | 'dark',
    systemPreference: 'light' as 'light' | 'dark'
  };

  setTheme(theme: 'light' | 'dark'): void {
    this.state.currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }

  toggleTheme(): void {
    const newTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}

// ===== WHAT TDI2 GENERATES (AFTER TRANSFORMATION) =====

// Before transformation (what you write):
export function UserProfile({ services: { userService } }: UserProfileProps) {
  const user = userService.state.currentUser;
  return <div>{user?.name}</div>;
}

// After TDI2 transformation (what gets executed):
export function UserProfile() {
  // TDI2-TRANSFORMED: UserProfile - Generated: 2025-06-30T10:30:00.000Z
  const userService = useService('UserService'); // Valtio-proxied service

  // Valtio automatically tracks state access and triggers re-renders
  const userSnap = useSnapshot(userService.state);

  return <div>{userSnap.currentUser?.name}</div>;
}

// ===== THE RESULT: COMPONENTS ARE PURE TEMPLATES =====

/*
✅ BENEFITS OF THIS ARCHITECTURE:

1. **Zero Prop Drilling**: No props passed between components
2. **Automatic State Sync**: All components automatically stay in sync
3. **Pure Templates**: Components only contain rendering logic
4. **Service-Oriented**: All business logic lives in services
5. **Easy Testing**: Mock services, not component props
6. **Better Performance**: Valtio's fine-grained reactivity
7. **Type Safety**: Full TypeScript inference throughout
8. **Maintainable**: Clear separation of concerns

❌ ELIMINATED PROBLEMS:

- Prop drilling hell
- useEffect dependency arrays
- Manual state synchronization
- Component coupling
- Testing complexity
- Performance optimization headaches
*/
```
