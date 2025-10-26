import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { AppSettings } from '../../models/settings.model';
import { RegisterResponse } from '../../models/auth.model';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load admin contact email on init', () => {
    const mockSettings: AppSettings = {
      adminContactEmail: 'admin@test.com'
    };

    fixture.detectChanges();

    const req = httpMock.expectOne('/api/admin/settings');
    expect(req.request.method).toBe('GET');
    req.flush(mockSettings);

    expect(component.adminContactEmail()).toBe('admin@test.com');
  });

  it('should use fallback email when admin settings request fails', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/admin/settings');
    req.error(new ProgressEvent('error'), { status: 403 });

    expect(component.adminContactEmail()).toBe('admin@photomap.local');
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should mark email as invalid when empty', () => {
    const email = component.registerForm.get('email');
    expect(email?.valid).toBeFalsy();
    expect(email?.hasError('required')).toBeTruthy();
  });

  it('should mark email as invalid when not valid email format', () => {
    const email = component.registerForm.get('email');
    email?.setValue('invalid-email');
    expect(email?.valid).toBeFalsy();
    expect(email?.hasError('email')).toBeTruthy();
  });

  it('should mark password as invalid when empty', () => {
    const password = component.registerForm.get('password');
    expect(password?.valid).toBeFalsy();
    expect(password?.hasError('required')).toBeTruthy();
  });

  it('should mark password as invalid when less than 8 characters', () => {
    const password = component.registerForm.get('password');
    password?.setValue('short');
    expect(password?.valid).toBeFalsy();
    expect(password?.hasError('minlength')).toBeTruthy();
  });

  it('should mark confirmPassword as invalid when empty', () => {
    const confirmPassword = component.registerForm.get('confirmPassword');
    expect(confirmPassword?.valid).toBeFalsy();
    expect(confirmPassword?.hasError('required')).toBeTruthy();
  });

  it('should have passwordMismatch error when passwords do not match', () => {
    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('different123');

    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should not have passwordMismatch error when passwords match', () => {
    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalsy();
    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should mark form as valid when all fields are valid and passwords match', () => {
    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');

    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should not call authService.register when form is invalid', () => {
    component.onSubmit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should call authService.register with correct credentials when form is valid', () => {
    const mockResponse: RegisterResponse = {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
      createdAt: '2025-10-24T00:00:00Z'
    };
    authService.register.and.returnValue(of(mockResponse));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');
    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should set registrationSuccess to true after successful registration', () => {
    const mockResponse: RegisterResponse = {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
      createdAt: '2025-10-24T00:00:00Z'
    };
    authService.register.and.returnValue(of(mockResponse));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');
    component.onSubmit();

    expect(component.registrationSuccess()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should set loading to true during registration', () => {
    const mockResponse: RegisterResponse = {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
      createdAt: '2025-10-24T00:00:00Z'
    };
    authService.register.and.returnValue(of(mockResponse));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');

    expect(component.loading()).toBe(false);
    component.onSubmit();

    expect(component.loading()).toBe(false);
  });

  it('should navigate to login page when onLoginClick is called', () => {
    component.onLoginClick();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set errorMessage on registration failure', () => {
    const errorResponse = { error: { message: 'Email already exists' } };
    authService.register.and.returnValue(throwError(() => errorResponse));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Email already exists');
    expect(component.loading()).toBe(false);
  });

  it('should set default error message when registration error response has no message', () => {
    authService.register.and.returnValue(throwError(() => ({ error: {} })));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Registration failed. Email may already exist.');
    expect(component.loading()).toBe(false);
  });


  it('should clear errorMessage when submitting again', () => {
    authService.register.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('password123');
    component.registerForm.get('confirmPassword')?.setValue('password123');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Error');

    const mockResponse: RegisterResponse = {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
      createdAt: '2025-10-24T00:00:00Z'
    };
    authService.register.and.returnValue(of(mockResponse));
    component.onSubmit();

    expect(component.errorMessage()).toBe(null);
  });
});
