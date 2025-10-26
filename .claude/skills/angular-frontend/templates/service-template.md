# Service with State Management Checklist

Use this checklist when creating a new Angular service with state management (BehaviorSubject pattern).

## Service Setup

- [ ] `@Injectable({ providedIn: 'root' })` - singleton service
- [ ] Use `inject()` for dependency injection (NOT constructor)
- [ ] All injected dependencies are `readonly`
- [ ] Example: `private readonly http = inject(HttpClient);`

## State Management (BehaviorSubject Pattern)

### Private State

- [ ] Create private `BehaviorSubject` for each state property
- [ ] Provide initial value in constructor
- [ ] Example: `private readonly itemsSubject = new BehaviorSubject<Item[]>([]);`
- [ ] Use descriptive names ending with `Subject`

### Public Observable

- [ ] Expose public Observable (NOT BehaviorSubject directly)
- [ ] Use `asObservable()` to create public stream
- [ ] Example: `readonly items$ = this.itemsSubject.asObservable();`
- [ ] Use `$` suffix for Observables (convention)
- [ ] Make Observable `readonly` to prevent reassignment

### State Update Methods

- [ ] Create public methods to update state
- [ ] Use `.next()` to update BehaviorSubject
- [ ] Example: `updateItems(items: Item[]): void { this.itemsSubject.next(items); }`
- [ ] Consider optimistic updates for better UX

### Synchronous Getters

- [ ] Provide synchronous getter for current value (optional)
- [ ] Use `.value` property of BehaviorSubject
- [ ] Example: `get currentItems(): Item[] { return this.itemsSubject.value; }`

## HTTP Methods

- [ ] All HTTP methods return `Observable<T>`
- [ ] Explicit return types for all methods
- [ ] Use `HttpParams` for query parameters
- [ ] Use `FormData` for file uploads
- [ ] Handle errors with `catchError` operator
- [ ] Log errors for debugging

## Error Handling

- [ ] Use `catchError` operator in HTTP calls
- [ ] Transform API errors to user-friendly messages
- [ ] Consider retry logic for transient failures (`retry(n)`)
- [ ] Emit errors through error subject or throw for component handling

## TypeScript Best Practices

- [ ] Explicit return types for all public methods
- [ ] Use `readonly` for injected services
- [ ] Use `const` for local variables
- [ ] Type-safe interfaces for API requests/responses
- [ ] No implicit `any` types

## Example Service Structure

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MyService {
  // Dependency injection
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/items';

  // Private BehaviorSubject (internal state)
  private readonly itemsSubject = new BehaviorSubject<Item[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Public Observables (expose to components)
  readonly items$ = this.itemsSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  // CRUD methods
  getItems(filters?: ItemFilters): Observable<Item[]> {
    let params = new HttpParams();
    if (filters?.category) {
      params = params.set('category', filters.category);
    }

    return this.http.get<Item[]>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Failed to load items:', error);
        return throwError(() => new Error('Failed to load items'));
      })
    );
  }

  getItemById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  createItem(item: CreateItemDto): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item).pipe(
      tap(newItem => {
        // Optimistic update - add to local state
        const current = this.itemsSubject.value;
        this.itemsSubject.next([...current, newItem]);
      }),
      catchError(error => {
        console.error('Failed to create item:', error);
        return throwError(() => error);
      })
    );
  }

  updateItem(id: number, updates: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, updates).pipe(
      tap(updatedItem => {
        // Update local state
        const current = this.itemsSubject.value;
        const updated = current.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        this.itemsSubject.next(updated);
      })
    );
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove from local state
        const current = this.itemsSubject.value;
        this.itemsSubject.next(current.filter(item => item.id !== id));
      })
    );
  }

  // State management methods
  loadItems(filters?: ItemFilters): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.getItems(filters).subscribe({
      next: (items) => {
        this.itemsSubject.next(items);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.errorSubject.next('Failed to load items');
        this.loadingSubject.next(false);
        console.error('Load items error:', error);
      }
    });
  }

  // Synchronous getters
  get currentItems(): Item[] {
    return this.itemsSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get currentError(): string | null {
    return this.errorSubject.value;
  }
}
```

## Testing Considerations

- [ ] All public methods are testable
- [ ] BehaviorSubject can be mocked in tests
- [ ] HTTP calls use HttpClientTestingModule
- [ ] Synchronous getters allow easy assertions

## Final Checks

- [ ] Service compiles without errors
- [ ] No memory leaks (BehaviorSubject properly cleaned up)
- [ ] Error handling implemented
- [ ] Type safety throughout
- [ ] Observable naming convention followed (`$` suffix)
- [ ] BehaviorSubject is PRIVATE, Observable is PUBLIC
