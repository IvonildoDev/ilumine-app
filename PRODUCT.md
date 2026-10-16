# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Dois perfis no mesmo órgão de iluminação pública da prefeitura:
- **Equipes de campo** (primário): eletricistas e agentes que percorrem a cidade, encontram postes com defeito e precisam registrá-los rápido, na rua, muitas vezes com uma mão ocupada e sob sol ou à noite.
- **Gestão / coordenação** (confirmado pelo usuário): quem acompanha as ordens de serviço (OS), prioriza e distribui o trabalho entre as equipes de campo, usando as telas de Relatório e Equipes.

## Product Purpose

Ilumine ajuda órgãos de iluminação pública e prefeituras a melhorar a gestão de ordens de serviço (OS) com as equipes de campo: registrar defeitos em postes (plaqueta, defeito, fotos, localização), acompanhar o andamento de cada OS e organizar as rotas das equipes. Sucesso: um defeito é cadastrado em segundos, com localização e evidência confiáveis, e chega à equipe certa na ordem de impacto.

## Positioning

Fluxo de campo centrado na plaqueta do poste: o código é lido por QR/código de barras, a localização vem do GPS e as ocorrências são priorizadas por impacto e agrupadas em rotas por equipe, tudo no mesmo app.

## Operating Context

- Uso ao ar livre, em movimento, com sinal de rede potencialmente ruim.
- Dados guardados localmente em SQLite (offline); não há backend ou sincronização ainda.
- Interface em português do Brasil.
- Fluxo central: escanear plaqueta, escolher defeito, fotografar o local, confirmar cadastro; depois acompanhar no Relatório (Todos / Aguardando / Em rota / Concluído), abrir no mapa e marcar como concluído.

## Capabilities and Constraints

- Telas atuais: Cadastro, Relatório, Equipes, detalhe da Ocorrência, Scanner de plaqueta.
- Permissões nativas: câmera (plaqueta e foto do defeito), localização em uso; sem microfone, sem galeria.
- Prioridades de ocorrência incluem "crítica"; equipes têm indicação de itens urgentes e envio de rotas.
- Retrato apenas; Expo SDK 57 / React Native, Expo Router.
- Indefinido: backend, autenticação/papéis, sincronização, volume de dados e a lista oficial de tipos de defeito.

## Brand Commitments

Nome "Ilumine". Nenhuma identidade visual, voz ou ativo de marca foi declarado como obrigatório.

## Evidence on Hand

Ícones e splash padrão em `assets/images`. Não há depoimentos, métricas, logotipo do órgão ou dados reais de ocorrências; não inventar.

## Product Principles

- Velocidade em campo antes de tudo: registrar uma ocorrência deve exigir o mínimo de toques e funcionar sem rede.
- Evidência confiável: plaqueta, foto e localização são a prova da ocorrência.
- Prioridade visível: o que é crítico ou urgente deve ser inequívoco à primeira vista.
- Linguagem direta em pt-BR, no vocabulário do trabalho de iluminação pública.
