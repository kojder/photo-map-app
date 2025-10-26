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
});
