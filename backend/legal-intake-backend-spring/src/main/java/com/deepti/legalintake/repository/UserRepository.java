package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * USER REPOSITORY - replaces User.findOne(), User.findAll(), User.count() etc.
 *
 * JpaRepository<User, Long> gives you for FREE (no code needed):
 *   findById(id)        → replaces User.findByPk(id)
 *   findAll()           → replaces User.findAll()
 *   save(user)          → replaces user.save() / User.create()
 *   delete(user)        → replaces user.destroy()
 *   count()             → replaces User.count()
 *   existsById(id)      → replaces User.findByPk(id) != null
 *
 * Methods you DECLARE here (just the signature!) are auto-implemented by Spring
 * using the method name convention: findBy<FieldName><Condition>
 *
 * @Repository = Spring bean, marks this as a data access component
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // findByEmail = SELECT * FROM Users WHERE email = ?
    // replaces: User.findOne({ where: { email } })
    Optional<User> findByEmail(String email);

    // replaces: User.findAll({ where: { role: "lawyer" } })
    List<User> findByRoleOrderByCreatedAtDesc(String role);

    // replaces: User.count({ where: { role: "lawyer" } })
    long countByRole(String role);

    boolean existsByEmail(String email);
}