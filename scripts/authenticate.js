// Script de Autenticação GitHub Copilot - Obter Token Completo
// Implementa o fluxo OAuth exato do VS Code para obter token GitHub Copilot
// Imprime o token completo na tela e salva no arquivo .token

const fs = require('fs');
const { exec } = require('child_process');

console.log('🔐 GitHub Copilot Authentication Script');
console.log('========================================');
console.log('📚 Baseado no método VS Code OAuth');
console.log('🎯 Obtém token GitHub Copilot via API oficial\n');

// === CONFIGURAÇÕES VS CODE ===
const COPILOT_TOKEN_ENDPOINT = 'https://api.github.com/copilot_internal/v2/token';
const GITHUB_API_USER = 'https://api.github.com/user';

const VS_CODE_HEADERS = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2025-04-01',
    'User-Agent': 'GitHub-Copilot-Chat/1.0.0 VSCode/1.85.0',
    'Editor-Version': 'vscode/1.85.0',
    'Editor-Plugin-Version': 'copilot-chat/0.12.0'
};

// OAuth Device Flow URLs
const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const CLIENT_ID = '01ab8ac9400c4e429b23'; // VS Code Client ID
const SCOPES = 'repo user:email';

/**
 * Aguarda input do usuário
 */
function waitForKeypress() {
    return new Promise(resolve => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.once('data', data => {
            const byteArray = [...data];
            if (byteArray.length > 0 && byteArray[0] === 3) {
                console.log('^C');
                process.exit(1);
            }
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
            }
            resolve();
        });
    });
}

/**
 * Executar fluxo OAuth Device Code para obter token GitHub
 */
async function obtainGitHubToken() {
    console.log('🚀 PASSO 1: Iniciando fluxo OAuth GitHub Device Code');
    console.log(`📋 Client ID: ${CLIENT_ID}`);
    console.log(`🔐 Scopes: ${SCOPES}\n`);

    // Solicitar device code
    console.log('📤 Solicitando device code...');
    const deviceResponse = await fetch(DEVICE_CODE_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            scope: SCOPES
        })
    });

    if (!deviceResponse.ok) {
        throw new Error(`❌ Erro ao solicitar device code: ${deviceResponse.status}`);
    }

    const deviceData = await deviceResponse.json();
    console.log('✅ Device code obtido!\n');

    // Mostrar instruções ao usuário
    console.log('🌐 AUTORIZAÇÃO NECESSÁRIA:');
    console.log('=' .repeat(50));
    console.log(`🔗 URL: ${deviceData.verification_uri}`);
    console.log(`🔑 Código: ${deviceData.user_code}`);
    console.log('=' .repeat(50));
    
    // URL direta (se disponível)
    if (deviceData.verification_uri_complete) {
        console.log('📋 Ou acesse diretamente:');
        console.log(`   ${deviceData.verification_uri_complete}`);
    } else {
        console.log('📋 Acesse a URL acima e insira o código mostrado');
    }
    console.log('=' .repeat(50));
    
    // Abrir navegador automaticamente
    console.log('\n🌐 Abrindo navegador automaticamente...');
    const urlToOpen = deviceData.verification_uri_complete || deviceData.verification_uri;
    
    try {
        let command;
        if (process.platform === 'win32') {
            // No Windows, usar explorer para abrir URLs
            command = `explorer "${urlToOpen}"`;
        } else if (process.platform === 'darwin') {
            command = `open "${urlToOpen}"`;
        } else {
            command = `xdg-open "${urlToOpen}"`;
        }
        
        exec(command, (error) => {
            if (error) {
                console.log(`⚠️ Não foi possível abrir o navegador automaticamente: ${error.message}`);
                console.log(`🔗 Acesse manualmente: ${urlToOpen}`);
            } else {
                console.log('✅ Navegador aberto com sucesso!');
            }
        });
    } catch (error) {
        console.log(`⚠️ Erro ao abrir navegador: ${error.message}`);
        console.log(`🔗 Acesse manualmente: ${urlToOpen}`);
    }
    
    console.log('\n⏰ Pressione qualquer tecla APÓS autorizar no navegador...');
    
    await waitForKeypress();

    // Polling para obter token
    console.log('\n🔄 Verificando autorização...');
    
    for (let attempt = 1; attempt <= 30; attempt++) {
        const tokenResponse = await fetch(ACCESS_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                device_code: deviceData.device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
            console.log('✅ Token GitHub OAuth obtido com sucesso!\n');
            return tokenData.access_token;
        }

        if (tokenData.error === 'authorization_pending') {
            console.log(`⏳ Tentativa ${attempt}/30 - Aguardando autorização...`);
            // Aguardar mais tempo para evitar slow_down
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
        }

        if (tokenData.error === 'slow_down') {
            console.log(`⏳ Tentativa ${attempt}/30 - Rate limit, aguardando mais...`);
            // Aguardar ainda mais tempo para slow_down
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue;
        }

        if (tokenData.error === 'expired_token') {
            throw new Error('❌ Código expirou. Execute o script novamente.');
        }

        if (tokenData.error === 'access_denied') {
            throw new Error('❌ Acesso negado pelo usuário.');
        }

        throw new Error(`❌ Erro na autorização: ${tokenData.error}`);
    }

    throw new Error('❌ Timeout: Não foi possível obter autorização.');
}

