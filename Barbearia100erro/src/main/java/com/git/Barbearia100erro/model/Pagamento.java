import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_pagamento")
@Getter
@Setter
@NoArgsConstructor
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agendamento_id", nullable = false, unique = true)
    private Agendamento agendamento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "metodo_pagamento", nullable = false)
    private String metodoPagamento; // "PIX", "CARTAO_CREDITO", "DINHEIRO_PRESENCIAL"

    @Column(name = "status_pagamento", nullable = false)
    private String statusPagamento; // "PENDENTE", "PAGO", "FALHOU"

    @Column(name = "transacao_gateway_id")
    private String transacaoGatewayId;

    @Column(name = "pago_em")
    private LocalDateTime pagoEm;
}