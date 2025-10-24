package com.skillswap.repository;

import com.skillswap.entity.ReminderLog;
import com.skillswap.entity.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReminderLogRepository extends JpaRepository<ReminderLog, UUID> {
    @Query("select r from ReminderLog r where r.session.id = :sessionId and r.type = :type")
    List<ReminderLog> findBySessionAndType(@Param("sessionId") UUID sessionId, @Param("type") ReminderType type);

    @Query("select r from ReminderLog r where r.sent = false and r.createdAt < :before")
    List<ReminderLog> findPendingBefore(@Param("before") LocalDateTime before);

    @Query("select r from ReminderLog r where r.session.id = :sessionId order by r.createdAt desc")
    List<ReminderLog> findBySessionId(@Param("sessionId") UUID sessionId);
}
