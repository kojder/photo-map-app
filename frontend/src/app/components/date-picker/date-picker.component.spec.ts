import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize flatpickr on init', () => {
    expect(component['flatpickrInstance']).toBeDefined();
  });

  it('should render input with placeholder', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('dd.mm.yyyy');
  });

  it('should apply custom placeholder', () => {
    component.placeholder = 'Select date';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Select date');
  });

  it('should apply custom testId', () => {
    component.testId = 'custom-date-picker';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('data-testid')).toBe('custom-date-picker');
  });

  it('should apply custom CSS classes', () => {
    const customClass = 'custom-input-class';
    component.inputClass = customClass;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.className).toContain('custom-input-class');
  });

  it('should set date value via writeValue', () => {
    const testDate = '2025-10-30';
    component.writeValue(testDate);
    
    // Flatpickr should have the date set
    expect(component['flatpickrInstance']?.selectedDates.length).toBe(1);
    const selectedDate = component['flatpickrInstance']?.selectedDates[0];
    expect(selectedDate?.getFullYear()).toBe(2025);
    expect(selectedDate?.getMonth()).toBe(9); // October (0-indexed)
    expect(selectedDate?.getDate()).toBe(30);
  });

  it('should clear date when writeValue receives empty string', () => {
    // First set a date
    component.writeValue('2025-10-30');
    expect(component['flatpickrInstance']?.selectedDates.length).toBe(1);
    
    // Then clear it
    component.writeValue('');
    expect(component['flatpickrInstance']?.selectedDates.length).toBe(0);
  });

  it('should emit dateChange when date is selected', (done) => {
    component.dateChange.subscribe((date: string) => {
      expect(date).toBe('2025-10-30');
      done();
    });

    // Simulate flatpickr onChange
    const testDate = new Date(2025, 9, 30); // October 30, 2025
    component['flatpickrInstance']?.setDate(testDate, true); // true = trigger onChange
  });

  it('should emit empty string when date is cleared', (done) => {
    // First set a date
    component.writeValue('2025-10-30');
    
    // Then listen for clear event
    component.dateChange.subscribe((date: string) => {
      if (date === '') {
        done();
      }
    });

    component['flatpickrInstance']?.clear();
  });

  it('should register onChange callback', () => {
    const mockFn = jasmine.createSpy('onChange');
    component.registerOnChange(mockFn);
    
    // Trigger date change
    const testDate = new Date(2025, 9, 30);
    component['flatpickrInstance']?.setDate(testDate, true);
    
    expect(mockFn).toHaveBeenCalledWith('2025-10-30');
  });

  it('should register onTouched callback', () => {
    const mockFn = jasmine.createSpy('onTouched');
    component.registerOnTouched(mockFn);
    
    // Trigger close event (simulates user interaction)
    component['flatpickrInstance']?.close();
    
    expect(mockFn).toHaveBeenCalled();
  });

  it('should disable picker when setDisabledState is called', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    
    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('should destroy flatpickr instance on component destroy', () => {
    const destroySpy = jasmine.createSpy('destroy');
    if (component['flatpickrInstance']) {
      component['flatpickrInstance'].destroy = destroySpy;
    }
    
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should format date to yyyy-MM-dd for backend API', (done) => {
    component.dateChange.subscribe((date: string) => {
      // Check format: yyyy-MM-dd
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(date).toBe('2025-10-30');
      done();
    });

    const testDate = new Date(2025, 9, 30);
    component['flatpickrInstance']?.setDate(testDate, true);
  });

  // Edge cases and Polish locale tests
  describe('Date Format Edge Cases', () => {
    it('should pad single-digit day with zero', (done) => {
      component.dateChange.subscribe((date: string) => {
        expect(date).toBe('2025-10-03'); // Not 2025-10-3
        done();
      });

      const testDate = new Date(2025, 9, 3); // October 3
      component['flatpickrInstance']?.setDate(testDate, true);
    });

    it('should pad single-digit month with zero', (done) => {
      component.dateChange.subscribe((date: string) => {
        expect(date).toBe('2025-01-15'); // Not 2025-1-15
        done();
      });

      const testDate = new Date(2025, 0, 15); // January 15
      component['flatpickrInstance']?.setDate(testDate, true);
    });

    it('should handle leap year dates correctly', (done) => {
      component.dateChange.subscribe((date: string) => {
        expect(date).toBe('2024-02-29'); // Leap year
        done();
      });

      const testDate = new Date(2024, 1, 29); // February 29, 2024
      component['flatpickrInstance']?.setDate(testDate, true);
    });

    it('should handle year boundary correctly', (done) => {
      component.dateChange.subscribe((date: string) => {
        expect(date).toBe('2025-12-31');
        done();
      });

      const testDate = new Date(2025, 11, 31); // December 31
      component['flatpickrInstance']?.setDate(testDate, true);
    });
  });

  describe('Polish Locale Integration', () => {
    it('should use Polish locale for flatpickr', () => {
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.locale).toBeDefined();
      // Polish locale should be set (flatpickr uses locale object, not string)
    });

    it('should display date in d.m.Y format (dd.MM.yyyy)', () => {
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.dateFormat).toBe('d.m.Y');
    });

    it('should allow manual input', () => {
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.allowInput).toBe(true);
    });

    it('should enable mobile-friendly calendar', () => {
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.disableMobile).toBe(false);
    });
  });

  describe('ControlValueAccessor Integration', () => {
    it('should work with ngModel binding', () => {
      const mockOnChange = jasmine.createSpy('onChange');
      component.registerOnChange(mockOnChange);

      const testDate = new Date(2025, 9, 30);
      component['flatpickrInstance']?.setDate(testDate, true);

      expect(mockOnChange).toHaveBeenCalledWith('2025-10-30');
    });

    it('should handle null value gracefully', () => {
      expect(() => {
        component.writeValue(null as any);
      }).not.toThrow();
    });

    it('should handle undefined value gracefully', () => {
      expect(() => {
        component.writeValue(undefined as any);
      }).not.toThrow();
    });

    it('should not trigger onChange when writeValue is called', () => {
      const mockOnChange = jasmine.createSpy('onChange');
      component.registerOnChange(mockOnChange);

      component.writeValue('2025-10-30');

      // writeValue should NOT trigger onChange (false parameter in setDate)
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable click opening when disabled', () => {
      component.setDisabledState(true);
      
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.clickOpens).toBe(false);
    });

    it('should enable click opening when not disabled', () => {
      component.setDisabledState(false);
      
      const flatpickrConfig = component['flatpickrInstance']?.config;
      expect(flatpickrConfig?.clickOpens).toBe(true);
    });

    it('should set disabled attribute on input', () => {
      component.disabled = true;
      fixture.detectChanges();
      
      const input = fixture.nativeElement.querySelector('input');
      expect(input.disabled).toBe(true);
    });
  });

  describe('Timezone Handling', () => {
    it('should handle dates without timezone offset', () => {
      const testDate = '2025-10-30'; // No time component
      
      expect(() => {
        component.writeValue(testDate);
      }).not.toThrow();

      const selectedDate = component['flatpickrInstance']?.selectedDates[0];
      expect(selectedDate?.getFullYear()).toBe(2025);
      expect(selectedDate?.getMonth()).toBe(9);
      expect(selectedDate?.getDate()).toBe(30);
    });

    it('should handle dates at midnight correctly', (done) => {
      component.dateChange.subscribe((date: string) => {
        expect(date).toBe('2025-10-30');
        done();
      });

      const testDate = new Date(2025, 9, 30, 0, 0, 0); // Midnight
      component['flatpickrInstance']?.setDate(testDate, true);
    });
  });
});
