import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AdminService } from './admin.service';
import { User } from '../models/user.model';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    role: 'USER',
    createdAt: '2025-10-26T00:00:00Z',
    totalPhotos: 5
  };

  const mockSpringPage = {
    content: [mockUser],
    pageable: {
      pageNumber: 0,
      pageSize: 10
    },
    totalElements: 1,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get users with pagination and transform Spring Page to PageResponse', () => {
    service.getUsers(0, 10).subscribe(response => {
      expect(response.content.length).toBe(1);
      expect(response.content[0].email).toBe('user@example.com');
      expect(response.page.size).toBe(10);
      expect(response.page.number).toBe(0);
      expect(response.page.totalElements).toBe(1);
      expect(response.page.totalPages).toBe(1);
    });

    const req = httpMock.expectOne('/api/admin/users?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockSpringPage);
  });

  it('should get users with default parameters', () => {
    service.getUsers().subscribe(response => {
      expect(response.content.length).toBe(1);
      expect(response.content[0].email).toBe('user@example.com');
    });

    const req = httpMock.expectOne('/api/admin/users?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockSpringPage);
  });

  it('should delete user', () => {
    const userId = 1;

    service.deleteUser(userId).subscribe();

    const req = httpMock.expectOne(`/api/admin/users/${userId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should update user role', () => {
    const userId = 1;
    const updatedUser: User = { ...mockUser, role: 'ADMIN' };

    service.updateUserRole(userId, 'ADMIN').subscribe(response => {
      expect(response).toEqual(updatedUser);
      expect(response.role).toBe('ADMIN');
    });

    const req = httpMock.expectOne(`/api/admin/users/${userId}/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush(updatedUser);
  });

  it('should get users with searchEmail parameter', () => {
    const searchEmail = 'test@example.com';

    service.getUsers(0, 10, searchEmail).subscribe(response => {
      expect(response.content.length).toBe(1);
      expect(response.content[0].email).toBe('user@example.com');
    });

    const req = httpMock.expectOne('/api/admin/users?page=0&size=10&searchEmail=test@example.com');
    expect(req.request.method).toBe('GET');
    req.flush(mockSpringPage);
  });

  it('should get users and ignore empty searchEmail', () => {
    service.getUsers(0, 10, '   ').subscribe(response => {
      expect(response.content.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/admin/users?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockSpringPage);
  });

  it('should get users without searchEmail when undefined', () => {
    service.getUsers(0, 10, undefined).subscribe(response => {
      expect(response.content.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/admin/users?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockSpringPage);
  });

  it('should update user permissions', () => {
    const userId = 1;
    const permissions = { canViewPhotos: true, canRate: false };
    const updatedUser: User = { ...mockUser };

    service.updateUserPermissions(userId, permissions).subscribe(response => {
      expect(response).toEqual(updatedUser);
    });

    const req = httpMock.expectOne(`/api/admin/users/${userId}/permissions`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(permissions);
    req.flush(updatedUser);
  });

  it('should get settings', () => {
    const mockSettings = {
      adminContactEmail: 'admin@example.com'
    };

    service.getSettings().subscribe(response => {
      expect(response).toEqual(mockSettings);
      expect(response.adminContactEmail).toBe('admin@example.com');
    });

    const req = httpMock.expectOne('/api/admin/settings');
    expect(req.request.method).toBe('GET');
    req.flush(mockSettings);
  });

  it('should update settings', () => {
    const mockSettings = {
      adminContactEmail: 'newemail@example.com'
    };

    service.updateSettings(mockSettings).subscribe(response => {
      expect(response).toEqual(mockSettings);
      expect(response.adminContactEmail).toBe('newemail@example.com');
    });

    const req = httpMock.expectOne('/api/admin/settings');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockSettings);
    req.flush(mockSettings);
  });
});
