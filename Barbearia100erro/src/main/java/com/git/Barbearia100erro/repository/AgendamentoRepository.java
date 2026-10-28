package com.git.Barbearia100erro.repository;

import com.git.Barbearia100erro.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    boolean existsByDataAndHorarioAndStatusNot(LocalDate data, LocalTime horario, Agendamento.StatusAgendamento status);
    List<Agendamento> findByDataOrderByHorarioAsc(LocalDate data);
    List<Agendamento> findByClienteIdOrderByDataDescHorarioDesc(Long clienteId);
    List<Agendamento> findAllByOrderByDataAscHorarioAsc();
    List<Agendamento> findByDataBetweenOrderByDataAscHorarioAsc(LocalDate inicio, LocalDate fim);
    long countByDataAndStatus(LocalDate data, Agendamento.StatusAgendamento status);
    @Query("select coalesce(sum(case when extract(day of week from a.data) = 3 and a.servico.promocaoTerca = true then a.servico.precoTerca else a.servico.preco end), 0) from Agendamento a where a.data between :inicio and :fim and a.status <> :cancelado")
    BigDecimal valorServicosEntre(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim,
                                  @Param("cancelado") Agendamento.StatusAgendamento cancelado);
    long countByDataAndStatusNot(LocalDate data, Agendamento.StatusAgendamento status);
    @Query("select a.servico.id, count(a) from Agendamento a where a.status <> :cancelado group by a.servico.id")
    List<Object[]> contarVendasPorServico(@Param("cancelado") Agendamento.StatusAgendamento cancelado);
    @Query("select a.data, coalesce(sum(case when extract(day of week from a.data) = 3 and a.servico.promocaoTerca = true then a.servico.precoTerca else a.servico.preco end), 0) from Agendamento a where a.data between :inicio and :fim and a.status <> :cancelado group by a.data order by a.data")
    List<Object[]> faturamentoDiario(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim,
                                     @Param("cancelado") Agendamento.StatusAgendamento cancelado);
}
