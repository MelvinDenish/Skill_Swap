package com.skillswap.security;

import com.skillswap.entity.OAuthAccount;
import com.skillswap.entity.OAuthProvider;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.OAuthAccountRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Autowired(required = false)
    private OAuth2AuthorizedClientService authorizedClientService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @Autowired
    private OAuthAccountRepository oAuthAccountRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attrs = oauthUser.getAttributes();

        String email = resolveEmail(registrationId, attrs);
        String name = resolveName(registrationId, attrs);
        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not provided by OAuth provider");
            return;
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setName(name != null ? name : email);
            u.setProfilePictureUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + (name != null ? name : email));
            return userRepository.save(u);
        });

        userSkillsRepository.findByUserId(user.getId()).orElseGet(() -> {
            UserSkills skills = new UserSkills();
            skills.setUser(user);
            skills.setSkillsOffered("[]");
            skills.setSkillsWanted("[]");
            return userSkillsRepository.save(skills);
        });

        if (authorizedClientService != null) {
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(registrationId, oauthToken.getName());
            if (client != null) {
                OAuth2AccessToken at = client.getAccessToken();
                OAuth2RefreshToken rt = client.getRefreshToken();

                OAuthAccount account = oAuthAccountRepository
                        .findByProviderAndProviderUserId(mapProvider(registrationId), oauthUser.getName())
                        .orElseGet(OAuthAccount::new);
                account.setUser(user);
                account.setProvider(mapProvider(registrationId));
                account.setProviderUserId(oauthUser.getName());
                account.setEmail(email);
                if (at != null) {
                    account.setAccessToken(at.getTokenValue());
                    account.setExpiresAt(at.getExpiresAt());
                    account.setScopes(String.join(" ", at.getScopes()));
                }
                if (rt != null) {
                    account.setRefreshToken(rt.getTokenValue());
                }
                oAuthAccountRepository.save(account);
            }
        }

        String token = jwtUtil.generateToken(user.getEmail());
        ResponseCookie cookie = ResponseCookie.from("SS_TOKEN", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        response.sendRedirect(frontendUrl + "/oauth2/success");
    }

    private OAuthProvider mapProvider(String registrationId) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> OAuthProvider.GOOGLE;
            case "github" -> OAuthProvider.GITHUB;
            default -> OAuthProvider.GOOGLE;
        };
    }

    private String resolveEmail(String registrationId, Map<String, Object> attrs) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return (String) attrs.get("email");
        }
        if ("github".equalsIgnoreCase(registrationId)) {
            Object email = attrs.get("email");
            if (email != null) return email.toString();
            Object login = attrs.get("login");
            return login != null ? login.toString() + "@users.noreply.github.com" : null;
        }
        return null;
    }

    private String resolveName(String registrationId, Map<String, Object> attrs) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return (String) attrs.get("name");
        }
        if ("github".equalsIgnoreCase(registrationId)) {
            Object name = attrs.get("name");
            Object login = attrs.get("login");
            return name != null ? name.toString() : (login != null ? login.toString() : null);
        }
        return null;
    }
}
