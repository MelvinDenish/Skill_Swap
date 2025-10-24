package com.skillswap.service;

import com.skillswap.entity.*;
import com.skillswap.repository.CalendarEventMappingRepository;
import com.skillswap.repository.OAuthAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DefaultCalendarSyncService implements CalendarSyncService {

    @Autowired
    private CalendarEventMappingRepository mappingRepository;

    @Autowired
    private OAuthAccountRepository oAuthAccountRepository;

    @Override
    public void syncSession(SkillSession session) {
        createOrTouch(session.getTeacher(), session);
        createOrTouch(session.getLearner(), session);
    }

    @Override
    public void deleteSessionEvents(SkillSession session) {
        mappingRepository.findBySessionId(session.getId()).forEach(mappingRepository::delete);
    }

    private void createOrTouch(User user, SkillSession session) {
        // Prefer Google calendar if account is linked; otherwise skip stub creation
        boolean hasGoogle = oAuthAccountRepository.findByUserIdAndProvider(user.getId(), OAuthProvider.GOOGLE).isPresent();
        boolean hasMicrosoft = oAuthAccountRepository.findByUserIdAndProvider(user.getId(), OAuthProvider.MICROSOFT).isPresent();
        if (!hasGoogle && !hasMicrosoft) return;

        if (hasGoogle) {
            upsertMapping(user, session, CalendarProvider.GOOGLE);
        }
        if (hasMicrosoft) {
            upsertMapping(user, session, CalendarProvider.OUTLOOK);
        }
    }

    private void upsertMapping(User user, SkillSession session, CalendarProvider provider) {
        var opt = mappingRepository.findOne(session.getId(), user.getId(), provider);
        CalendarEventMapping m = opt.orElseGet(CalendarEventMapping::new);
        m.setSession(session);
        m.setUser(user);
        m.setProvider(provider);
        if (m.getProviderEventId() == null) {
            m.setProviderEventId("local-" + session.getId() + "-" + provider + "-" + user.getId());
        }
        m.setHtmlLink("#");
        m.setLastSyncedAt(LocalDateTime.now());
        mappingRepository.save(m);
    }
}
