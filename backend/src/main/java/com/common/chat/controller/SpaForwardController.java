package com.common.chat.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {"/join", "/chat"})
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
