package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // replaces: Document.findAll({ where: { caseId }, order: [["createdAt","DESC"]] })
    List<Document> findByCaseIdOrderByCreatedAtDesc(Long caseId);

    // replaces: Document.findOne({ where: { caseId, originalName }, order: [["version","DESC"]] })
    Optional<Document> findTopByCaseIdAndOriginalNameOrderByVersionDesc(Long caseId, String originalName);

    // replaces: Document.findAll({ where: { caseId, originalName }, order: [["version","DESC"]] })
    List<Document> findByCaseIdAndOriginalNameOrderByVersionDesc(Long caseId, String originalName);
}