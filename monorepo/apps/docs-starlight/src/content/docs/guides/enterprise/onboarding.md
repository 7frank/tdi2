---
title: Team Onboarding Guide
description: Fast-track new developers to TDI2 productivity with structured learning paths, hands-on exercises, and team integration strategies.
---

# Team Onboarding Guide
## Fast-Track Developers to TDI2 Productivity

Get new team members productive with TDI2 in days, not weeks, using proven onboarding strategies and hands-on learning paths.

<div class="feature-highlight">
  <h3>🎯 Onboarding Goals</h3>
  <ul>
    <li><strong>Day 1-2</strong> - Understanding TDI2 concepts and architecture</li>
    <li><strong>Day 3-5</strong> - Building first service and component</li>
    <li><strong>Week 2</strong> - Contributing to team codebase independently</li>
    <li><strong>Week 3</strong> - Mentoring next new team member</li>
  </ul>
</div>

---

## 5-Day Learning Path

### Day 1: Architecture & Concepts (4 hours)

#### Morning Session (2 hours): Core Concepts
**📚 Required Reading:**
- [Quick Start Guide](../../getting-started/quick-start/) - Hands-on tutorial
- [Service Patterns](../../patterns/service-patterns/) - Essential patterns

**🎯 Learning Objectives:**
- Understand service-oriented architecture vs component-centric
- Grasp dependency injection and reactive state concepts
- Recognize benefits over traditional React patterns

**✅ Knowledge Check:**
- Explain the difference between Controllers and Services
- Describe how dependency injection eliminates props drilling
- Identify when to use reactive state vs local component state

#### Afternoon Session (2 hours): Hands-On Setup
**🔧 Practical Exercise:**
```bash
# 1. Set up development environment
git clone [team-repository]
cd [project-name]
bun install

# 2. Run existing application
bun run dev

# 3. Explore codebase structure
src/
├── services/interfaces/     # Study existing service contracts
├── services/implementations/ # Review service implementations
└── components/              # See how components use services
```

**🎯 Exercise Goals:**
- Successfully run the application locally
- Navigate the service-oriented codebase structure
- Identify patterns in existing services and components

### Day 2: Service Development (6 hours)

#### Morning Session (3 hours): Build Your First Service

**🔧 Guided Exercise: NotificationService**
```typescript
// 1. Define interface
interface NotificationServiceInterface {
  state: {
    notifications: Notification[];
    unreadCount: number;
  };
  showSuccess(message: string): void;
  showError(message: string): void;
  markAsRead(id: string): void;
  clearAll(): void;
}

// 2. Implement service
@Service()
export class NotificationService implements NotificationServiceInterface {
  state = {
    notifications: [] as Notification[],
    unreadCount: 0
  };

  showSuccess(message: string): void {
    const notification = {
      id: Date.now().toString(),
      type: 'success' as const,
      message,
      timestamp: new Date(),
      read: false
    };
    
    this.state.notifications.push(notification);
    this.state.unreadCount++;
  }

  // Complete implementation...
}
```

#### Afternoon Session (3 hours): Testing & Integration

**🧪 Write Service Tests:**
```typescript
describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
  });

  it('should add success notification', () => {
    notificationService.showSuccess('Test message');
    
    expect(notificationService.state.notifications).toHaveLength(1);
    expect(notificationService.state.notifications[0].type).toBe('success');
    expect(notificationService.state.unreadCount).toBe(1);
  });
});
```

**🔗 Create Component Integration:**
```typescript
function NotificationCenter({ notificationService }: {
  notificationService: Inject<NotificationServiceInterface>;
}) {
  const { notifications, unreadCount } = notificationService.state;
  
  return (
    <div className="notification-center">
      <div className="unread-count">{unreadCount}</div>
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          onMarkRead={() => notificationService.markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}
```

### Day 3: Real Feature Development (8 hours)

#### Full-Day Project: Product Wishlist Feature

**🎯 Project Scope:**
Implement complete wishlist functionality for e-commerce application

**📋 Requirements:**
- Add/remove products from wishlist
- Persist wishlist across sessions
- Show wishlist count in header
- Display wishlist page with product grid

**🔧 Implementation Steps:**

1. **Service Interface Design**
2. **Repository Implementation** (API + LocalStorage)
3. **Service Implementation** with business logic
4. **Component Integration** 
5. **Testing Suite** (service + component tests)
6. **Code Review** with senior team member

### Day 4: Team Integration (6 hours)

#### Morning Session (3 hours): Codebase Exploration

**🔍 Guided Code Review:**
- Review existing team services and patterns
- Understand cross-service communication
- Learn team-specific conventions and standards

**🎯 Team-Specific Learning:**
- Service ownership boundaries
- Testing patterns and coverage requirements
- Code review process and quality gates

