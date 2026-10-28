package com.git.Barbearia100erro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "tb_usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String documento;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true, length = 30)
    private String telefone;

    @Column(nullable = false)
    @JsonIgnore
    private String senha;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(length = 1000)
    private String preferenciaCorte;

    @Column(nullable = false)
    private String papel; // "CLIENTE", "ADMIN", etc.

    @OneToMany(mappedBy = "cliente")
    private List<Agendamento> agendamentos;
}
