package com.skillswap.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String store(MultipartFile file) throws java.io.IOException;
    Resource load(String key) throws java.io.IOException;
    void delete(String key) throws java.io.IOException;
    String getContentType(String key) throws java.io.IOException;
    long getSize(String key) throws java.io.IOException;
}
