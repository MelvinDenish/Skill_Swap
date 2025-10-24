package com.skillswap.service.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    @Value("${storage.local.path:uploads}")
    private String baseDir;

    @Override
    public String store(MultipartFile file) throws IOException {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Files.createDirectories(base);
        LocalDate today = LocalDate.now();
        Path dir = base.resolve(today.getYear() + "/" + String.format("%02d", today.getMonthValue()));
        Files.createDirectories(dir);
        String cleanFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String key = UUID.randomUUID() + "_" + cleanFilename;
        Path dest = dir.resolve(key);
        Files.copy(file.getInputStream(), dest);
        return base.relativize(dest).toString().replace('\\','/');
    }

    @Override
    public Resource load(String key) throws IOException {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Path path = base.resolve(key).normalize();
        if (!path.startsWith(base) || !Files.exists(path)) {
            throw new IOException("File not found");
        }
        return new FileSystemResource(path);
    }

    @Override
    public void delete(String key) throws IOException {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Path path = base.resolve(key).normalize();
        if (Files.exists(path)) {
            Files.delete(path);
        }
    }

    @Override
    public String getContentType(String key) throws IOException {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Path path = base.resolve(key).normalize();
        return Files.probeContentType(path);
    }

    @Override
    public long getSize(String key) throws IOException {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Path path = base.resolve(key).normalize();
        return Files.size(path);
    }
}
