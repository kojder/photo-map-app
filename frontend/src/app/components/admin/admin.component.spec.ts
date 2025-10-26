import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { PageResponse } from '../../models/photo.model';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminService: jasmine.SpyObj<AdminService>;
  let authService: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    role: 'USER',
    createdAt: '2025-10-26T00:00:00Z',
    totalPhotos: 5
  };

  const mockCurrentUser: User = {
    id: 2,
    email: 'admin@example.com',
    role: 'ADMIN',
    createdAt: '2025-10-26T00:00:00Z'
  };

  const mockUsersPage: PageResponse<User> = {
    content: [mockUser],
    page: {
      size: 10,
      number: 0,
      totalElements: 1,
      totalPages: 1
    }
  };

  beforeEach(async () => {
    const adminServiceSpy = jasmine.createSpyObj('AdminService', [
      'getUsers',
      'deleteUser',
      'updateUserRole'
    ]);

    currentUserSubject = new BehaviorSubject<User | null>(mockCurrentUser);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: currentUserSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    adminService.getUsers.and.returnValue(of(mockUsersPage));

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    fixture.detectChanges();

    expect(adminService.getUsers).toHaveBeenCalledWith(0, 10);
    expect(component.users().length).toBe(1);
  });

  it('should set current user id from auth service', () => {
    fixture.detectChanges();

    expect(component.currentUserId()).toBe(2);
  });

  it('should track pending role change', () => {
    fixture.detectChanges();

    component.onRoleSelect(mockUser.id, 'ADMIN');

    expect(component.hasRoleChange(mockUser.id)).toBe(true);
    expect(component.getSelectedRole(mockUser)).toBe('ADMIN');
  });

  it('should cancel role change', () => {
    fixture.detectChanges();

    component.onRoleSelect(mockUser.id, 'ADMIN');
    expect(component.hasRoleChange(mockUser.id)).toBe(true);

    component.onCancelRoleChange(mockUser.id);
    expect(component.hasRoleChange(mockUser.id)).toBe(false);
    expect(component.getSelectedRole(mockUser)).toBe('USER');
  });

  it('should save role change', () => {
    const updatedUser: User = { ...mockUser, role: 'ADMIN' };
    adminService.updateUserRole.and.returnValue(of(updatedUser));

    fixture.detectChanges();

    component.onRoleSelect(mockUser.id, 'ADMIN');
    component.onSaveRoleChange(mockUser);

    expect(adminService.updateUserRole).toHaveBeenCalledWith(mockUser.id, 'ADMIN');
    expect(component.users()[0].role).toBe('ADMIN');
    expect(component.hasRoleChange(mockUser.id)).toBe(false);
  });

  it('should handle role change error', () => {
    spyOn(window, 'alert');
    adminService.updateUserRole.and.returnValue(throwError(() => new Error('API error')));
    adminService.getUsers.and.returnValue(of(mockUsersPage));

    fixture.detectChanges();

    component.onRoleSelect(mockUser.id, 'ADMIN');
    component.onSaveRoleChange(mockUser);

    expect(window.alert).toHaveBeenCalledWith('Failed to update user role. Please try again.');
    expect(adminService.getUsers).toHaveBeenCalledTimes(2);
  });

  it('should delete user with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.deleteUser.and.returnValue(of(void 0));
    adminService.getUsers.and.returnValue(of(mockUsersPage));

    fixture.detectChanges();
    component.onDeleteUser(mockUser);

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.deleteUser).toHaveBeenCalledWith(1);
    expect(adminService.getUsers).toHaveBeenCalledTimes(2);
  });

  it('should not delete user if cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    fixture.detectChanges();
    component.onDeleteUser(mockUser);

    expect(adminService.deleteUser).not.toHaveBeenCalled();
  });

  it('should not delete current user', () => {
    spyOn(window, 'alert');
    component.currentUserId.set(1);

    fixture.detectChanges();
    component.onDeleteUser(mockUser);

    expect(adminService.deleteUser).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('You cannot delete your own admin account!');
  });

  it('should change users page', () => {
    adminService.getUsers.and.returnValue(of(mockUsersPage));

    fixture.detectChanges();
    component.onUsersPageChange(1);

    expect(adminService.getUsers).toHaveBeenCalledWith(1, 10);
  });

  it('should calculate users end index correctly', () => {
    fixture.detectChanges();

    expect(component.getUsersEndIndex()).toBe(1);
  });
});
