package com.skillswap.repository;

import com.skillswap.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    boolean existsByGroup_IdAndUser_Email(UUID groupId, String email);
    boolean existsByGroup_IdAndUser_Id(UUID groupId, UUID userId);
    // alias method if referenced elsewhere
    default boolean existsByGroupIdAndUserEmail(UUID groupId, String email) {
        return existsByGroup_IdAndUser_Email(groupId, email);
    }
    List<GroupMember> findByGroup_IdOrderByJoinedAtAsc(UUID groupId);

    @Query("select gm from GroupMember gm join fetch gm.user where gm.group.id = :groupId order by gm.joinedAt asc")
    List<GroupMember> findByGroupIdWithUserOrderByJoinedAtAsc(@Param("groupId") UUID groupId);
}
