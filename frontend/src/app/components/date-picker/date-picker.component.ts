import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Polish } from 'flatpickr/dist/l10n/pl';
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';

/**
 * Custom date picker component using flatpickr library.
 * Provides consistent dd.MM.yyyy format regardless of browser locale.
 * 
 * Features:
 * - Polish locale (month/day names)
 * - Tailwind CSS styling
 * - Mobile-friendly
 * - Keyboard navigation
 * - Integration with Angular forms (ControlValueAccessor)
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  template: `
    <input 
      #dateInput
      type="text" 
      [placeholder]="placeholder"
      [class]="inputClass"
      [attr.data-testid]="testId"
      [disabled]="disabled"
      readonly
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('dateInput', { static: true }) dateInput!: ElementRef<HTMLInputElement>;
  
  @Input() placeholder = 'dd.mm.yyyy';
  @Input() testId = 'date-picker';
  @Input() inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  @Input() disabled = false;
  
  /**
   * Output event emitting date in yyyy-MM-dd format (for backend API)
   */
  @Output() dateChange = new EventEmitter<string>();

  private flatpickrInstance?: FlatpickrInstance;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.initializeFlatpickr();
  }

  ngOnDestroy(): void {
    this.flatpickrInstance?.destroy();
  }

  private initializeFlatpickr(): void {
    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      dateFormat: 'd.m.Y',  // Display format: dd.MM.yyyy
      locale: Polish,        // Polish month/day names
      altInput: false,       // Don't use alternative input
      allowInput: true,      // Allow manual typing
      clickOpens: true,      // Open on click
      disableMobile: false,  // Enable mobile-optimized calendar
      onChange: (selectedDates, dateStr, instance) => {
        if (selectedDates.length > 0) {
          // Convert to yyyy-MM-dd format for backend API
          const date = selectedDates[0];
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const apiFormat = `${year}-${month}-${day}`;
          
          this.onChange(apiFormat);
          this.dateChange.emit(apiFormat);
        } else {
          this.onChange('');
          this.dateChange.emit('');
        }
      },
      onClose: () => {
        this.onTouched();
      }
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (this.flatpickrInstance) {
      if (value) {
        // Convert yyyy-MM-dd to Date object
        const date = new Date(value + 'T00:00:00'); // Add time to avoid timezone issues
        this.flatpickrInstance.setDate(date, false); // false = don't trigger onChange
      } else {
        this.flatpickrInstance.clear();
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.flatpickrInstance) {
      if (isDisabled) {
        this.flatpickrInstance.set('clickOpens', false);
      } else {
        this.flatpickrInstance.set('clickOpens', true);
      }
    }
  }
}
