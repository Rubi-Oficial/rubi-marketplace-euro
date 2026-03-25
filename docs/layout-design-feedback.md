# Avaliação de Layout e Design — Rubi Marketplace Euro

Data: 2026-03-25

## Pontos fortes

1. **Identidade visual consistente**
   - A paleta premium com acento rubi está bem definida via design tokens globais (`--primary`, gradientes e utilitários). Isso facilita consistência entre páginas.
2. **Navegação principal clara**
   - Navbar fixa com busca, categorias e atalhos essenciais melhora descoberta de conteúdo.
3. **Boa base responsiva**
   - Estrutura desktop/mobile já está separada na navegação com menu mobile dedicado.
4. **Filtros objetivos na home**
   - Botões de filtro e localização com contadores ajudam o usuário a entender o estado da busca.

## Oportunidades de melhoria (priorizadas)

### 1) Hierarquia visual da home (Alta)
- Hoje a listagem entra muito cedo sem um **hero** com proposta de valor mais forte.
- Sugestão:
  - Inserir bloco inicial com headline + subtítulo + CTA primário (explorar) e CTA secundário (cadastro).
  - Destacar prova social/credibilidade (ex.: perfis verificados, cobertura por cidades).

### 2) Busca e filtros no mobile (Alta)
- A experiência mobile pode ficar mais fluida com uma barra de ação fixa inferior para “Filtrar” e “Localização”.
- Sugestão:
  - “Sticky bottom actions” no mobile para reduzir rolagem até controles.
  - Exibir resumo dos filtros ativos em 1 linha truncada.

### 3) Consistência de espaçamentos e densidade (Média)
- Em algumas áreas, o layout usa blocos compactos (chips e categorias) e cartões grandes, criando contraste de densidade.
- Sugestão:
  - Padronizar escala de spacing (ex.: 4/8/12/16/24/32).
  - Revisar `gap` entre cards e blocos de ação para reduzir “saltos visuais”.

### 4) Acessibilidade de contraste e foco (Média)
- Vários elementos usam tons suaves (`border/40`, `muted`) que podem perder legibilidade em telas de baixa qualidade.
- Sugestão:
  - Validar contraste mínimo (WCAG AA) para texto pequeno e placeholders.
  - Fortalecer estilo de foco visível para teclado em botões, links e inputs.

### 5) Navegação por categorias (Média)
- A barra horizontal de categorias funciona bem, porém pode ficar longa em catálogos com muitas opções.
- Sugestão:
  - Adicionar agrupamento (“Mais”) ou mini-filtro por categoria no mobile.
  - Mostrar estado ativo com contraste mais forte e microanimação curta.

### 6) Estados vazios e carregamento (Média)
- A home já possui skeleton e placeholders, o que é ótimo.
- Sugestão:
  - No estado vazio, incluir mensagem contextual + CTA de ajuste de filtros (ex.: “remover localização” ou “limpar serviço”).

## Checklist prático de evolução (sprint curta)

1. Criar hero simples na landing com CTA duplo.
2. Melhorar sticky actions de filtro no mobile.
3. Padronizar espaçamentos principais da home e navbar.
4. Fazer revisão rápida de contraste e foco (teclado).
5. Melhorar empty state com ação contextual.

## Resultado esperado

- Melhor primeira impressão (branding + clareza de valor).
- Aumento de conversão em navegação mobile.
- Menos fricção para encontrar perfis com filtros.
- Melhor percepção de qualidade visual e acessibilidade.
