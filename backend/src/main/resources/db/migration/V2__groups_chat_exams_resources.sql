-- Feature 2: Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    related_skill VARCHAR(100),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INT NOT NULL DEFAULT 10,
    member_count INT NOT NULL DEFAULT 0,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    icon_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_study_groups_skill ON study_groups(related_skill);
CREATE INDEX IF NOT EXISTS idx_study_groups_member_count ON study_groups(member_count DESC);

CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);

CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_time ON group_messages(group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS group_resources (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    resource_item_id UUID NOT NULL REFERENCES resource_items(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_group_resources_group ON group_resources(group_id);

CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP NOT NULL,
    duration INT NOT NULL DEFAULT 60,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    meeting_link TEXT,
    video_room VARCHAR(120),
    whiteboard_room VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Feature 3: 1-1 Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_key VARCHAR(120) NOT NULL,
    last_message_time TIMESTAMP,
    UNIQUE (pair_key)
);
CREATE INDEX IF NOT EXISTS idx_conversations_last_time ON conversations(last_message_time DESC);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, created_at DESC);

-- Feature 4: video/whiteboard on sessions
ALTER TABLE skill_sessions ADD COLUMN IF NOT EXISTS video_room VARCHAR(120);
ALTER TABLE skill_sessions ADD COLUMN IF NOT EXISTS whiteboard_room VARCHAR(120);

-- Feature 5: Exams & Interview prep
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY,
    skill VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(40) NOT NULL,
    question_text TEXT NOT NULL,
    options_json TEXT,
    correct_answer VARCHAR(200),
    category VARCHAR(100),
    explanation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_skill_diff ON exam_questions(skill, difficulty_level);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(200),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_time ON exam_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mock_interviews (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_topic VARCHAR(120) NOT NULL,
    interview_type VARCHAR(60),
    scheduled_time TIMESTAMP NOT NULL,
    feedback_from_interviewer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_time ON mock_interviews(scheduled_time DESC);

CREATE TABLE IF NOT EXISTS quiz_leaderboard (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill VARCHAR(100) NOT NULL,
    total_score INT NOT NULL DEFAULT 0,
    quiz_count INT NOT NULL DEFAULT 0,
    average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    rank INT,
    streak INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, skill)
);
CREATE INDEX IF NOT EXISTS idx_quiz_leaderboard_skill_rank ON quiz_leaderboard(skill, rank);

-- Feature 6: Resource versioning & analytics
ALTER TABLE resource_items ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE resource_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE resource_items ADD COLUMN IF NOT EXISTS skill_tag VARCHAR(100);
ALTER TABLE resource_items ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS resource_versions (
    id UUID PRIMARY KEY,
    resource_id UUID NOT NULL REFERENCES resource_items(id) ON DELETE CASCADE,
    version INT NOT NULL,
    file_key TEXT,
    url TEXT,
    content_type VARCHAR(200),
    size_bytes BIGINT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, version)
);
