package com.skillswap.repository;

import com.skillswap.entity.OAuthAccount;
import com.skillswap.entity.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, UUID> {
    Optional<OAuthAccount> findByProviderAndProviderUserId(OAuthProvider provider, String providerUserId);
    Optional<OAuthAccount> findByUserIdAndProvider(UUID userId, OAuthProvider provider);
}
