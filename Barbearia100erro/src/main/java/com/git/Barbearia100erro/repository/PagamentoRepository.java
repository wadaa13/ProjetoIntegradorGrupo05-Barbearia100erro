package com.git.Barbearia100erro.repository;

import com.git.Barbearia100erro.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    List<Pagamento> findByAgendamentoIdOrderByDataPagamentoAsc(Long agendamentoId);
}
