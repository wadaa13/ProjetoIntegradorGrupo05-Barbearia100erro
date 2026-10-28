package com.git.Barbearia100erro.repository;

import com.git.Barbearia100erro.model.Promocao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromocaoRepository extends JpaRepository<Promocao, Long> {
    List<Promocao> findByAtivoTrueOrderByIdAsc();
}
