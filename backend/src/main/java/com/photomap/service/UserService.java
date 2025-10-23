package com.photomap.service;

import com.photomap.dto.UpdateRoleRequest;
import com.photomap.dto.UserAdminResponse;
import com.photomap.dto.UserResponse;
import com.photomap.model.User;
import com.photomap.repository.PhotoRepository;
import com.photomap.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PhotoRepository photoRepository;

    public UserService(final UserRepository userRepository, final PhotoRepository photoRepository) {
        this.userRepository = userRepository;
        this.photoRepository = photoRepository;
    }

    @Transactional(readOnly = true)
    public Page<UserAdminResponse> listAllUsers(final Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(user -> new UserAdminResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getRole(),
                        user.getCreatedAt(),
                        photoRepository.countByUserId(user.getId())
                ));
    }

    @Transactional
    public UserResponse changeUserRole(final Long userId, final UpdateRoleRequest request) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setRole(request.role());
        final User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getCreatedAt()
        );
    }

    @Transactional
    public void deleteUser(final Long userId) {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        final String currentUserEmail = authentication.getName();

        final User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (userToDelete.getEmail().equals(currentUserEmail)) {
            throw new IllegalArgumentException("Cannot delete yourself");
        }

        userRepository.delete(userToDelete);
    }
}
