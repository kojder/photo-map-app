import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'isLoggedIn'], {
      isAuthenticated$: of(false),
      currentUser$: of(null)
    });
    authServiceSpy.isLoggedIn.and.returnValue(false);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Mobile Menu', () => {
    it('should initialize with mobile menu closed', () => {
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should toggle mobile menu open', () => {
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);
    });

    it('should toggle mobile menu closed', () => {
      component.mobileMenuOpen.set(true);
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should close mobile menu explicitly', () => {
      component.mobileMenuOpen.set(true);
      component.closeMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('should keep mobile menu closed when calling closeMobileMenu on already closed menu', () => {
      component.mobileMenuOpen.set(false);
      component.closeMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should call authService.logout when logout is called', () => {
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should navigate to /login after logout', () => {
      component.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call logout and navigate in correct order', () => {
      const logoutSpy = authService.logout;
      const navigateSpy = router.navigate;
      
      component.logout();
      
      expect(logoutSpy).toHaveBeenCalledBefore(navigateSpy);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
