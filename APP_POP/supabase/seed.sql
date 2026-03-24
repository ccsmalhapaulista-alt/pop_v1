insert into public.categorias_pop (nome, descricao, ativo)
values
  ('Manobras', 'Procedimentos ligados a desengate, acoplamento e movimentação de composições.', true),
  ('Equipamentos', 'Itens de inspeção e resposta operacional em equipamentos ferroviários.', true),
  ('Sinalização e Via', 'Ocorrências e leitura operacional de componentes de via permanente.', true),
  ('Segurança Operacional', 'Rotinas críticas com impacto direto na segurança do agente e da circulação.', true)
on conflict (nome) do update
set descricao = excluded.descricao,
    ativo = excluded.ativo,
    updated_at = timezone('utc', now());

insert into public.pop_itens (
  titulo,
  categoria,
  subcategoria,
  criticidade,
  status,
  palavras_chave,
  o_que_e,
  principais_riscos,
  principais_evidencias,
  principais_causas,
  procedimento_agente,
  observacoes
)
values
  (
    'Desengate entre vagões',
    'Manobras',
    'Acoplamento',
    'CRITICA',
    'PUBLICADO',
    'desengate, vagões, acoplamento, manobra',
    'Situação em que ocorre separação não planejada entre vagões durante manobra, deslocamento ou parada de composição.',
    'Movimentação descontrolada, esmagamento, queda de material, colisão e comprometimento da integridade da composição.',
    'Folga anormal no engate, ruído metálico incomum, desalinhamento entre vagões e abertura visível do aparelho de choque e tração.',
    'Engate mal travado, desgaste mecânico, falha de inspeção prévia, impacto excessivo na manobra ou defeito estrutural do componente.',
    'Isolar a área, comunicar imediatamente o CCO ou liderança, impedir nova movimentação, confirmar ausência de vítimas, inspecionar visualmente o conjunto e aguardar liberação técnica conforme protocolo local.',
    'Registrar horário, composição envolvida, sentido da via e condições observadas para rastreabilidade da ocorrência.'
  ),
  (
    'Cabos jumper',
    'Equipamentos',
    'Conexões',
    'ALTA',
    'PUBLICADO',
    'jumper, cabo, locomotiva, comunicação',
    'Cabos responsáveis por interligar sistemas de comunicação, comando ou alimentação entre locomotivas e composições.',
    'Perda de comunicação operacional, falha em comandos, risco de curto, aquecimento e indisponibilidade do equipamento.',
    'Cabo partido, conector solto, aquecimento, desgaste do isolamento, falha de comunicação entre equipamentos ou alarmes recorrentes.',
    'Manuseio inadequado, vibração excessiva, envelhecimento do material, armazenamento incorreto ou contaminação por água e óleo.',
    'Suspender o uso do cabo com anomalia, sinalizar a equipe, substituir por componente íntegro quando previsto, registrar a ocorrência e solicitar avaliação de manutenção.',
    'Nunca improvisar reparos em campo sem procedimento autorizado e equipamento homologado.'
  ),
  (
    'Buzina da locomotiva',
    'Equipamentos',
    'Sinal sonoro',
    'MEDIA',
    'PUBLICADO',
    'buzina, locomotiva, sinal sonoro, alerta',
    'Dispositivo sonoro utilizado para advertência operacional, comunicação de aproximação e proteção de circulação.',
    'Redução da capacidade de alerta a pessoas e equipes de via, falha de comunicação sonora e aumento do risco operacional em passagens e pátios.',
    'Som intermitente, ausência de acionamento, baixa intensidade sonora, acionamento travado ou reclamação de equipes em campo.',
    'Falha elétrica, problema pneumático, obstrução do componente, desgaste interno ou falta de inspeção preventiva.',
    'Confirmar a falha, comunicar imediatamente a liderança operacional, aplicar restrições previstas no procedimento interno, reforçar medidas alternativas de alerta e direcionar o equipamento para avaliação técnica.',
    'Em áreas críticas, considerar apoio adicional de solo conforme regra local.'
  ),
  (
    'AMV',
    'Sinalização e Via',
    'Aparelho de mudança de via',
    'CRITICA',
    'PUBLICADO',
    'amv, mudança de via, agulha, via permanente',
    'Componente de via permanente que permite a mudança controlada de uma linha para outra, exigindo inspeção e posicionamento corretos.',
    'Descarrilamento, rota indevida, retenção de composição, colisão lateral e comprometimento de circulação.',
    'Agulha fora de posição, travamento, dificuldade de chaveamento, ruído anormal, folga mecânica ou indicação divergente do estado da via.',
    'Acúmulo de material, falha mecânica, manutenção insuficiente, operação indevida ou obstrução na caixa de manobra.',
    'Interromper a movimentação na área afetada, proteger a via, comunicar de imediato o centro de controle, confirmar posição do AMV sem exposição a risco e aguardar atuação autorizada da equipe responsável.',
    'Toda intervenção deve respeitar bloqueio operacional, comunicação formal e confirmação visual segura.'
  )
on conflict do nothing;
