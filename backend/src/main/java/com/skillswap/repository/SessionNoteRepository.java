package com.skillswap.repository;

import com.skillswap.entity.SessionNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SessionNoteRepository extends JpaRepository<SessionNote, UUID> {
    @Query("select n from SessionNote n where n.session.id = :sessionId order by n.createdAt desc")
    List<SessionNote> findBySessionId(@Param("sessionId") UUID sessionId);

    @Query("select n from SessionNote n where n.author.id = :authorId order by n.createdAt desc")
    List<SessionNote> findByAuthorId(@Param("authorId") UUID authorId);
}
