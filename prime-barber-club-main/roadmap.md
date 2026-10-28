# Roadmap

## Done
- Plan descriptions: Prata 160 (só corte, um serviço por vez na semana), Ouro 200 (corte e barba, um serviço por vez na semana), Prime 230 (ilimitado, corte e barba por tempo e vezes ilimitadas).
- Promoção de terça-feira: corte por R$ 35 (aplicada no preço do agendamento, não só no banner).
- Mapa pequeno do Google no rodapé com o endereço do link enviado (tiles do mapa carregando, testado no navegador).
- Horário de funcionamento: 10h às 18h30, segunda a sábado (horários do calendário ajustados).
- Fonte do preço dos planos mensais: voltou ao tamanho original.
- Senha do painel do gestor: barbearia100erro.
- Área de avaliações no site (seção "Avaliações" na página inicial) + publicação/edição/exclusão em /admin > Avaliações.
- Dados já salvos no aparelho são atualizados para os planos, a promoção, o horário e as avaliações novos.

## Open
- Avaliações automáticas do Google (ler as reviews do perfil direto do Google Maps).
  - Bloqueio: a conexão do Google Maps/Places foi recusada na caixa de aprovação; sem ela o site não consegue ler as reviews do Google.
  - Enquanto isso: a seção mostra depoimentos publicados pela barbearia (editáveis em /admin > Avaliações) e o botão "Ver e avaliar no Google".
  - Para liberar: aprovar a conexão do Google Maps quando o usuário quiser (google_maps para até 5 reviews; google_business_profile para o feed completo).