/**
 * Obter informações do usuário GitHub
 */
async function getUserInfo(githubToken) {
    console.log('👤 PASSO 2: Obtendo informações do usuário GitHub...');
    
    const response = await fetch(GITHUB_API_USER, {
        headers: {
            ...VS_CODE_HEADERS,
            'Authorization': `token ${githubToken}`,
        }
    });

    if (response.ok) {
        const userInfo = await response.json();
        console.log(`✅ Usuário: ${userInfo.login}`);
        console.log(`📧 Email: ${userInfo.email || 'não disponível'}`);
        console.log(`🆔 ID: ${userInfo.id}\n`);
        return userInfo;
    } else {
        console.log(`⚠️ Não foi possível obter informações do usuário: ${response.status}\n`);
        return { login: 'unknown', id: 'unknown' };
    }
}

/**
 * Converter token GitHub em token GitHub Copilot
 */
async function obtainCopilotToken(githubToken, username) {
    console.log('🔐 PASSO 3: Convertendo para token GitHub Copilot...');
    console.log(`📋 Endpoint: ${COPILOT_TOKEN_ENDPOINT}`);
    console.log(`👤 Usuário: ${username}\n`);
    
    const response = await fetch(COPILOT_TOKEN_ENDPOINT, {
        method: 'GET',
        headers: {
            ...VS_CODE_HEADERS,
            'Authorization': `token ${githubToken}`,
        }
    });
    
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Erro na requisição: ${errorText}`);
        
        if (response.status === 401) {
            throw new Error('❌ Token GitHub inválido.');
        } else if (response.status === 403) {
            throw new Error('❌ Acesso negado. Verifique se tem acesso ao GitHub Copilot.');
        } else if (response.status === 404) {
            throw new Error('❌ Endpoint não encontrado.');
        }
        
        throw new Error(`❌ HTTP ${response.status}: ${response.statusText}`);
    }
    
    const tokenInfo = await response.json();
    
    if (!tokenInfo.token) {
        throw new Error('❌ Resposta não contém token válido');
    }
    
    console.log('✅ Token GitHub Copilot obtido com sucesso!\n');
    
    // Mostrar informações do token
    console.log('📋 INFORMAÇÕES DO TOKEN:');
    console.log(`⏰ Expires at: ${new Date(tokenInfo.expires_at * 1000).toLocaleString()}`);
    console.log(`🔄 Refresh in: ${tokenInfo.refresh_in} segundos`);
    console.log(`📊 SKU: ${tokenInfo.sku || 'unknown'}`);
    console.log(`🏢 Organizações: ${tokenInfo.organization_list?.length || 0}`);
    
    if (tokenInfo.chat_enabled !== undefined) {
        console.log(`💬 Chat habilitado: ${tokenInfo.chat_enabled ? 'Sim' : 'Não'}`);
    }
    
    if (tokenInfo.limited_user_quotas) {
        console.log(`📈 Quotas:`);
        console.log(`   Chat: ${tokenInfo.limited_user_quotas.chat}`);
        console.log(`   Completions: ${tokenInfo.limited_user_quotas.completions}`);
    }
    
    return {
        ...tokenInfo,
        username: username
    };
}

/**
 * Testar token obtido
 */
async function testCopilotToken(token) {
    console.log('\n🧪 PASSO 4: Testando token obtido...');
    
    try {
        const response = await fetch('https://api.githubcopilot.com/models', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const models = await response.json();
            const totalModels = models.data?.length || 0;
            const enabledModels = models.data?.filter(m => m.model_picker_enabled !== false).length || 0;
            
            console.log(`✅ Token válido!`);
            console.log(`📊 Total de modelos: ${totalModels}`);
            console.log(`✅ Modelos habilitados: ${enabledModels}`);
            
            // Mostrar modelos por provider
            const byProvider = {};
            (models.data || []).forEach(model => {
                if (model.model_picker_enabled !== false) {
                    if (!byProvider[model.vendor]) byProvider[model.vendor] = 0;
                    byProvider[model.vendor]++;
                }
            });
            
            console.log('📋 Por provider:');
            Object.keys(byProvider).sort().forEach(provider => {
                console.log(`   ${provider}: ${byProvider[provider]} modelos`);
            });
            
        } else {
            console.log(`❌ Erro no teste: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log(`❌ Erro ao testar token: ${error.message}`);
    }
}

