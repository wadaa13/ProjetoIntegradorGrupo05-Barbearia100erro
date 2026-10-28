package com.git.Barbearia100erro.service;

import com.git.Barbearia100erro.model.Promocao;
import com.git.Barbearia100erro.repository.PromocaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class PromocaoService {
    private final PromocaoRepository repository;
    public PromocaoService(PromocaoRepository repository) { this.repository = repository; }
    public List<Promocao> listarAtivas() { return repository.findByAtivoTrueOrderByIdAsc(); }
    public List<Promocao> listarTodas() { return repository.findAll(); }
    public Promocao salvar(Promocao promocao) {
        if (promocao.getTitulo() == null || promocao.getTitulo().isBlank() || promocao.getPorcentagemDesconto() == null || promocao.getPorcentagemDesconto() < 0 || promocao.getPorcentagemDesconto() > 100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe título e desconto entre 0 e 100%.");
        if (promocao.getId() != null && !repository.existsById(promocao.getId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Promoção não encontrada.");
        if (promocao.getDescricao() == null) promocao.setDescricao("");
        if (promocao.getAtivo() == null) promocao.setAtivo(true);
        return repository.save(promocao);
    }
    public void remover(Long id) {
        Promocao promocao = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promoção não encontrada."));
        promocao.setAtivo(false);
        repository.save(promocao);
    }
}
