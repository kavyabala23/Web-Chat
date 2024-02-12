package com.example.simplewebchat.websocket;

import com.example.simplewebchat.service.OnlineUserService;
import com.example.simplewebchat.websocket.message.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Map;

@Controller
public class WebSocketController {
    private static final Logger log = LoggerFactory.getLogger(WebSocketController.class);

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final OnlineUserService onlineUserService;
    public WebSocketController(SimpMessagingTemplate simpMessagingTemplate,OnlineUserService onlineUserService){
        this.simpMessagingTemplate =simpMessagingTemplate;
        this.onlineUserService = onlineUserService;
    }

    @MessageMapping("/chat")
    public void handleChatMessage(@Payload Message message, SimpMessageHeaderAccessor headerAccessor){
        System.out.println("Sending message: " + message);
        simpMessagingTemplate.convertAndSend("/topic/all/message",message);

        if(Action.JOINED.equals(message.action())){
            String userDestination = String.format("/topic/%s/message",message.user().id());
            onlineUserService.getOnlineUsers().forEach(onlineUser ->{
                Message newMessage = new Message((User) onlineUser,null,Action.JOINED,null);
                simpMessagingTemplate.convertAndSend(userDestination,newMessage);
            });
            headerAccessor.getSessionAttributes().put("user",message.user());
            onlineUserService.addOnlineUser(message.user());

        }
    }
    @EventListener
    public void handleSessionDisconnectEvent(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor =StompHeaderAccessor.wrap(event.getMessage());
        Map sessionAttributes = headerAccessor.getSessionAttributes();
        if(sessionAttributes==null){
            log.error("Unable to get the user as headerAccessor.getSessionAttributes() is null");
            return;
        }
        User user =(User) sessionAttributes.get("user");
        if(user==null){
            return;
        }
        onlineUserService.removeOnlineUser(user);
        Message message = new Message(user,"",Action.LEFT, Instant.now());
        simpMessagingTemplate.convertAndSend("topic/all/messages",message);
    }

}
