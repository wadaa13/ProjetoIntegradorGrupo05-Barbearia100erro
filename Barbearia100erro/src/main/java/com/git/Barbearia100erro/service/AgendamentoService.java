package com.git.Barbearia100erro.service;

import com.git.Barbearia100erro.model.Agendamento;
import com.git.Barbearia100erro.model.Pagamento;
import com.git.Barbearia100erro.model.Servico;
import com.git.Barbearia100erro.model.Usuario;
import com.git.Barbearia100erro.repository.AgendamentoRepository;
import com.git.Barbearia100erro.repository.PagamentoRepository;
import com.git.Barbearia100erro.repository.ServicoRepository;
import com.git.Barbearia100erro.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class AgendamentoService {
    private static final List<LocalTime> HORARIOS = java.util.stream.IntStream.range(0, 13)
            .mapToObj(index -> LocalTime.of((600 + index * 40) / 60, (600 + index * 40) % 60)).toList();
    private final AgendamentoRepository agendamentos;
    private final UsuarioRepository usuarios;
    private final ServicoRepository servicos;
    private final PagamentoRepository pagamentos;

    public AgendamentoService(AgendamentoRepository agendamentos, UsuarioRepository usuarios, ServicoRepository servicos, PagamentoRepository pagamentos) {
        this.agendamentos = agendamentos; this.usuarios = usuarios; this.servicos = servicos; this.pagamentos = pagamentos;
    }

    public List<Agendamento> listar() { return agendamentos.findAllByOrderByDataAscHorarioAsc(); }
    public List<Agendamento> listarPorData(LocalDate data) { return agendamentos.findByDataOrderByHorarioAsc(data); }
    public List<Agendamento> listarEntre(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data final precisa ser igual ou posterior à data inicial.");
        return agendamentos.findByDataBetweenOrderByDataAscHorarioAsc(inicio, fim);
    }
    public List<Agendamento> historico(Long clienteId) { return agendamentos.findByClienteIdOrderByDataDescHorarioDesc(clienteId); }
    public long visitasConcluidas(Long clienteId) {
        return historico(clienteId).stream().filter(a -> a.getStatus() == Agendamento.StatusAgendamento.CONCLUIDO).count();
    }
    public List<String> horariosDisponiveis(LocalDate data) {
        validarDataHorario(data, HORARIOS.get(0));
        return HORARIOS.stream().filter(h -> !agendamentos.existsByDataAndHorarioAndStatusNot(data, h, Agendamento.StatusAgendamento.CANCELADO)).map(LocalTime::toString).toList();
    }

    @Transactional
    public Agendamento criar(Map<String, String> dados) {
        LocalDate data = LocalDate.parse(obrigatorio(dados, "data"));
        LocalTime hora = LocalTime.parse(obrigatorio(dados, "horario"));
        validarDataHorario(data, hora);
        if (!HORARIOS.contains(hora)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horário fora dos horários de atendimento.");
        if (agendamentos.existsByDataAndHorarioAndStatusNot(data, hora, Agendamento.StatusAgendamento.CANCELADO))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este horário já está reservado.");
        Servico servico = servicos.findById(Long.valueOf(obrigatorio(dados, "servicoId"))).filter(Servico::isAtivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
        Usuario cliente = null;
        if (dados.containsKey("clienteId") && !dados.get("clienteId").isBlank()) {
            cliente = usuarios.findById(Long.valueOf(dados.get("clienteId"))).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
        } else {
            String nome = obrigatorio(dados, "nome"), email = obrigatorio(dados, "email").toLowerCase(), telefone = obrigatorio(dados, "telefone");
            String documento = dados.getOrDefault("documento", "").trim();
            if (!usuarios.existsByEmail(email)) {
                if (!documento.isBlank() && usuarios.existsByDocumento(documento)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este documento.");
                if (usuarios.existsByTelefone(telefone)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este telefone.");
                cliente = new Usuario(); cliente.setNome(nome); cliente.setEmail(email); cliente.setTelefone(telefone);
                cliente.setDocumento(documento.isBlank() ? "WEB-" + java.util.UUID.randomUUID() : documento);
                cliente.setSenha(java.util.UUID.randomUUID().toString()); cliente.setPapel("CLIENTE");
                cliente = usuarios.save(cliente);
            } else {
                cliente = usuarios.findByEmail(email).orElseThrow();
                if (!cliente.getTelefone().equals(telefone)) throw new ResponseStatusException(HttpStatus.CONFLICT, "O telefone informado não corresponde a esta conta.");
            }
        }
        BigDecimal precoAgendamento = valorServico(servico, data);
        BigDecimal valorPago;
        try { valorPago = new BigDecimal(dados.getOrDefault("valorPago", "0")); }
        catch (NumberFormatException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de pagamento inválido."); }
        if ("walk-in".equalsIgnoreCase(dados.get("status")) && valorPago.signum() == 0) valorPago = precoAgendamento;
        if (valorPago.signum() < 0 || valorPago.compareTo(precoAgendamento) > 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de pagamento inválido.");
        Agendamento agendamento = new Agendamento();
        agendamento.setCliente(cliente); agendamento.setServico(servico); agendamento.setData(data); agendamento.setHorario(hora);
        agendamento.setValor(precoAgendamento); agendamento.setValorPago(valorPago);
        if (dados.containsKey("observacao")) agendamento.setObservacao(dados.get("observacao"));
        agendamento.setStatus("walk-in".equalsIgnoreCase(dados.get("status")) ? Agendamento.StatusAgendamento.WALK_IN : Agendamento.StatusAgendamento.CONFIRMADO);
        Agendamento salvo = agendamentos.save(agendamento);
        if (valorPago.signum() > 0) {
            Pagamento pagamento = new Pagamento(); pagamento.setAgendamento(salvo); pagamento.setValor(valorPago);
            pagamento.setMetodo("dinheiro".equalsIgnoreCase(dados.get("metodoPagamento")) ? Pagamento.Metodo.DINHEIRO : Pagamento.Metodo.CARTAO_SIMULADO);
            pagamentos.save(pagamento);
        }
        return salvo;
    }

    @Transactional
    public Agendamento pagar(Long id, Map<String, String> dados) {
        Agendamento a = buscar(id);
        if (a.getStatus() == Agendamento.StatusAgendamento.CANCELADO) throw new ResponseStatusException(HttpStatus.CONFLICT, "Agendamento cancelado não pode ser pago.");
        BigDecimal valor;
        try { valor = new BigDecimal(obrigatorio(dados, "valor")); }
        catch (NumberFormatException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de pagamento inválido."); }
        BigDecimal restante = a.getValor().subtract(a.getValorPago());
        if (valor.signum() <= 0 || valor.compareTo(restante) > 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor de pagamento inválido.");
        a.setValorPago(a.getValorPago().add(valor));
        Pagamento pagamento = new Pagamento(); pagamento.setAgendamento(a); pagamento.setValor(valor);
        if ("pix".equalsIgnoreCase(dados.get("metodo"))) pagamento.setMetodo(Pagamento.Metodo.PIX_SIMULADO);
        pagamentos.save(pagamento);
        return agendamentos.save(a);
    }

    @Transactional
    public Agendamento atualizar(Long id, Map<String, String> dados) {
        Agendamento a = buscar(id);
        if (a.getStatus() == Agendamento.StatusAgendamento.CANCELADO) throw new ResponseStatusException(HttpStatus.CONFLICT, "Agendamento cancelado não pode ser alterado.");
        if (dados.containsKey("data") || dados.containsKey("horario")) {
            LocalDate data = dados.containsKey("data") ? LocalDate.parse(dados.get("data")) : a.getData();
            LocalTime hora = dados.containsKey("horario") ? LocalTime.parse(dados.get("horario")) : a.getHorario();
            validarDataHorario(data, hora);
            if (agendamentos.existsByDataAndHorarioAndStatusNot(data, hora, Agendamento.StatusAgendamento.CANCELADO) && (!data.equals(a.getData()) || !hora.equals(a.getHorario())))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Este horário já está reservado.");
            a.setData(data); a.setHorario(hora);
        }
        if (dados.containsKey("status")) {
            try { a.setStatus(Agendamento.StatusAgendamento.valueOf(dados.get("status").toUpperCase().replace('-', '_'))); }
            catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status inválido."); }
        }
        if (dados.containsKey("observacao")) a.setObservacao(dados.get("observacao"));
        return agendamentos.save(a);
    }

    @Transactional
    public void cancelar(Long id) {
        Agendamento a = buscar(id);
        a.setStatus(Agendamento.StatusAgendamento.CANCELADO);
        agendamentos.save(a);
    }
    public Agendamento buscar(Long id) { return agendamentos.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado.")); }
    public BigDecimal faturamento(LocalDate inicio, LocalDate fim) { return agendamentos.valorServicosEntre(inicio, fim, Agendamento.StatusAgendamento.CANCELADO); }
    public BigDecimal valorServico(Servico servico, LocalDate data) {
        return servico.isPromocaoTerca() && data.getDayOfWeek() == DayOfWeek.TUESDAY && servico.getPrecoTerca() != null
                ? servico.getPrecoTerca() : servico.getPreco();
    }
    private String obrigatorio(Map<String, String> dados, String chave) {
        String valor = dados.get(chave);
        if (valor == null || valor.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo obrigatório: " + chave);
        return valor.trim();
    }
    private void validarDataHorario(LocalDate data, LocalTime horario) {
        if (data.isBefore(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível agendar em uma data passada.");
        DayOfWeek dia = data.getDayOfWeek();
        if (dia == DayOfWeek.SUNDAY || horario.isBefore(LocalTime.of(10, 0)) || horario.plusMinutes(40).isAfter(LocalTime.of(18, 30)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A barbearia está fechada neste horário.");
    }
}
