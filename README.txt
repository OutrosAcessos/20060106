JORNADA MILIONÁRIA — PLANEADOR PESSOAL
Versão 2.0

O QUE INCLUI
- Painel geral com progresso e tarefas do dia
- Horário diário editável
- Calendário mensal com tarefas
- Criar, editar, concluir, pesquisar e apagar tarefas
- Áreas: Universidade, Programação, Cibersegurança, Inglês, EduMind e Pessoal
- Plano de desenvolvimento de 90 dias
- Metas e revisão semanal
- Lembretes locais via notificações do navegador
- Exportar/importar cópia de segurança JSON
- Cache offline e instalação como PWA em navegadores compatíveis
- Interface responsiva para computador e telemóvel

COMO USAR OFFLINE NO COMPUTADOR
1. Extrai o ZIP para uma pasta.
2. Abre index.html no navegador.
3. As tarefas e definições ficam guardadas no localStorage deste navegador.
Nota: abrir por file:// permite usar as funções principais offline, mas Service Worker/PWA não funcionam normalmente nesse modo.

COMO ATIVAR A EXPERIÊNCIA ONLINE + OFFLINE (RECOMENDADO)
1. Publica a pasta num alojamento estático com HTTPS (por exemplo, GitHub Pages, Netlify ou outro alojamento estático).
2. Abre o endereço no navegador.
3. A aplicação instala o Service Worker e guarda os ficheiros principais em cache.
4. Abre a app uma vez online; depois de carregar, as páginas principais podem funcionar offline.
5. No navegador compatível, escolhe “Instalar app” ou “Adicionar ao ecrã principal”.

NOTIFICAÇÕES — LIMITAÇÕES IMPORTANTES
- É necessário permitir notificações no navegador e no sistema operativo.
- Esta versão verifica os horários enquanto a página/app está ativa. Pode avisar ao chegar a hora se a app estiver aberta e o navegador permitir. Os navegadores podem suspender a app e não garantir alertas em segundo plano.
- Navegadores podem suspender páginas em segundo plano, e notificações podem não chegar com a app fechada.
- Notificações push fiáveis com a app fechada exigem backend, serviço push, chaves VAPID e configuração adicional. Este projeto não inclui servidor nem sincronização cloud.
- A aplicação não envia dados para nenhum servidor. Os dados são locais a este navegador/dispositivo.
- Para usar em vários dispositivos, exporta o JSON num dispositivo e importa no outro. Não é sincronização automática.

SEGURANÇA DOS DADOS
- Exporta regularmente uma cópia JSON nas Definições.
- Limpar os dados do navegador pode apagar os dados guardados.
- A opção “Apagar todos os dados” é irreversível neste navegador.

HORÁRIO BASE
06:30–07:00 preparação
07:00–08:15 estudo prioritário
08:15–08:30 pausa
08:30–09:15 segundo bloco de estudo
09:15–09:40 inglês
09:40–10:25 competência profissional
10:25–11:00 preparar e sair
11:00–12:00 deslocação
12:00–13:00 almoço e preparação
13:00–17:00 aulas
17:00–21:00 regresso
21:00–22:00 jantar e descanso
22:00–22:15 preparar o dia seguinte
22:15–06:30 sono

Se o teu horário real for diferente, edita o horário dentro da aplicação.

ASSISTENTE INTELIGENTE
- O assistente incluído é local, baseado em regras e nas tarefas guardadas; funciona offline e não envia os teus dados.
- Não é um modelo de IA generativa. Para ligar um modelo real (por exemplo, via API), cria-se um backend seguro para proteger a chave da API. Nunca coloques uma chave secreta diretamente no JavaScript público.

NOVIDADES DA VERSÃO 2.0
- Menu hambúrguer: gaveta lateral no telemóvel/tablet; no computador recolhe a barra lateral para ícones
- Novo design moderno com tema claro/escuro (botão no topo ou em Definições)
- Layout totalmente responsivo (telemóvel, tablet e computador), com botão flutuante "+" e formulário em folha deslizante no telemóvel
- Calendário renovado: tarefas com cores por área, botão "Hoje", painel do dia ao lado, resumo do mês, setas do teclado e deslizar para mudar de mês
- Horário diário em linha do tempo com destaque do bloco atual ("AGORA")
- Correção: tarefas de exemplo tinham identificadores em falta (marcar/editar/apagar afetava todas) e a tarefa de "amanhã" usava uma data inválida
- Os dados da versão anterior mantêm-se (mesma chave de armazenamento)
