# Release v3.38.41

## 🚀 Melhorias no Vision Fallback e Detecção de Capacidades

Esta versão foca em tornar o sistema de **Vision Fallback** mais robusto e inteligente, garantindo que o redirecionamento para modelos com suporte a visão ocorra de forma transparente, independentemente de como a imagem é enviada.

### 🛠️ O que mudou?

#### 1. Detecção Inteligente de Conteúdo de Visão

* **Auto-detecção em Texto**: Agora o sistema detecta automaticamente se você colou um `data:image/` ou uma referência `copilot-file://` diretamente no campo de mensagem, mesmo que o checkbox "Include Media" não esteja marcado.
* **Gatilho de Fallback**: Se conteúdo de visão for detectado em um modelo que não o suporta (como `gpt-4o-mini`), o fallback é acionado automaticamente.

#### 2. Correção na Lógica de Capacidades Estáticas

* **Fix Chat Model**: Corrigido um erro onde o nó `Chat Model` falhava ao verificar capacidades em modo offline/estático devido a uma estrutura de objeto incorreta.
* **Suporte Multimodal**: A verificação de suporte agora inclui explicitamente a flag `multimodal`, garantindo compatibilidade com modelos Google Gemini e outros que usam essa nomenclatura.

#### 3. Consistência entre Nós

* Sincronização da lógica de detecção de visão entre os nós **Chat Model**, **Chat API** e **OpenAI**.
* Melhoria nos logs de depuração para facilitar a identificação de quando e por que um fallback foi acionado.

### 📦 Impacto

* **Usuários do GPT-4o Mini**: Agora podem enviar imagens com segurança; o sistema cuidará de usar o `gpt-4o` (ou seu fallback preferido) apenas para o processamento da imagem, economizando tokens e evitando erros de API.

---
*Data do Release: 2025-12-30*
*Versão: 3.38.41*
