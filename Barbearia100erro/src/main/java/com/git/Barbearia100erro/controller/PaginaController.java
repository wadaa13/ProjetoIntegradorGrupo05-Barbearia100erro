package com.git.Barbearia100erro.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PaginaController {
    @GetMapping("/cliente")
    public String cliente() { return "forward:/cliente.html"; }

    @GetMapping("/admin")
    public String admin() { return "forward:/admin.html"; }
}
