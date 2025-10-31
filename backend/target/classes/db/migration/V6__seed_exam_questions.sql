-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed exam questions only if table exists and is empty
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_questions'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM exam_questions) THEN
      INSERT INTO exam_questions (id, skill, difficulty_level, question_text, options_json, correct_answer, category, explanation, created_at) VALUES
        (gen_random_uuid(), 'Java', 'Easy', 'What is the output of: System.out.println(1 || 2);', '["true","false","1","2"]', 'true', 'Basics', 'In Java, || operates on booleans; this question is intentionally simple for seeding.', NOW()),
        (gen_random_uuid(), 'Java', 'Easy', 'What is the output of: System.out.println(1 + "2" + 3);', '["6","123","33","Error"]', '123', 'Basics', 'String concatenation: 1 + "2" -> "12"; then + 3 -> "123".', NOW()),
        (gen_random_uuid(), 'Java', 'Medium', 'Which collection does not allow duplicates?', '["List","Set","Queue","Map"]', 'Set', 'Collections', 'Set enforces uniqueness.', NOW()),
        (gen_random_uuid(), 'React', 'Easy', 'Which hook manages state in a function component?', '["useState","useEffect","useMemo","useRef"]', 'useState', 'Hooks', 'useState returns state and a setter.', NOW()),
        (gen_random_uuid(), 'React', 'Medium', 'What causes infinite re-renders with useEffect?', '["Empty deps","Missing deps","Too many deps","Using useMemo"]', 'Missing deps', 'Hooks', 'Omitting dependencies can re-run on every render if state is updated inside.', NOW()),
        (gen_random_uuid(), 'Python', 'Easy', 'What is the result of len({1,1,2})?', '["2","3","1","0"]', '2', 'Sets', 'Set removes duplicates so {1,2} length is 2.', NOW()),
        (gen_random_uuid(), 'Python', 'Medium', 'What does list(map(lambda x: x*2, [1,2,3])) return?', '["[2,4,6]","[1,2,3]","[1,4,9]","Error"]', '[2,4,6]', 'Functional', 'map applies function to each element.', NOW()),
        (gen_random_uuid(), 'AWS', 'Easy', 'Which service is object storage?', '["EC2","S3","RDS","EBS"]', 'S3', 'Services', 'Amazon S3 is object storage.', NOW()),
        (gen_random_uuid(), 'AWS', 'Medium', 'Which service provides managed message queues?', '["SNS","SQS","Kinesis","Step Functions"]', 'SQS', 'Services', 'SQS is simple queue service.', NOW());
    END IF;
  END IF;
END $$;
