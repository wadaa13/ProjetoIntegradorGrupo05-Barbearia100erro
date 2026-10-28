package com.git.Barbearia100erro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_pagamento")
@Getter @Setter @NoArgsConstructor
public class Pagamento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "agendamento_id", nullable = false)
    private Agendamento agendamento;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Metodo metodo = Metodo.CARTAO_SIMULADO;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.APROVADO;
    @Column(nullable = false)
    private LocalDateTime dataPagamento = LocalDateTime.now();

    public enum Metodo { CARTAO_SIMULADO, PIX_SIMULADO, DINHEIRO }
    public enum Status { APROVADO, ESTORNADO }
}
