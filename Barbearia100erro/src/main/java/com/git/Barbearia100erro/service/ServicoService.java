package com.git.Barbearia100erro.service;

import com.git.Barbearia100erro.model.Servico;
import com.git.Barbearia100erro.repository.ServicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class ServicoService {
    private final ServicoRepository repository;
    public ServicoService(ServicoRepository repository) { this.repository = repository; }
    public List<Servico> listar() { return repository.findByAtivoTrueOrderByIdAsc(); }
    public List<Servico> listarTodos() { return repository.findAll(); }
    public Servico buscar(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado.")); }
    public Servico salvar(Servico servico) {
        if (servico.getPreco() == null || servico.getPreco().signum() < 0 || servico.getDuracaoMinutos() == null || servico.getDuracaoMinutos() < 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preço e duração devem ser válidos.");
        if (servico.getNome() == null || servico.getNome().isBlank() || servico.getDescricao() == null || servico.getDescricao().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome e descrição são obrigatórios.");
        if (servico.getId() != null && !repository.existsById(servico.getId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado.");
        if (repository.existsByNomeIgnoreCase(servico.getNome()) && (servico.getId() == null || !repository.findById(servico.getId()).map(s -> s.getNome().equalsIgnoreCase(servico.getNome())).orElse(false)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um serviço com este nome.");
        return repository.save(servico);
    }
    public void remover(Long id) {
        Servico servico = buscar(id);
        servico.setAtivo(false);
        repository.save(servico);
    }
}
