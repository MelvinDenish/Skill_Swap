package com.skillswap.service;

import com.skillswap.entity.SkillSession;

public interface CalendarSyncService {
    void syncSession(SkillSession session);
    void deleteSessionEvents(SkillSession session);
}
