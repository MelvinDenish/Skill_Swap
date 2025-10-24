package com.skillswap.controller;

import com.skillswap.dto.*;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.TotpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/2fa")
public class TwoFactorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TotpService totpService;

    @GetMapping("/setup")
    public ResponseEntity<TwoFactorSetupResponse> setup(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        String secret = totpService.generateSecret();
        String url = totpService.buildOtpAuthUrl("SkillSwap", me.getEmail(), secret);
        return ResponseEntity.ok(new TwoFactorSetupResponse(secret, url));
    }

    @GetMapping(value = "/setup/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> setupQr(@RequestParam("secret") String secret,
                                          @RequestParam(value = "size", defaultValue = "256") int size,
                                          @AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        String url = totpService.buildOtpAuthUrl("SkillSwap", me.getEmail(), secret);
        byte[] png = totpService.qrcodePng(url, size);
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(png);
    }

    @PostMapping("/enable")
    public ResponseEntity<Void> enable(@AuthenticationPrincipal UserDetails principal,
                                       @Valid @RequestBody TwoFactorEnableRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        boolean ok = totpService.verifyCode(req.secret(), req.code());
        if (!ok) return ResponseEntity.status(400).build();
        me.setTotpSecret(req.secret());
        me.setTwoFactorEnabled(true);
        userRepository.save(me);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/disable")
    public ResponseEntity<Void> disable(@AuthenticationPrincipal UserDetails principal,
                                        @Valid @RequestBody TotpCodeRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (me.getTotpSecret() == null || !totpService.verifyCode(me.getTotpSecret(), req.code())) {
            return ResponseEntity.status(400).build();
        }
        me.setTwoFactorEnabled(false);
        me.setTotpSecret(null);
        userRepository.save(me);
        return ResponseEntity.noContent().build();
    }
}
