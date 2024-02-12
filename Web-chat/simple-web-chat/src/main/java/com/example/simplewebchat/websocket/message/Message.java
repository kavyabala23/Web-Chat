package com.example.simplewebchat.websocket.message;

import com.example.simplewebchat.websocket.Action;
import com.example.simplewebchat.websocket.User;

import java.time.Instant;
public record Message(User user, String comment, Action action, Instant timestamp) {

}
