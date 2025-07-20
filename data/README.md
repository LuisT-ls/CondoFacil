# Projeto Web Modular

## Estrutura do Projeto

```
├── assets/
│   ├── css/
│   │   ├── main.css (arquivo principal)
│   │   └── modules/
│   │       ├── base/          # Estilos fundamentais
│   │       ├── components/    # Componentes reutilizáveis
│   │       ├── features/      # Funcionalidades específicas
│   │       ├── layout/        # Estrutura das páginas
│   │       └── utils/         # Utilitários e helpers
│   └── img/
│       └── favicon/
├── js/
│   ├── main.js
│   └── modules/
├── pages/
│   ├── css/                   # Estilos específicos de páginas
│   ├── privacy.html
│   └── terms-of-service.html
├── index.html
├── manifest.json
├── robots.txt
└── sw.js
```

## Como usar

1. Execute o script setup.sh para criar a estrutura
2. Desenvolva seus estilos nos módulos CSS apropriados
3. O arquivo main.css já importa todos os módulos automaticamente
4. Referencie apenas o main.css no seu HTML

## Metodologia CSS

Esta estrutura segue uma abordagem modular organizada por:
- **Base**: Reset, variáveis, tipografia
- **Layout**: Container, header, footer, seções
- **Components**: Botões, inputs, modais, etc.
- **Utils**: Classes utilitárias e helpers
- **Pages**: Estilos específicos de cada página
