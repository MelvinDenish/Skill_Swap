package com.skillswap.controller;

import com.skillswap.dto.CreateResourceLinkRequest;
import com.skillswap.dto.ResourceItemDTO;
import com.skillswap.entity.ResourceItem;
import com.skillswap.entity.ResourceType;
import com.skillswap.entity.SkillSession;
import com.skillswap.entity.User;
import com.skillswap.repository.ResourceItemRepository;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.storage.StorageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp"
    );

    @Value("${app.upload.max-bytes:10485760}")
    private long maxBytes;

    @Autowired
    private StorageService storageService;

    @Autowired
    private ResourceItemRepository resourceItemRepository;

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceItemDTO> upload(@AuthenticationPrincipal UserDetails principal,
                                               @RequestParam("file") MultipartFile file,
                                               @RequestParam(value = "sessionId", required = false) UUID sessionId,
                                               @RequestParam(value = "skillName", required = false) String skillName) throws IOException {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (file.getSize() > maxBytes) return ResponseEntity.status(413).build();
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) return ResponseEntity.status(415).build();
        String key = storageService.store(file);
        ResourceItem item = new ResourceItem();
        item.setOwner(me);
        if (sessionId != null) {
            SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
            if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
            item.setSession(s);
        }
        if (StringUtils.hasText(skillName)) item.setSkillName(skillName);
        item.setType(ResourceType.PDF.equals(detectType(contentType, file.getOriginalFilename())) ? ResourceType.PDF : ResourceType.IMAGE);
        item.setTitle(file.getOriginalFilename());
        item.setFileKey(key);
        item.setContentType(contentType);
        item.setSizeBytes(file.getSize());
        ResourceItem saved = resourceItemRepository.save(item);
        return ResponseEntity.ok(toDto(saved));
    }

    @PostMapping("/link")
    public ResponseEntity<ResourceItemDTO> link(@AuthenticationPrincipal UserDetails principal,
                                             @Valid @RequestBody CreateResourceLinkRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        ResourceItem item = new ResourceItem();
        item.setOwner(me);
        if (req.sessionId() != null) {
            SkillSession s = sessionRepository.findById(req.sessionId()).orElseThrow();
            if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
            item.setSession(s);
        }
        item.setSkillName(req.skillName());
        item.setType(ResourceType.LINK);
        item.setTitle(req.title());
        item.setDescription(req.description());
        item.setUrl(req.url());
        ResourceItem saved = resourceItemRepository.save(item);
        return ResponseEntity.ok(toDto(saved));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<ResourceItemDTO>> bySession(@PathVariable UUID sessionId) {
        // Publicly list resources for a session
        List<ResourceItemDTO> list = resourceItemRepository.findBySessionId(sessionId)
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/skill/{skill}")
    public ResponseEntity<List<ResourceItemDTO>> bySkill(@PathVariable String skill) {
        List<ResourceItemDTO> list = resourceItemRepository.findBySkill(skill)
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ResourceItemDTO>> my(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<ResourceItemDTO> list = resourceItemRepository.findByOwnerId(me.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("")
    public ResponseEntity<List<ResourceItemDTO>> all() {
        List<ResourceItemDTO> list = resourceItemRepository.findAllOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) throws IOException {
        ResourceItem item = resourceItemRepository.findById(id).orElseThrow();
        if (item.getType() == ResourceType.LINK && item.getUrl() != null) {
            return ResponseEntity.status(302).location(URI.create(item.getUrl())).build();
        }
        if (item.getFileKey() == null) return ResponseEntity.notFound().build();
        Resource resource = storageService.load(item.getFileKey());
        String contentType = item.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : item.getContentType();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (item.getTitle() == null ? id.toString() : item.getTitle()) + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) throws IOException {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        ResourceItem item = resourceItemRepository.findById(id).orElseThrow();
        if (!item.getOwner().getId().equals(me.getId())) return ResponseEntity.status(403).build();
        if (item.getFileKey() != null) storageService.delete(item.getFileKey());
        resourceItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isParticipant(User me, SkillSession s) {
        return s.getTeacher().getId().equals(me.getId()) || s.getLearner().getId().equals(me.getId());
    }

    private ResourceType detectType(String contentType, String filename) {
        if (contentType != null && contentType.equals("application/pdf")) return ResourceType.PDF;
        String ext = filename == null ? "" : filename.toLowerCase();
        if (ext.endsWith(".pdf")) return ResourceType.PDF;
        return ResourceType.IMAGE;
    }

    private ResourceItemDTO toDto(ResourceItem r) {
        return new ResourceItemDTO(
                r.getId(),
                r.getSkillName(),
                r.getType(),
                r.getTitle(),
                r.getDescription(),
                r.getUrl(),
                r.getContentType(),
                r.getSizeBytes(),
                r.getCreatedAt() != null ? r.getCreatedAt().toString() : null
        );
    }
}
