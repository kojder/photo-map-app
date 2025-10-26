package com.photomap.repository;

import com.photomap.model.Role;
import com.photomap.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    Optional<User> findFirstByRole(Role role);

    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);
}
