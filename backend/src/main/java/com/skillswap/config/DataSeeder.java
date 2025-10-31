package com.skillswap.config;

import com.skillswap.entity.ExamQuestion;
import com.skillswap.repository.ExamQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(10)
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private ExamQuestionRepository examQuestionRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            if (examQuestionRepository == null) return;
            if (examQuestionRepository.count() > 0) return;
            List<ExamQuestion> list = new ArrayList<>();

            list.add(q("Java", "Easy", "What is the output of: System.out.println(1 + \"2\" + 3);",
                    "[\"6\",\"123\",\"33\",\"Error\"]",
                    "123", "Basics",
                    "String concatenation: 1 + \"2\" -> \"12\"; then + 3 -> \"123\"."));
            list.add(q("Java", "Medium", "Which collection does not allow duplicates?",
                    "[\"List\",\"Set\",\"Queue\",\"Map\"]",
                    "Set", "Collections", "Set enforces uniqueness."));
            list.add(q("Java", "Hard", "Which keyword prevents a class from being subclassed?",
                    "[\"static\",\"final\",\"sealed\",\"private\"]",
                    "final", "OOP", "final on class prevents inheritance (pre-Java 17)."));

            list.add(q("React", "Easy", "Which hook manages state in a function component?",
                    "[\"useState\",\"useEffect\",\"useMemo\",\"useRef\"]",
                    "useState", "Hooks", "useState returns state and setter."));
            list.add(q("React", "Medium", "What causes infinite re-renders with useEffect?",
                    "[\"Empty deps\",\"Missing deps\",\"Too many deps\",\"Using useMemo\"]",
                    "Missing deps", "Hooks", "Omitting dependencies can re-run on every render if state is updated inside."));

            list.add(q("Python", "Easy", "What is the result of len({1,1,2})?",
                    "[\"2\",\"3\",\"1\",\"0\"]",
                    "2", "Sets", "Set removes duplicates so {1,2} length is 2."));
            list.add(q("Python", "Medium", "What does list(map(lambda x: x*2, [1,2,3])) return?",
                    "[\"[2,4,6]\",\"[1,2,3]\",\"[1,4,9]\",\"Error\"]",
                    "[2,4,6]", "Functional", "map applies function to each element."));
            list.add(q("Python", "Hard", "Which keyword is used to create a generator?",
                    "[\"yield\",\"return\",\"async\",\"gen\"]",
                    "yield", "Generators", "yield produces a generator."));

            list.add(q("AWS", "Easy", "Which service is object storage?",
                    "[\"EC2\",\"S3\",\"RDS\",\"EBS\"]",
                    "S3", "Services", "Amazon S3 is object storage."));
            list.add(q("AWS", "Medium", "Which service provides managed message queues?",
                    "[\"SNS\",\"SQS\",\"Kinesis\",\"Step Functions\"]",
                    "SQS", "Services", "SQS is simple queue service."));

            for (ExamQuestion q : list) {
                try { examQuestionRepository.save(q); } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {
        }
    }

    private ExamQuestion q(String skill, String difficulty, String text, String optionsJson, String correct, String category, String explanation) {
        ExamQuestion q = new ExamQuestion();
        q.setSkill(skill);
        q.setDifficultyLevel(difficulty);
        q.setQuestionText(text);
        q.setOptionsJson(optionsJson);
        q.setCorrectAnswer(correct);
        q.setCategory(category);
        q.setExplanation(explanation);
        q.setCreatedAt(LocalDateTime.now());
        return q;
    }
}
