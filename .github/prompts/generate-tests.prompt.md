---
description: "Generate unit tests for selected code (backend: JUnit/Mockito, frontend: Jasmine/Karma)"
mode: agent
---

# Generate Unit Tests

Generate comprehensive unit tests for the selected code following project testing standards.

## Requirements

- **Backend (Java):** JUnit 5 + Mockito + AssertJ
- **Frontend (TypeScript):** Jasmine + Karma
- **Coverage target:** >70%
- **Naming:** `ShouldXxxWhenYyy` pattern

## Backend Test Pattern (Spring Boot)

```java
@ExtendWith(MockitoExtension.class)
class ServiceNameTest {
    @Mock
    private DependencyRepository repository;
    
    @InjectMocks
    private ServiceName service;
    
    @Test
    void shouldReturnEntityWhenIdExists() {
        // given
        final Long id = 1L;
        final Entity entity = new Entity();
        when(repository.findById(id)).thenReturn(Optional.of(entity));
        
        // when
        final Optional<Entity> result = service.getById(id);
        
        // then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(entity);
        verify(repository).findById(id);
    }
}
```

## Frontend Test Pattern (Angular)

```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;
  let mockService: jasmine.SpyObj<ServiceName>;
  
  beforeEach(() => {
    mockService = jasmine.createSpyObj('ServiceName', ['method']);
    
    TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [
        { provide: ServiceName, useValue: mockService }
      ]
    });
    
    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });
  
  it('should do something when condition met', () => {
    // Arrange
    mockService.method.and.returnValue(of(data));
    
    // Act
    component.someMethod();
    
    // Assert
    expect(component.property).toBe(expectedValue);
    expect(mockService.method).toHaveBeenCalled();
  });
});
```

## Test Coverage Requirements

For selected code, generate tests covering:

1. **Happy path** - normal execution flow
2. **Edge cases** - boundary conditions, empty inputs
3. **Error cases** - exceptions, validation failures
4. **Integration points** - mocked dependencies verified

## Instructions

1. Analyze selected code (service method, component, function)
2. Identify:
   - Dependencies to mock
   - Input parameters and variations
   - Expected outputs
   - Error conditions
3. Generate test class/suite with:
   - Setup (mocks, test data)
   - Multiple test cases (happy path + edge cases + errors)
   - Proper assertions and verifications
4. Follow naming convention: `shouldDoSomethingWhenCondition`
5. Use `final` keyword (Java), proper types (TypeScript)

## Example Usage

Select code in editor, then run:
```
/generate-tests
```

Output: Complete test file ready to save in `/test/` directory.
