import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { PageInfo } from '../../models/photo.model';
import { AppSettings } from '../../models/settings.model';

interface PendingRoleChange {
  userId: number;
  newRole: 'USER' | 'ADMIN';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  users = signal<User[]>([]);
  usersLoading = signal<boolean>(false);
  currentUserId = signal<number | null>(null);
  pendingRoleChanges = signal<Map<number, 'USER' | 'ADMIN'>>(new Map());
  searchQuery = signal<string>('');

  usersPage = signal<PageInfo>({
    size: 10,
    number: 0,
    totalElements: 0,
    totalPages: 0
  });

  selectedUser = signal<User | null>(null);
  pendingPermissionChanges = signal<Map<number, { canViewPhotos: boolean; canRate: boolean }>>(new Map());

  appSettings = signal<AppSettings | null>(null);
  settingsLoadError = signal<boolean>(false);
  editingSettings = signal<boolean>(false);
  editedAdminEmail = signal<string>('');

  notificationMessage = signal<string | null>(null);
  notificationType = signal<'success' | 'error'>('success');
  private notificationTimeout?: number;

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
    this.loadSettings();
  }

  loadUsers(page: number = 0): void {
    this.usersLoading.set(true);
    const search = this.searchQuery() || undefined;
    this.adminService.getUsers(page, 10, search).subscribe({
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

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.loadUsers(0);
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
        this.showNotification('Nie udało się zaktualizować roli użytkownika. Spróbuj ponownie.', 'error');
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
      this.showNotification('Nie możesz usunąć własnego konta administratora!', 'error');
      return;
    }

    const confirmMessage = `Czy na pewno chcesz usunąć użytkownika "${user.email}"?\n\n` +
      `Zostaną trwale usunięte:\n` +
      `- Konto użytkownika\n` +
      `- Wszystkie zdjęcia użytkownika (${user.totalPhotos || 0} zdjęć)\n` +
      `- Wszystkie powiązane dane\n\n` +
      `Ta operacja jest nieodwracalna!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.showNotification('Użytkownik został pomyślnie usunięty.', 'success');
        this.loadUsers(this.usersPage().number);
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
        this.showNotification('Nie udało się usunąć użytkownika. Spróbuj ponownie.', 'error');
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

  onUserRowClick(user: User): void {
    this.selectedUser.set(user);
  }

  closeSidebar(): void {
    this.selectedUser.set(null);
    this.pendingPermissionChanges.set(new Map());
    this.editingSettings.set(false);
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUser()?.id === userId;
  }

  onPermissionChange(field: 'canViewPhotos' | 'canRate', value: boolean): void {
    const user = this.selectedUser();
    if (!user) return;

    const changes = new Map(this.pendingPermissionChanges());
    const currentChanges = changes.get(user.id) || {
      canViewPhotos: user.canViewPhotos ?? true,
      canRate: user.canRate ?? true
    };

    currentChanges[field] = value;
    changes.set(user.id, currentChanges);
    this.pendingPermissionChanges.set(changes);
  }

  hasPermissionChanges(userId: number): boolean {
    return this.pendingPermissionChanges().has(userId);
  }

  getEffectivePermissions(user: User): { canViewPhotos: boolean; canRate: boolean } {
    const pending = this.pendingPermissionChanges().get(user.id);
    if (pending) return pending;

    return {
      canViewPhotos: user.canViewPhotos ?? true,
      canRate: user.canRate ?? true
    };
  }

  onSavePermissions(user: User): void {
    const changes = this.pendingPermissionChanges().get(user.id);
    if (!changes) return;

    this.adminService.updateUserPermissions(user.id, changes).subscribe({
      next: () => {
        const currentUsers = this.users();
        const index = currentUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          currentUsers[index] = {
            ...currentUsers[index],
            canViewPhotos: changes.canViewPhotos,
            canRate: changes.canRate
          };
          this.users.set([...currentUsers]);

          if (this.selectedUser()?.id === user.id) {
            this.selectedUser.set(currentUsers[index]);
          }
        }

        const pendingChanges = new Map(this.pendingPermissionChanges());
        pendingChanges.delete(user.id);
        this.pendingPermissionChanges.set(pendingChanges);

        this.showNotification('Uprawnienia zaktualizowane. Użytkownik musi się ponownie zalogować.', 'success');
      },
      error: (error) => {
        console.error('Failed to update permissions:', error);
        this.showNotification('Nie udało się zaktualizować uprawnień. Spróbuj ponownie.', 'error');
      }
    });
  }

  onCancelPermissions(userId: number): void {
    const changes = new Map(this.pendingPermissionChanges());
    changes.delete(userId);
    this.pendingPermissionChanges.set(changes);
  }

  loadSettings(): void {
    this.adminService.getSettings().subscribe({
      next: (settings) => {
        this.appSettings.set(settings);
        this.editedAdminEmail.set(settings.adminContactEmail);
        this.settingsLoadError.set(false);
      },
      error: (error) => {
        console.error('Failed to load settings:', error);
        this.settingsLoadError.set(true);
        this.appSettings.set({ adminContactEmail: '' });
      }
    });
  }

  onEditSettings(): void {
    this.editingSettings.set(true);
  }

  onSaveSettings(): void {
    const email = this.editedAdminEmail();
    if (!email) {
      this.showNotification('Email kontaktowy administratora jest wymagany.', 'error');
      return;
    }

    this.adminService.updateSettings({ adminContactEmail: email }).subscribe({
      next: (settings) => {
        this.appSettings.set(settings);
        this.editingSettings.set(false);
        this.showNotification('Ustawienia zostały zaktualizowane pomyślnie.', 'success');
      },
      error: (error) => {
        console.error('Failed to update settings:', error);
        this.showNotification('Nie udało się zaktualizować ustawień. Spróbuj ponownie.', 'error');
      }
    });
  }

  onCancelSettingsEdit(): void {
    this.editedAdminEmail.set(this.appSettings()?.adminContactEmail || '');
    this.editingSettings.set(false);
  }

  showNotification(message: string, type: 'success' | 'error' = 'success', duration: number = 5000): void {
    if (this.notificationTimeout) {
      window.clearTimeout(this.notificationTimeout);
    }

    this.notificationMessage.set(message);
    this.notificationType.set(type);

    this.notificationTimeout = window.setTimeout(() => {
      this.notificationMessage.set(null);
    }, duration);
  }

  closeNotification(): void {
    if (this.notificationTimeout) {
      window.clearTimeout(this.notificationTimeout);
    }
    this.notificationMessage.set(null);
  }
}
