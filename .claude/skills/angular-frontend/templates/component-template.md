# Standalone Component Checklist

Use this checklist when creating a new Angular 18 standalone component for Photo Map MVP.

## Component Setup

- [ ] `@Component({ standalone: true })` - REQUIRED!
- [ ] `imports: [...]` array with dependencies:
  - [ ] `CommonModule` (for @if, @for, pipes)
  - [ ] `RouterLink` (if using routing)
  - [ ] Child components (if any)
  - [ ] `ReactiveFormsModule` or `FormsModule` (if using forms)
- [ ] `templateUrl` or inline `template` specified
- [ ] `styleUrl` or inline `styles` specified (optional)
- [ ] Unique `selector` (e.g., `app-photo-card`)

## Dependency Injection

- [ ] Use `inject()` function (NOT constructor injection)
- [ ] All injected services are `readonly`
- [ ] Example: `private readonly photoService = inject(PhotoService);`

## Component State

### For Smart Components (Container):
- [ ] Inject services for data/business logic
- [ ] Use Signals for component-local state
  - [ ] `signal()` for writable state
  - [ ] `computed()` for derived state
  - [ ] `effect()` for side effects (optional)
- [ ] Subscribe to service Observables (use `async` pipe in template)

### For Dumb Components (Presentational):
- [ ] NO service injection (except utility services)
- [ ] Use `@Input()` for receiving data
- [ ] Use `@Output()` for emitting events
- [ ] Pure presentation logic only

## Inputs and Outputs

- [ ] All `@Input()` properties have explicit types
- [ ] Required inputs use `!` or default values
- [ ] All `@Output()` properties are `EventEmitter<T>` with explicit type
- [ ] Example: `@Output() photoClick = new EventEmitter<number>();`

## Lifecycle Hooks

- [ ] Implement interfaces if using hooks:
  - [ ] `OnInit` → `ngOnInit()`
  - [ ] `AfterViewInit` → `ngAfterViewInit()`
  - [ ] `OnDestroy` → `ngOnDestroy()`
  - [ ] `OnChanges` → `ngOnChanges(changes: SimpleChanges)`
- [ ] Cleanup in `ngOnDestroy()` if manual subscriptions exist
  - [ ] Unsubscribe from Observables
  - [ ] Clear timers/intervals
  - [ ] Remove event listeners

## Template

- [ ] Use modern control flow:
  - [ ] `@if` instead of `*ngIf`
  - [ ] `@for` with `track` instead of `*ngFor`
  - [ ] `@switch` instead of `*ngSwitch`
- [ ] Add `data-testid` attributes to all interactive elements
  - [ ] Format: `data-testid="component-element-action"`
  - [ ] Example: `data-testid="photo-card-rate-button"`
  - [ ] Use kebab-case (NOT camelCase)

## Styling

- [ ] Use Tailwind CSS utilities (preferred)
- [ ] Component styles only for complex patterns
- [ ] Responsive breakpoints: `sm:`, `md:`, `lg:`
- [ ] Mobile-first approach
- [ ] Touch targets ≥ 48px for mobile

## TypeScript Best Practices

- [ ] All properties have explicit types (no implicit `any`)
- [ ] Use `readonly` for injected services
- [ ] Use `const` for local variables that won't be reassigned
- [ ] Explicit return types for public methods
- [ ] Use utility types where appropriate (Partial, Required, Pick, Omit)

## Testing Considerations

- [ ] Test IDs on all interactive elements
- [ ] Public methods are testable
- [ ] No private methods that need direct testing
- [ ] Dependencies can be mocked (inject() pattern)

## Example Component Structure

```typescript
import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyService } from '../../services/my.service';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.css'
})
export class MyComponent implements OnInit {
  // Dependency injection
  private readonly myService = inject(MyService);

  // Inputs (for dumb components)
  @Input() data!: DataType;

  // Outputs (for dumb components)
  @Output() action = new EventEmitter<ActionType>();

  // State (Signals)
  loading = signal(false);
  items = signal<Item[]>([]);

  // Computed state
  filteredItems = computed(() => {
    return this.items().filter(item => item.active);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.myService.getData().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.loading.set(false);
      }
    });
  }

  onAction(id: number): void {
    this.action.emit(id);
  }
}
```

## Final Checks

- [ ] Component compiles without errors (`ng build`)
- [ ] Component passes linting (`ng lint`)
- [ ] All imports are used (no unused imports)
- [ ] No console errors when component renders
- [ ] Responsive on mobile, tablet, desktop
- [ ] Test IDs present for E2E testing
