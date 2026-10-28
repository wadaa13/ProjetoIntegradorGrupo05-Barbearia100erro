package com.git.Barbearia100erro.controller;

import com.git.Barbearia100erro.model.Admin;
import com.git.Barbearia100erro.model.Agendamento;
import com.git.Barbearia100erro.model.Usuario;
import com.git.Barbearia100erro.repository.AdminRepository;
import com.git.Barbearia100erro.repository.AgendamentoRepository;
import com.git.Barbearia100erro.repository.UsuarioRepository;
import com.git.Barbearia100erro.service.AgendamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminRepository admins;
    private final AgendamentoRepository agendamentos;
    private final UsuarioRepository usuarios;
    private final AgendamentoService agendaService;
    public AdminController(AdminRepository admins, AgendamentoRepository agendamentos, UsuarioRepository usuarios, AgendamentoService agendaService) {
        this.admins = admins; this.agendamentos = agendamentos; this.usuarios = usuarios; this.agendaService = agendaService;
    }
    @PostMapping("/login") public Map<String, Object> login(@RequestBody Map<String, String> dados) {
        Admin admin = admins.findByEmail(dados.getOrDefault("email", "").toLowerCase()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));
        if (!admin.getSenha().equals(dados.get("senha"))) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        return Map.of("autenticado", true, "email", admin.getEmail());
    }
    @GetMapping("/dashboard/vendas") public List<Map<String, Object>> vendasPorServico() {
        return agendamentos.contarVendasPorServico(Agendamento.StatusAgendamento.CANCELADO).stream()
                .map(row -> Map.<String, Object>of("servicoId", row[0], "quantidade", row[1])).toList();
    }
    @GetMapping("/dashboard/diario") public List<Map<String, Object>> faturamentoDiario(@RequestParam LocalDate inicio, @RequestParam LocalDate fim) {
        return agendamentos.faturamentoDiario(inicio, fim, Agendamento.StatusAgendamento.CANCELADO).stream()
                .map(row -> Map.<String, Object>of("data", row[0], "total", row[1])).toList();
    }
    @GetMapping("/dashboard") public Map<String, Object> dashboard() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioSemana = hoje.minusDays(hoje.getDayOfWeek().getValue() - 1L);
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hoje", agendaService.faturamento(hoje, hoje));
        result.put("atendimentosHoje", agendamentos.countByDataAndStatusNot(hoje, Agendamento.StatusAgendamento.CANCELADO));
        result.put("semana", agendaService.faturamento(inicioSemana, hoje));
        result.put("mes", agendaService.faturamento(inicioMes, hoje));
        result.put("vendasPorServico", vendasPorServico());
        return result;
    }
    @GetMapping("/clientes") public List<Usuario> clientes() { return usuarios.findAll(); }
}
