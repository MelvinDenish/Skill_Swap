package com.skillswap.service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.InvalidKeyException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import javax.crypto.spec.SecretKeySpec;

@Service
public class TotpService {

    private static final Duration STEP = Duration.ofSeconds(30);

    public String generateSecret() {
        byte[] buffer = new byte[20];
        new SecureRandom().nextBytes(buffer);
        Base32 base32 = new Base32();
        return base32.encodeAsString(buffer).replace("=", "");
    }

    public boolean verifyCode(String base32Secret, String code) {
        TimeBasedOneTimePasswordGenerator totp = new TimeBasedOneTimePasswordGenerator(STEP);
        byte[] secret = new Base32().decode(base32Secret);
        Key key = new SecretKeySpec(secret, "HmacSHA1");
        Instant now = Instant.now();
        // allow +/- 1 window
        for (int i = -1; i <= 1; i++) {
            Instant timestamp = now.plusSeconds(i * STEP.getSeconds());
            try {
                int expected = totp.generateOneTimePassword(key, timestamp);
                if (String.format("%06d", expected).equals(code)) {
                    return true;
                }
            } catch (InvalidKeyException e) {
                return false;
            }
        }
        return false;
    }

    public String buildOtpAuthUrl(String issuer, String accountName, String base32Secret) {
        String label = urlEncode(issuer + ":" + accountName);
        String params = "secret=" + urlEncode(base32Secret) + "&issuer=" + urlEncode(issuer) + "&digits=6&period=30";
        return "otpauth://totp/" + label + "?" + params;
    }

    public byte[] qrcodePng(String content, int size) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, size, size);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
        } catch (WriterException | java.io.IOException e) {
            return new byte[0];
        }
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
