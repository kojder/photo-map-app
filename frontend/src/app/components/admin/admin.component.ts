import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { PageInfo } from '../../models/photo.model';

interface PendingRoleChange {
  userId: number;
  newRole: 'USER' | 'ADMIN';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  users = signal<User[]>([]);
  usersLoading = signal<boolean>(false);
  currentUserId = signal<number | null>(null);
  pendingRoleChanges = signal<Map<number, 'USER' | 'ADMIN'>>(new Map());

  usersPage = signal<PageInfo>({
    size: 10,
    number: 0,
    totalElements: 0,
    totalPages: 0
  });

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId.set(user.id);
      }
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 0): void {
    this.usersLoading.set(true);
    this.adminService.getUsers(page, 10).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.usersPage.set(response.page);
        this.usersLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.usersLoading.set(false);
      }
    });
  }

  onRoleSelect(userId: number, newRole: string): void {
    if (newRole !== 'USER' && newRole !== 'ADMIN') {
      return;
    }

    const changes = new Map(this.pendingRoleChanges());
    changes.set(userId, newRole as 'USER' | 'ADMIN');
    this.pendingRoleChanges.set(changes);
  }

  hasRoleChange(userId: number): boolean {
    return this.pendingRoleChanges().has(userId);
  }

  getSelectedRole(user: User): 'USER' | 'ADMIN' {
    return this.pendingRoleChanges().get(user.id) || user.role;
  }

  onSaveRoleChange(user: User): void {
    const newRole = this.pendingRoleChanges().get(user.id);
    if (!newRole) {
      return;
    }

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updatedUser) => {
        const currentUsers = this.users();
        const index = currentUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.users.set([...currentUsers]);
        }

        const changes = new Map(this.pendingRoleChanges());
        changes.delete(user.id);
        this.pendingRoleChanges.set(changes);
      },
      error: (error) => {
        console.error('Failed to update user role:', error);
        alert('Failed to update user role. Please try again.');
        this.loadUsers(this.usersPage().number);
      }
    });
  }

  onCancelRoleChange(userId: number): void {
    const changes = new Map(this.pendingRoleChanges());
    changes.delete(userId);
    this.pendingRoleChanges.set(changes);
  }

  onDeleteUser(user: User): void {
    if (user.id === this.currentUserId()) {
      alert('You cannot delete your own admin account!');
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${user.email}"?\n\n` +
      `This will permanently delete:\n` +
      `- User account\n` +
      `- All user's photos (${user.totalPhotos || 0} photos)\n` +
      `- All associated data\n\n` +
      `This action cannot be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers(this.usersPage().number);
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    });
  }

  onUsersPageChange(page: number): void {
    this.loadUsers(page);
  }

  getUsersEndIndex(): number {
    const page = this.usersPage();
    return Math.min((page.number + 1) * page.size, page.totalElements);
  }
}