#### Afternoon Session (3 hours): Collaborative Development

**👥 Pair Programming Session:**
- Work with senior developer on existing feature
- Contribute to ongoing sprint work
- Learn debugging and performance optimization techniques

### Day 5: Independent Contribution (8 hours)

#### Solo Development Day

**🎯 Assigned Task:**
Complete a small but real feature from the team backlog

**✅ Success Criteria:**
- Write complete service interface and implementation
- Create necessary components with service injection
- Write comprehensive tests (90%+ coverage)
- Submit pull request following team standards
- Receive approval from senior team member

---

## Learning Resources

### Essential Documentation
- **[Service Patterns](../../patterns/service-patterns/)** - Master service design
- **[Component Transformation](../component-transformation/)** - Convert existing components
- **[Controller vs Service](../architecture/controller-service-pattern/)** - Architectural boundaries
- **[Testing Guide](../../packages/di-core/testing/)** - Testing strategies

### Interactive Examples
- **[Complete E-Commerce App](https://github.com/7frank/tdi2/tree/main/examples/ecommerce-app)** - Production-quality example
- **[Interactive Demos](https://github.com/7frank/tdi2/tree/main/monorepo/apps/di-test-harness)** - Live code transformation examples

### Team Resources
- **Code Review Checklist** - Team-specific quality standards
- **Service Design Templates** - Accelerate interface creation
- **Testing Templates** - Standard test patterns for services and components

---

## Mentorship Program

### Mentor Responsibilities
- **Daily Check-ins** during first week
- **Code Review** of all exercises and assignments
- **Pair Programming** sessions for complex concepts
- **Knowledge Validation** through practical exercises

### Mentee Expectations
- **Complete Daily Objectives** within allocated time
- **Ask Questions** when concepts are unclear
- **Practice Beyond Exercises** with additional problems
- **Document Learnings** for team knowledge base

---

## Team Integration Checklist

### Week 1: Foundation
- [ ] Complete 5-day learning path
- [ ] Pass knowledge assessment quiz
- [ ] Submit first feature for code review
- [ ] Join team ceremonies (standup, planning, retro)

### Week 2: Contribution
- [ ] Complete assigned sprint tasks independently
- [ ] Participate actively in code reviews
- [ ] Help debug team issues using TDI2 patterns
- [ ] Suggest improvements to team processes

### Week 3: Leadership
- [ ] Mentor next new team member
- [ ] Lead feature development from design to deployment
- [ ] Contribute to team documentation and knowledge sharing
- [ ] Identify opportunities for TDI2 pattern improvements

---

## Assessment Framework

### Knowledge Assessment (Day 2)
**Service Design Quiz (10 questions):**
- When to use Controllers vs Services
- Proper dependency injection patterns
- Testing strategy for different service types

### Practical Assessment (Day 5)
**Feature Implementation Rubric:**
- Service interface design quality
- Implementation following team patterns
- Test coverage and quality
- Code review feedback incorporation

### Team Integration Assessment (Week 2)
**Contribution Quality Metrics:**
- Sprint velocity and task completion
- Code review participation and quality
- Team collaboration and communication

---

## Common Learning Challenges

### Challenge 1: "I Miss Redux DevTools"
**Solution**: Show Valtio DevTools and reactive debugging techniques
**Practice**: Debug service state changes in real application

### Challenge 2: "When Do I Use Controllers vs Services?"
**Solution**: Provide clear decision tree and examples
**Practice**: Refactor existing mixed component into Controller + Service

### Challenge 3: "Testing Feels Different"
**Solution**: Emphasize simplicity - test services directly, not through React
**Practice**: Write tests for increasingly complex service interactions

---

## Success Metrics

### Individual Success
- [ ] Completes onboarding path in 5 days
- [ ] Contributes independently by day 8
- [ ] Mentors next developer by day 15
- [ ] Achieves 90%+ team satisfaction score

### Team Success
- [ ] New developer productive within 1 week
- [ ] Zero onboarding-related delays to sprint commitments
- [ ] Consistent code quality across all team members
- [ ] Knowledge sharing culture established

---

## Next Steps

### For New Developers
- **[Migration Examples](../migration/strategy/)** - Learn from real migration scenarios
- **[Enterprise Patterns](../enterprise/implementation/)** - Scale knowledge to enterprise context

### For Team Leads
- **[Quality Standards](https://github.com/7frank/tdi2/tree/main/quality-gates)** - Implement automated quality checks
- **[Team Organization](https://github.com/7frank/tdi2/tree/main/examples/team-boundaries)** - Optimize team boundaries and service ownership

<div class="example-container">
  <div class="example-title">🎯 Key Takeaway</div>
  <p>Successful onboarding combines structured learning with hands-on practice. Focus on practical contribution rather than theoretical knowledge.</p>
</div>