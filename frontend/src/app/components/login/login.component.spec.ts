import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark email as invalid when empty', () => {
    const email = component.loginForm.get('email');
    expect(email?.valid).toBeFalsy();
    expect(email?.hasError('required')).toBeTruthy();
  });

  it('should mark email as invalid when not valid email format', () => {
    const email = component.loginForm.get('email');
    email?.setValue('invalid-email');
    expect(email?.valid).toBeFalsy();
    expect(email?.hasError('email')).toBeTruthy();
  });

  it('should mark password as invalid when empty', () => {
    const password = component.loginForm.get('password');
    expect(password?.valid).toBeFalsy();
    expect(password?.hasError('required')).toBeTruthy();
  });

  it('should mark password as invalid when less than 8 characters', () => {
    const password = component.loginForm.get('password');
    password?.setValue('short');
    expect(password?.valid).toBeFalsy();
    expect(password?.hasError('minlength')).toBeTruthy();
  });

  it('should mark form as valid when all fields are valid', () => {
    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should not call authService.login when form is invalid', () => {
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with correct credentials when form is valid', () => {
    authService.login.and.returnValue(of({ token: 'fake-token', type: 'Bearer', expiresIn: 3600, user: { id: 1, email: 'test@example.com', role: 'USER', createdAt: '2025-10-24T00:00:00Z' } }));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should navigate to /gallery on successful login', () => {
    authService.login.and.returnValue(of({ token: 'fake-token', type: 'Bearer', expiresIn: 3600, user: { id: 1, email: 'test@example.com', role: 'USER', createdAt: '2025-10-24T00:00:00Z' } }));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/gallery']);
  });

  it('should set loading to true during login', () => {
    authService.login.and.returnValue(of({ token: 'fake-token', type: 'Bearer', expiresIn: 3600, user: { id: 1, email: 'test@example.com', role: 'USER', createdAt: '2025-10-24T00:00:00Z' } }));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');

    expect(component.loading()).toBe(false);
    component.onSubmit();
    expect(component.loading()).toBe(false);
  });

  it('should set errorMessage on login failure', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authService.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('wrong-password');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('should set default error message when error response has no message', () => {
    authService.login.and.returnValue(throwError(() => ({ error: {} })));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('wrong-password');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Login failed. Please check your credentials.');
    expect(component.loading()).toBe(false);
  });

  it('should clear errorMessage when submitting again', () => {
    authService.login.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    component.onSubmit();

    expect(component.errorMessage()).toBe('Error');

    authService.login.and.returnValue(of({ token: 'fake-token', type: 'Bearer', expiresIn: 3600, user: { id: 1, email: 'test@example.com', role: 'USER', createdAt: '2025-10-24T00:00:00Z' } }));
    component.onSubmit();

    expect(component.errorMessage()).toBe(null);
  });
});
