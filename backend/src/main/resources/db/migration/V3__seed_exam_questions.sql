-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO exam_questions (id, skill, difficulty_level, question_text, options_json, correct_answer, category) 
VALUES
    (gen_random_uuid(), 'Java', 'Easy', 'What is the output of System.out.println(1 + "2" + 3)?', '["123", "6", "15", "error"]', '123', 'Basics'),
    (gen_random_uuid(), 'Java', 'Medium', 'What is the difference between ArrayList and LinkedList?', null, null, 'Collections'),
    (gen_random_uuid(), 'Java', 'Hard', 'Explain Java memory leak', null, null, 'Memory Management'),
    
    (gen_random_uuid(), 'Python', 'Easy', 'What is the output of type([])?', '["list", "array", "sequence", "collection"]', 'list', 'Types'),
    (gen_random_uuid(), 'Python', 'Medium', 'What is a decorator?', null, null, 'Functions'),
    (gen_random_uuid(), 'Python', 'Hard', 'Explain the GIL', null, null, 'Threading'),
    
    (gen_random_uuid(), 'JavaScript', 'Easy', 'What is typeof null?', '["object", "null", "undefined", "string"]', 'object', 'Types'),
    (gen_random_uuid(), 'JavaScript', 'Medium', 'What is a closure?', null, null, 'Functions'),
    (gen_random_uuid(), 'JavaScript', 'Hard', 'Explain event delegation', null, null, 'DOM'),
    
    (gen_random_uuid(), 'React', 'Easy', 'What is JSX?', null, null, 'Basics'),
    (gen_random_uuid(), 'React', 'Medium', 'What are hooks?', null, null, 'State Management'),
    (gen_random_uuid(), 'React', 'Hard', 'Explain virtual DOM', null, null, 'Performance');
