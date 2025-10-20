package com.skillswap.service;

import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public void updateUserLevel(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        int points = user.getPoints() == null ? 0 : user.getPoints();

        String level;
        if (points < 100) level = "Beginner";
        else if (points < 300) level = "Intermediate";
        else if (points < 600) level = "Advanced";
        else level = "Expert";

        user.setLevel(level);
        userRepository.save(user);
    }

    public void addPoints(UUID userId, int points) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setPoints((user.getPoints() == null ? 0 : user.getPoints()) + points);
        userRepository.save(user);
        updateUserLevel(userId);
    }
}
