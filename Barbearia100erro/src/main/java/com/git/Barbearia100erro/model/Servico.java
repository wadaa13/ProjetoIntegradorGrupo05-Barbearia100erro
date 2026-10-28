package com.git.Barbearia100erro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_servico")
@Getter @Setter @NoArgsConstructor
public class Servico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 100)
    private String nome;
    @Column(nullable = false, length = 1000)
    private String descricao;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;
    @Column(nullable = false)
    private Integer duracaoMinutos;

    @Column(nullable = false)
    private boolean promocaoTerca;

    @Column(precision = 10, scale = 2)
    private BigDecimal precoTerca;

    @Column(nullable = false)
    private boolean ativo = true;
}
