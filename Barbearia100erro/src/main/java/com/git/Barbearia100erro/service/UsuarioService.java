package com.git.Barbearia100erro.service;

import com.git.Barbearia100erro.model.Usuario;
import com.git.Barbearia100erro.repository.UsuarioRepository;
import com.git.Barbearia100erro.service.AgendamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class UsuarioService {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private final UsuarioRepository repository;
    private final AgendamentoService agendamentoService;
    public UsuarioService(UsuarioRepository repository, AgendamentoService agendamentoService) { this.repository = repository; this.agendamentoService = agendamentoService; }

    public Usuario cadastrar(Map<String, String> dados) {
        String nome = valor(dados, "nome"), email = valor(dados, "email").toLowerCase(), telefone = valor(dados, "telefone");
        String documento = valor(dados, "documento");
        if (nome.isBlank() || telefone.isBlank() || documento.isBlank() || !EMAIL.matcher(email).matches() || valor(dados, "senha").length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha nome, documento, telefone, e-mail válido e senha com pelo menos 6 caracteres.");
        if (repository.existsByEmail(email) || repository.existsByDocumento(documento) || repository.existsByTelefone(telefone))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail, documento ou telefone.");
        Usuario usuario = new Usuario();
        usuario.setNome(nome); usuario.setEmail(email); usuario.setTelefone(telefone); usuario.setDocumento(documento);
        usuario.setSenha(valor(dados, "senha")); usuario.setPapel("CLIENTE");
        String aniversario = dados.get("dataNascimento");
        if (aniversario != null && !aniversario.isBlank()) usuario.setDataNascimento(java.time.LocalDate.parse(aniversario));
        return repository.save(usuario);
    }

    public Usuario autenticar(String email, String senha) {
        Usuario usuario = repository.findByEmail(email.toLowerCase()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));
        if (!usuario.getSenha().equals(senha)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        return usuario;
    }

    public Usuario buscar(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado.")); }
    public long visitasConcluidas(Long id) { buscar(id); return agendamentoService.visitasConcluidas(id); }
    public Usuario atualizar(Long id, Map<String, String> dados) {
        Usuario usuario = buscar(id);
        if (dados.containsKey("nome")) usuario.setNome(valor(dados, "nome"));
        if (dados.containsKey("telefone")) {
            String telefone = valor(dados, "telefone");
            if (!telefone.equals(usuario.getTelefone()) && repository.existsByTelefone(telefone)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já utilizado por outra conta.");
            usuario.setTelefone(telefone);
        }
        if (dados.containsKey("email")) {
            String email = valor(dados, "email").toLowerCase();
            if (!EMAIL.matcher(email).matches()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um e-mail válido.");
            if (!email.equals(usuario.getEmail()) && repository.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já utilizado por outra conta.");
            usuario.setEmail(email);
        }
        if (dados.containsKey("preferenciaCorte")) usuario.setPreferenciaCorte(dados.get("preferenciaCorte"));
        if (dados.containsKey("dataNascimento")) usuario.setDataNascimento(dados.get("dataNascimento").isBlank() ? null : java.time.LocalDate.parse(dados.get("dataNascimento")));
        return repository.save(usuario);
    }
    private String valor(Map<String, String> dados, String chave) { return dados.getOrDefault(chave, "").trim(); }
}
