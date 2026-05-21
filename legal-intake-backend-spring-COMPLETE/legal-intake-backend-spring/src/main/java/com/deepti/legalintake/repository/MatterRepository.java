package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.Matter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MatterRepository extends JpaRepository<Matter, String> {

    List<Matter> findAllByOrderByCreatedAtDesc();

    // replaces: Matter.update({ status:"closed", closedAt:new Date() }, { where: { status:"open", createdAt:{ [Op.lt]: threshold } } })
    // @Modifying = this query changes data (UPDATE/DELETE), not a SELECT
    // @Transactional = required for @Modifying queries
    @Modifying
    @Transactional
    @Query("UPDATE Matter m SET m.status = 'closed', m.closedAt = :now WHERE m.status = 'open' AND m.createdAt < :threshold")
    int expireStaleMatters(LocalDateTime threshold, LocalDateTime now);
}