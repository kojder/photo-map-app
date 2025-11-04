package com.photomap.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.photomap.dto.UpdateRoleRequest;
import com.photomap.dto.UserResponse;
import com.photomap.model.Role;
import com.photomap.model.User;
import com.photomap.repository.UserRepository;
import com.photomap.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String userToken;
    private User adminUser;
    private User regularUser1;
    private User regularUser2;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setEmail("admin@example.com");
        adminUser.setPasswordHash(passwordEncoder.encode("password123"));
        adminUser.setRole(Role.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateToken(adminUser.getEmail());

        regularUser1 = new User();
        regularUser1.setEmail("user1@example.com");
        regularUser1.setPasswordHash(passwordEncoder.encode("password123"));
        regularUser1.setRole(Role.USER);
        regularUser1 = userRepository.save(regularUser1);

        regularUser2 = new User();
        regularUser2.setEmail("user2@example.com");
        regularUser2.setPasswordHash(passwordEncoder.encode("password123"));
        regularUser2.setRole(Role.USER);
        regularUser2 = userRepository.save(regularUser2);
        userToken = jwtTokenProvider.generateToken(regularUser2.getEmail());
    }

    @Test
    void listAllUsers_WithAdminToken_ReturnsPagedUsers() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "20")
                        .param("sort", "createdAt,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].email").exists())
                .andExpect(jsonPath("$.content[0].role").exists())
                .andExpect(jsonPath("$.content[0].totalPhotos").exists())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("admin@example.com");
        assertThat(result.getResponse().getContentAsString()).contains("user1@example.com");
        assertThat(result.getResponse().getContentAsString()).contains("user2@example.com");
    }

    @Test
    void listAllUsers_WithUserToken_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void listAllUsers_WithoutToken_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listAllUsers_WithPagination_ReturnsCorrectPage() throws Exception {
        for (int i = 3; i <= 25; i++) {
            User user = new User();
            user.setEmail("user" + i + "@example.com");
            user.setPasswordHash(passwordEncoder.encode("password123"));
            user.setRole(Role.USER);
            userRepository.save(user);
        }

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(26))
                .andExpect(jsonPath("$.totalPages").value(3));

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(26));

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "2")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(6))
                .andExpect(jsonPath("$.totalElements").value(26));
    }

    @Test
    void changeUserRole_WithAdminToken_UpdatesUserRole() throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(Role.ADMIN);

        MvcResult result = mockMvc.perform(put("/api/admin/users/" + regularUser1.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user1@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        UserResponse response = objectMapper.readValue(responseBody, UserResponse.class);

        assertThat(response.email()).isEqualTo("user1@example.com");
        assertThat(response.role()).isEqualTo(Role.ADMIN);

        User updatedUser = userRepository.findById(regularUser1.getId()).orElseThrow();
        assertThat(updatedUser.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void changeUserRole_WithUserToken_ReturnsForbidden() throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(Role.ADMIN);

        mockMvc.perform(put("/api/admin/users/" + regularUser1.getId() + "/role")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void changeUserRole_NonExistentUser_ReturnsNotFound() throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(Role.ADMIN);

        mockMvc.perform(put("/api/admin/users/99999/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void changeUserRole_FromAdminToUser_Success() throws Exception {
        User anotherAdmin = new User();
        anotherAdmin.setEmail("admin2@example.com");
        anotherAdmin.setPasswordHash(passwordEncoder.encode("password123"));
        anotherAdmin.setRole(Role.ADMIN);
        anotherAdmin = userRepository.save(anotherAdmin);

        UpdateRoleRequest request = new UpdateRoleRequest(Role.USER);

        mockMvc.perform(put("/api/admin/users/" + anotherAdmin.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));

        User updatedUser = userRepository.findById(anotherAdmin.getId()).orElseThrow();
        assertThat(updatedUser.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void deleteUser_WithAdminToken_DeletesUser() throws Exception {
        Long userIdToDelete = regularUser1.getId();

        mockMvc.perform(delete("/api/admin/users/" + userIdToDelete)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(userIdToDelete)).isEmpty();
    }

    @Test
    void deleteUser_WithUserToken_ReturnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + regularUser1.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteUser_CannotDeleteSelf_ReturnsBadRequest() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        assertThat(userRepository.findById(adminUser.getId())).isPresent();
    }

    @Test
    void deleteUser_NonExistentUser_ReturnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/admin/users/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteUser_WithoutToken_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + regularUser1.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    void fullAdminFlow_CreateUserChangeRoleDelete_Success() throws Exception {
        User newUser = new User();
        newUser.setEmail("flowtest@example.com");
        newUser.setPasswordHash(passwordEncoder.encode("password123"));
        newUser.setRole(Role.USER);
        newUser = userRepository.save(newUser);
        Long userId = newUser.getId();

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.email == 'flowtest@example.com')].role").value("USER"));

        UpdateRoleRequest updateRequest = new UpdateRoleRequest(Role.ADMIN);
        mockMvc.perform(put("/api/admin/users/" + userId + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        User updatedUser = userRepository.findById(userId).orElseThrow();
        assertThat(updatedUser.getRole()).isEqualTo(Role.ADMIN);

        mockMvc.perform(delete("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(userId)).isEmpty();
    }
}