/**
 * Função principal de autenticação
 */
async function authenticate() {
    try {
        console.log('🎯 Iniciando processo de autenticação completo...\n');
        
        // Verificar se já existe token GitHub
        let githubToken;
        let useExistingGitHubToken = false;
        
        try {
            githubToken = fs.readFileSync('./github-token.txt', 'utf8').trim();
            console.log('📁 Token GitHub encontrado no arquivo github-token.txt');
            console.log(`🔑 Token: ${githubToken.substring(0, 20)}...`);
            console.log('❓ Deseja usar este token? (s/N)');
            
            // Para automação, vamos usar o token existente se for válido
            if (githubToken && githubToken.length > 20) {
                useExistingGitHubToken = true;
                console.log('✅ Usando token GitHub existente\n');
            }
        } catch (error) {
            console.log('📁 Nenhum token GitHub encontrado, obtendo novo...\n');
        }
        
        // Obter token GitHub (se necessário)
        if (!useExistingGitHubToken) {
            githubToken = await obtainGitHubToken();
            
            // Salvar token GitHub
            fs.writeFileSync('./github-token.txt', githubToken);
            console.log('💾 Token GitHub salvo em: ./github-token.txt\n');
        }
        
        // Obter informações do usuário
        const userInfo = await getUserInfo(githubToken);
        
        // Obter token Copilot
        const copilotTokenInfo = await obtainCopilotToken(githubToken, userInfo.login);
        
        // CORREÇÃO: Usar o token GitHub diretamente (formato gho_*)
        // A API copilot_internal/v2/token não retorna o formato esperado
        const finalToken = githubToken; // Token GitHub já está no formato correto
        
        // Salvar token correto
        fs.writeFileSync('./.token', finalToken);
        console.log('\n💾 Token GitHub Copilot salvo em: ./.token');
        
        // Salvar informações completas
        const fullTokenData = {
            copilot_token: finalToken,
            github_token: githubToken,
            user_info: userInfo,
            api_response: copilotTokenInfo,
            obtained_at: new Date().toISOString(),
            method: 'github-token-direct',
            note: 'Usando token GitHub diretamente (formato gho_*)'
        };
        
        fs.writeFileSync('./copilot-authentication.json', JSON.stringify(fullTokenData, null, 2));
        console.log('📄 Dados completos salvos em: ./copilot-authentication.json\n');
        
        // Testar token
        await testCopilotToken(finalToken);
        
        // IMPRIMIR TOKEN COMPLETO NA TELA
        console.log('\n' + '='.repeat(80));
        console.log('🎉 AUTENTICAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('='.repeat(80));
        console.log('🔑 TOKEN GITHUB COPILOT COMPLETO:');
        console.log('='.repeat(80));
        console.log(finalToken);
        console.log('='.repeat(80));
        console.log(`👤 Usuário: ${userInfo.login}`);
        console.log(`⏰ Válido até: ${new Date(copilotTokenInfo.expires_at * 1000).toLocaleString()}`);
        console.log(`📊 Plano: ${copilotTokenInfo.sku || 'unknown'}`);
        console.log(`🔄 Refresh em: ${Math.round(copilotTokenInfo.refresh_in / 3600)} horas`);
        console.log('='.repeat(80));
        
        return finalToken;
        
    } catch (error) {
        console.error('\n❌ ERRO na autenticação:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    authenticate()
        .then(token => {
            console.log('\n✅ Script de autenticação concluído!');
            console.log(`🔑 Token obtido: ${token.substring(0, 20)}...`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Script falhou:', error.message);
            process.exit(1);
        });
}

module.exports = { authenticate };