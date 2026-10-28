package com.git.Barbearia100erro.repository;

import com.git.Barbearia100erro.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Long> {
    List<Servico> findByAtivoTrueOrderByIdAsc();
    boolean existsByNomeIgnoreCase(String nome);
}
