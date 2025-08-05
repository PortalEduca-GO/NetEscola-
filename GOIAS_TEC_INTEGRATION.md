# Configuração do Canal Goiás Tec - NetEscola+

## 🎯 Integração com Canal @goiastec.3serie

Este projeto agora está integrado especificamente com o canal **@goiastec.3serie** do YouTube para fornecer recomendações de vídeos educacionais.

## 🔧 Configuração da API do YouTube (Opcional)

Para busca em tempo real de vídeos do canal, você pode configurar a YouTube Data API v3:

### 1. Obter uma API Key

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **YouTube Data API v3**
4. Crie credenciais (API Key)
5. Configure as restrições da API Key (recomendado)

### 2. Configurar no Projeto

Crie um arquivo `.env` na raiz do projeto:

```bash
REACT_APP_YOUTUBE_API_KEY=sua_api_key_aqui
```

### 3. Funcionalidades da Integração

#### ✅ **Com API Key Configurada:**
- ✨ Busca em tempo real de vídeos do canal @goiastec.3serie
- 🔍 Filtragem automática por disciplina
- 📊 Identificação inteligente de conteúdo por série
- 🆕 Acesso aos vídeos mais recentes do canal
- 📈 Recomendações baseadas em relevância

#### ✅ **Sem API Key (Fallback):**
- 📚 Utiliza vídeos pré-curados do canal
- 🎯 Funcionalidade completa de filtragem
- 💪 Sistema totalmente funcional
- 🔒 Não requer configuração adicional

## 🎓 Como Funciona a Busca por Disciplinas

### Mapeamento Inteligente de Conteúdo

O sistema identifica automaticamente a disciplina dos vídeos baseado em:

- **Palavras-chave no título**
- **Descrição do vídeo**
- **Indicadores de série/ano**

### Disciplinas Suportadas

| Disciplina | Palavras-chave |
|------------|----------------|
| **Matemática** | matemática, álgebra, geometria, trigonometria, função, equação |
| **Português** | português, literatura, gramática, redação, interpretação |
| **Física** | física, mecânica, eletricidade, óptica, termodinâmica |
| **Química** | química, orgânica, inorgânica, estequiometria, atomística |
| **Biologia** | biologia, botânica, zoologia, genética, ecologia, citologia |
| **História** | história, brasil, guerra, república, idade média |
| **Geografia** | geografia, relevo, clima, população, cartografia |
| **Filosofia** | filosofia, ética, lógica, epistemologia, metafísica |
| **Sociologia** | sociologia, sociedade, cultura, política, antropologia |
| **Inglês** | inglês, english, grammar, vocabulary, conversation |

## 🎯 Funcionalidades para o Usuário

### 📚 **Recomendações de Reforço**
- Identifica disciplinas com baixo desempenho
- Busca vídeos específicos do canal Goiás Tec
- Prioriza conteúdo da série do aluno

### 🔍 **Busca por Disciplina**
- Interface intuitiva para seleção de matérias
- Busca direcionada no canal @goiastec.3serie
- Resultados organizados por relevância

### ✅ **Validação de Conteúdo**
- Verificação automática de vídeos disponíveis
- Cache inteligente para performance
- Fallback para conteúdo alternativo

## 🚀 Vantagens da Integração

1. **Conteúdo Oficial**: Vídeos diretamente do canal autorizado
2. **Atualização Automática**: Acesso aos vídeos mais recentes
3. **Filtragem Inteligente**: Identificação automática de disciplinas
4. **Performance Otimizada**: Sistema de cache avançado
5. **Experiência Completa**: Funciona com ou sem API

## 📖 Uso no Sistema

### Para Recomendações de Reforço:
```typescript
// Busca automática baseada em dificuldades do aluno
const reinfocementVideos = await goiasTecChannelService.searchVideosBySubject('Matemática', 10);
```

### Para Busca Específica:
```typescript
// Busca direcionada por disciplina escolhida pelo usuário
const mathVideos = await goiasTecChannelService.searchVideosBySubject('Matemática', 15);
```

### Cache e Performance:
- **Cache de vídeos**: 30 minutos
- **Cache de thumbnails**: 1 hora
- **Fallback automático**: Sempre funcional

---

**🎓 Canal Oficial:** [@goiastec.3serie](https://www.youtube.com/@goiastec.3serie)

**💡 Resultado:** Sistema educacional mais eficiente e alinhado com o currículo oficial!
