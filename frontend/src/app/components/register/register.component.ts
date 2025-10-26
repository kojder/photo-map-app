import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AppSettings } from '../../models/settings.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  registrationSuccess = signal<boolean>(false);
  adminContactEmail = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadAdminContact();
  }

  loadAdminContact(): void {
    // Try to fetch admin contact email from backend
    // This endpoint requires ADMIN role, so we use fallback on error
    this.http.get<AppSettings>('/api/admin/settings').subscribe({
      next: (settings) => {
        this.adminContactEmail.set(settings.adminContactEmail);
      },
      error: () => {
        // Fallback to default email if endpoint is not accessible
        this.adminContactEmail.set('admin@photomap.local');
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.registrationSuccess.set(true);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message || 'Registration failed. Email may already exist.');
      }
    });
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }
}
