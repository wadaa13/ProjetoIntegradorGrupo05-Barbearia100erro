package com.git.Barbearia100erro.controller;

import com.git.Barbearia100erro.model.Servico;
import com.git.Barbearia100erro.service.ServicoService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {
    private final ServicoService service;
    public ServicoController(ServicoService service) { this.service = service; }
    @GetMapping public List<Servico> listar() { return service.listar(); }
    @GetMapping("/{id}") public Servico buscar(@PathVariable Long id) { return service.buscar(id); }
    @PostMapping public Servico criar(@RequestBody Servico servico) { return service.salvar(servico); }
    @GetMapping("/todos") public List<Servico> listarTodos() { return service.listarTodos(); }
    @PutMapping("/{id}") public Servico atualizar(@PathVariable Long id, @RequestBody Servico servico) { servico.setId(id); return service.salvar(servico); }
    @DeleteMapping("/{id}") public void remover(@PathVariable Long id) { service.remover(id); }
}
