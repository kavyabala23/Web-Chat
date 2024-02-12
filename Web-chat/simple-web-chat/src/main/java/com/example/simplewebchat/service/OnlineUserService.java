package com.example.simplewebchat.service;


import com.example.simplewebchat.websocket.User;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class OnlineUserService {
    private final Set onlineUsers = new LinkedHashSet<>();

    public Set getOnlineUsers(){
        return onlineUsers;
    }
    public void addOnlineUser(User user){
        onlineUsers.add(user);
    }

    public void removeOnlineUser(User user){
        onlineUsers.remove(user);
    }

}
