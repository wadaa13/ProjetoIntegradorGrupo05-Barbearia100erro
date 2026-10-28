package com.git.Barbearia100erro.controller;

import com.git.Barbearia100erro.model.Usuario;
import com.git.Barbearia100erro.service.UsuarioService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService service;
    public UsuarioController(UsuarioService service) { this.service = service; }
    @PostMapping("/cadastro") public Usuario cadastrar(@RequestBody Map<String, String> dados) { return service.cadastrar(dados); }
    @PostMapping("/login") public Usuario login(@RequestBody Map<String, String> dados) { return service.autenticar(dados.getOrDefault("email", ""), dados.getOrDefault("senha", "")); }
    @PostMapping("/sessao") public Usuario sessao(@RequestBody Map<String, String> dados) { return service.buscar(Long.valueOf(dados.getOrDefault("id", "0"))); }
    @GetMapping("/{id}") public Usuario buscar(@PathVariable Long id) { return service.buscar(id); }
    @GetMapping("/{id}/visitas") public Map<String, Long> visitas(@PathVariable Long id) { return Map.of("concluidas", service.visitasConcluidas(id)); }
    @PutMapping("/{id}") public Usuario atualizar(@PathVariable Long id, @RequestBody Map<String, String> dados) { return service.atualizar(id, dados); }
}
