package com.skillswap.repository;

import com.skillswap.entity.CalendarEventMapping;
import com.skillswap.entity.CalendarProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarEventMappingRepository extends JpaRepository<CalendarEventMapping, UUID> {
    @Query("select m from CalendarEventMapping m where m.session.id = :sessionId")
    List<CalendarEventMapping> findBySessionId(@Param("sessionId") UUID sessionId);

    @Query("select m from CalendarEventMapping m where m.session.id = :sessionId and m.user.id = :userId and m.provider = :provider")
    Optional<CalendarEventMapping> findOne(@Param("sessionId") UUID sessionId, @Param("userId") UUID userId, @Param("provider") CalendarProvider provider);

    @Query("select m from CalendarEventMapping m where m.user.id = :userId order by m.updatedAt desc")
    List<CalendarEventMapping> findByUserId(@Param("userId") UUID userId);
}
