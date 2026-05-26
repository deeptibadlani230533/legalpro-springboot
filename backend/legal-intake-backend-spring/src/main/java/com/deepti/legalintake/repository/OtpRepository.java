package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, String> {

    // replaces: OTP.findOne({ where: { email, code, verified: false }, order: [["createdAt","DESC"]] })
    Optional<Otp> findTopByEmailAndCodeAndVerifiedFalseOrderByCreatedAtDesc(String email, String code);

    // replaces: OTP.findOne({ where: { email, verified: true }, order: [["createdAt","DESC"]] })
    Optional<Otp> findTopByEmailAndVerifiedTrueOrderByCreatedAtDesc(String email);

    // replaces: OTP.destroy({ where: { email } })
    void deleteByEmail(String email);
}