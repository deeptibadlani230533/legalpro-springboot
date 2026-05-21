package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.CaseComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CasecommentRepository extends JpaRepository<CaseComment, Long> {

    // replaces: CaseComment.findAll({ where:{ caseId }, include:[{ model:User, as:"author" }], order:[["createdAt","ASC"]] })
    @Query("SELECT c FROM CaseComment c LEFT JOIN FETCH c.author WHERE c.caseId = :caseId ORDER BY c.createdAt ASC")
    List<CaseComment> findByCaseIdWithAuthor(Long caseId);
}