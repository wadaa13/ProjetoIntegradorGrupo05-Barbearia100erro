package com.git.Barbearia100erro.controller;

import com.git.Barbearia100erro.model.Promocao;
import com.git.Barbearia100erro.service.PromocaoService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/promocoes")
public class PromocaoController {
    private final PromocaoService service;
    public PromocaoController(PromocaoService service) { this.service = service; }
    @GetMapping public List<Promocao> listar() { return service.listarAtivas(); }
    @GetMapping("/todas") public List<Promocao> listarTodas() { return service.listarTodas(); }
    @PostMapping public Promocao criar(@RequestBody Promocao promocao) { return service.salvar(promocao); }
    @PutMapping("/{id}") public Promocao atualizar(@PathVariable Long id, @RequestBody Promocao promocao) { promocao.setId(id); return service.salvar(promocao); }
    @DeleteMapping("/{id}") public void remover(@PathVariable Long id) { service.remover(id); }
}
