package com.git.Barbearia100erro.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tb_promocao")
@Getter @Setter @NoArgsConstructor
public class Promocao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String titulo;
    @Column(columnDefinition = "TEXT")
    private String descricao;
    @Column(name = "valor_desconto", precision = 10, scale = 2)
    private BigDecimal valorDesconto;
    @Column(name = "porcentagem_desconto")
    private Integer porcentagemDesconto;
    @Column(name = "imagem_url")
    private String imagemUrl;
    @Column(name = "data_inicio")
    private LocalDate dataInicio;
    @Column(name = "data_fim")
    private LocalDate dataFim;
    @Column(nullable = false)
    private Boolean ativo = true;
    @Column(name = "dias_aplicacao", length = 100)
    private String diasAplicacao;
}
