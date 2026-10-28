package com.git.Barbearia100erro.config;

import com.git.Barbearia100erro.model.Admin;
import com.git.Barbearia100erro.model.Promocao;
import com.git.Barbearia100erro.model.Servico;
import com.git.Barbearia100erro.repository.AdminRepository;
import com.git.Barbearia100erro.repository.PromocaoRepository;
import com.git.Barbearia100erro.repository.ServicoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
public class DadosIniciais {
    @Bean
    CommandLineRunner inicializar(ServicoRepository servicos, PromocaoRepository promocoes, AdminRepository admins) {
        return args -> {
            if (servicos.count() == 0) {
                Servico corte = criarServico(servicos, "Corte", "Corte masculino com acabamento na navalha.", "50", 40);
                corte.setPromocaoTerca(true); corte.setPrecoTerca(new BigDecimal("35.00")); servicos.save(corte);
                criarServico(servicos, "Corte e barba", "Combo completo: corte e barba alinhada.", "70", 60);
                criarServico(servicos, "Barba", "Barba modelada com toalha quente.", "25", 30);
                criarServico(servicos, "Sobrancelha", "Limpeza e alinhamento da sobrancelha.", "10", 10);
                criarServico(servicos, "Pezinho", "Acabamento do contorno entre cortes.", "20", 15);
            }
            if (promocoes.count() == 0) {
                criarPromocao(promocoes, "Terça-feira · Corte por R$ 35", "Todas as terças-feiras os cortes saem por R$ 35. O desconto é aplicado no agendamento.", 30, "Terças-feiras");
            }
            if (admins.count() == 0) {
                Admin admin = new Admin(); admin.setDocumento("ADMIN-100ERRO"); admin.setEmail("gestor@100erro.com"); admin.setSenha("demo1234"); admins.save(admin);
            }
        };
    }
    private Servico criarServico(ServicoRepository repository, String nome, String descricao, String preco, int duracao) {
        Servico s = new Servico(); s.setNome(nome); s.setDescricao(descricao); s.setPreco(new BigDecimal(preco)); s.setDuracaoMinutos(duracao); s.setAtivo(true); return repository.save(s);
    }
    private void criarPromocao(PromocaoRepository repository, String titulo, String descricao, int desconto, String dias) {
        Promocao p = new Promocao(); p.setTitulo(titulo); p.setDescricao(descricao); p.setPorcentagemDesconto(desconto); p.setDiasAplicacao(dias); p.setAtivo(true); repository.save(p);
    }
}
