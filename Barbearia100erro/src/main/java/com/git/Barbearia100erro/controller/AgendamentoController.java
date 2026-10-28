package com.git.Barbearia100erro.controller;

import com.git.Barbearia100erro.model.Agendamento;
import com.git.Barbearia100erro.service.AgendamentoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {
    private final AgendamentoService service;
    public AgendamentoController(AgendamentoService service) { this.service = service; }
    @GetMapping public List<Agendamento> listar(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) { if ((inicio == null) != (fim == null)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Informe inicio e fim para filtrar um período."); if (inicio != null) return service.listarEntre(inicio, fim); return data == null ? service.listar() : service.listarPorData(data); }
    @GetMapping("/relatorio/faturamento") public java.util.Map<String, Object> faturamento(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) { if (fim.isBefore(inicio)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "A data final precisa ser igual ou posterior à data inicial."); return java.util.Map.of("inicio", inicio, "fim", fim, "total", service.faturamento(inicio, fim)); }
    @GetMapping("/disponibilidade") public List<String> horarios(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) { return service.horariosDisponiveis(data); }
    @GetMapping("/cliente/{clienteId}") public List<Agendamento> historico(@PathVariable Long clienteId) { return service.historico(clienteId); }
    @GetMapping("/{id}") public Agendamento buscar(@PathVariable Long id) { return service.buscar(id); }
    @PostMapping public Agendamento criar(@RequestBody Map<String, String> dados) { return service.criar(dados); }
    @PutMapping("/{id}") public Agendamento atualizar(@PathVariable Long id, @RequestBody Map<String, String> dados) { return service.atualizar(id, dados); }
    @PostMapping("/{id}/pagamentos") public Agendamento pagar(@PathVariable Long id, @RequestBody Map<String, String> dados) { return service.pagar(id, dados); }
    @DeleteMapping("/{id}") public void cancelar(@PathVariable Long id) { service.cancelar(id); }
}
