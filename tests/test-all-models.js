const fs = require('fs');

console.log('🧪 GitHub Copilot Models Test Suite');
console.log('=====================================\n');

async function testAllModels() {
    try {
        // Carregar token do arquivo (MÉTODO CORRETO)
        console.log('🔑 Carregando token...');
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        // Validação de formato do token
        if (!token.startsWith('gho_')) {
            throw new Error('❌ Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        console.log(`✅ Token carregado: ${token.substring(0, 10)}...`);
        
        // Carregar modelos do arquivo (MÉTODO CORRETO)
        console.log('\n📋 Carregando modelos do arquivo...');
        const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
        const allModels = modelsData.data;
        
        console.log(`✅ Total de modelos carregados: ${allModels.length}`);
        
        // Filtrar apenas modelos habilitados
        const enabledModels = allModels.filter(model => 
            model.model_picker_enabled !== false
        );
        
        console.log(`📊 Modelos habilitados para teste: ${enabledModels.length}`);
        console.log(`📊 Modelos desabilitados (ignorados): ${allModels.length - enabledModels.length}`);
        
        // Mostrar detalhes por provider ANTES do teste
        const byProvider = {};
        enabledModels.forEach(model => {
            if (!byProvider[model.vendor]) {
                byProvider[model.vendor] = [];
            }
            byProvider[model.vendor].push(model);
        });
        
        console.log('\n🎯 Modelos que serão testados por Provider:');
        Object.keys(byProvider).sort().forEach(provider => {
            console.log(`  ${provider}: ${byProvider[provider].length} modelos`);
            byProvider[provider].forEach(model => {
                console.log(`    - ${model.id} (${model.name})`);
            });
        });
        
        // Teste de acesso à API de modelos
        console.log('\n🌐 Testando acesso à API de modelos...');
        const modelsResponse = await fetch('https://api.githubcopilot.com/models', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (modelsResponse.ok) {
            const apiModels = await modelsResponse.json();
            console.log(`✅ API acessível: ${apiModels.data.length} modelos retornados`);
        } else {
            console.log(`❌ Erro na API de modelos: ${modelsResponse.status}`);
            return;
        }
        
        // Testar cada modelo individualmente
        console.log('\n🧪 Testando modelos individuais...\n');
        
        const results = {
            success: [],
            failed: [],
            errors: {}
        };
        
        // TESTE LIMITADO - apenas modelos específicos para economizar recursos
        const testModels = enabledModels.filter(model => 
            model.id === 'gpt-4.1' || model.id === 'claude-3.5-sonnet'
        );
        
        console.log(`🎯 Testando apenas ${testModels.length} modelos específicos:\n`);
        testModels.forEach(model => {
            console.log(`   - ${model.id} (${model.name})`);
        });
        console.log('');
        
        for (let i = 0; i < testModels.length; i++) {
            const model = testModels[i];
            const modelName = `${model.name} (${model.vendor})`;
            const progress = `[${i + 1}/${testModels.length}]`;
            
            console.log(`🔄 ${progress} Testando: ${modelName}`);
            
            try {
                const endpoints = [
                    'https://api.githubcopilot.com/chat/completions',
                    'https://copilot-proxy.githubusercontent.com/v1/chat/completions',
                    'https://api.github.com/copilot/chat/completions',
                    'https://copilot-proxy.githubusercontent.com/chat/completions',
                    'https://api.githubcopilot.com/v1/engines/chat/completions',
                    'https://copilot.github.com/v1/chat/completions'
                ];

                let response;
                let usedEndpoint = '';

                // Testa cada endpoint até encontrar um que funcione
                for (const endpoint of endpoints) {
                    console.log(`   🔄 Testando endpoint: ${endpoint.replace('https://', '')}`);
                    
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model.id,
                            messages: [{ 
                                role: 'user', 
                                content: 'Test message. Please respond with just "OK".' 
                            }],
                            max_tokens: 5,
                            temperature: 0
                        })
                    });

                    if (response.ok) {
                        usedEndpoint = endpoint;
                        console.log(`   ✅ ENDPOINT FUNCIONOU: ${endpoint.replace('https://', '')}`);
                        break;
                    } else if (response.status !== 403 && response.status !== 404) {
                        // Se não for 403/404, pode ser outro erro interessante
                        const errorText = await response.text();
                        console.log(`   ⚠️ Endpoint ${endpoint.replace('https://', '')} - Status: ${response.status} - ${errorText.substring(0, 100)}`);
                    }
                }
                
                if (response.ok) {
                    const result = await response.json();
                    const reply = result.choices?.[0]?.message?.content?.trim() || 'No response';
                    console.log(`   ✅ SUCESSO com ${usedEndpoint.replace('https://', '')} - Resposta: "${reply}"`);
                    results.success.push({
                        model: model.id,
                        name: modelName,
                        endpoint: usedEndpoint,
                        response: reply
                    });
                } else {
                    const errorText = await response.text();
                    console.log(`   ❌ ERRO ${response.status} - ${response.statusText}`);
                    
                    // Verificar headers de restrição
                    const restrictionHeaders = [];
                    for (const [key, value] of response.headers.entries()) {
                        if (key.includes('forbidden') || key.includes('restriction')) {
                            restrictionHeaders.push(`${key}: ${value}`);
                        }
                    }
                    
                    if (restrictionHeaders.length > 0) {
                        console.log(`   📋 Restrições: ${restrictionHeaders.join(', ')}`);
                    }
                    
                    // Mostrar parte do erro se for útil
                    if (errorText && errorText.length > 0 && errorText.length < 200) {
                        console.log(`   📄 Detalhes: ${errorText}`);
                    }
                    
                    results.failed.push({
                        model: model.id,
                        name: modelName,
                        status: response.status,
                        error: response.statusText,
                        restrictions: restrictionHeaders,
                        errorDetails: errorText.substring(0, 200)
                    });
                    
                    if (!results.errors[response.status]) {
                        results.errors[response.status] = [];
                    }
                    results.errors[response.status].push(model.vendor);
                }
                
            } catch (error) {
                console.log(`   ❌ ERRO DE REDE - ${error.message}`);
                results.failed.push({
                    model: model.id,
                    name: modelName,
                    status: 'NETWORK_ERROR',
                    error: error.message
                });
            }
            
            // Pausa menor entre testes para acelerar
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Relatório final
        console.log('\n📊 RELATÓRIO FINAL');
        console.log('==================');
        console.log(`✅ Modelos funcionais: ${results.success.length}`);
        console.log(`❌ Modelos com erro: ${results.failed.length}`);
        
        if (results.success.length > 0) {
            console.log('\n🎉 Modelos funcionais:');
            results.success.forEach(item => {
                console.log(`   ✅ ${item.name}`);
            });
        }
        
        if (results.failed.length > 0) {
            console.log('\n⚠️ Modelos com problemas:');
            results.failed.forEach(item => {
                console.log(`   ❌ ${item.name} - Status: ${item.status}`);
            });
        }
        
        // Análise por tipo de erro
        if (Object.keys(results.errors).length > 0) {
            console.log('\n📋 Análise de erros:');
            Object.keys(results.errors).forEach(status => {
                const providers = [...new Set(results.errors[status])];
                console.log(`   ${status}: ${providers.join(', ')}`);
            });
        }
        
        // Recomendações
        console.log('\n💡 RECOMENDAÇÕES:');
        if (results.success.some(r => r.name.includes('Azure OpenAI'))) {
            console.log('✅ Use modelos Azure OpenAI para máxima compatibilidade');
        }
        if (results.failed.some(r => r.status === 403)) {
            console.log('⚠️ Erros 403: Verificar subscription para Anthropic/Google');
        }
        if (results.failed.some(r => r.status === 401)) {
            console.log('⚠️ Erros 401: Verificar token GitHub Copilot');
        }
        
        // Salvar relatório em arquivo
        const reportData = {
            timestamp: new Date().toISOString(),
            totalModels: allModels.length,
            enabledModels: enabledModels.length,
            testedModels: testModels.length,
            results: results,
            byProvider: Object.keys(byProvider).map(provider => ({
                provider,
                totalModels: byProvider[provider].length,
                successCount: results.success.filter(r => r.name.includes(provider)).length,
                failedCount: results.failed.filter(r => r.name.includes(provider)).length
            }))
        };
        
        fs.writeFileSync('./tests/test-results.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Relatório salvo em: ./tests/test-results.json');
        
    } catch (error) {
        console.error('\n❌ ERRO PRINCIPAL:', error.message);
        process.exit(1);
    }
}

// Executar teste
testAllModels();