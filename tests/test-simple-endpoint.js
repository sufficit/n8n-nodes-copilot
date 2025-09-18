const fs = require('fs');

console.log('🧪 GitHub Copilot Models Test - Endpoint Único');
console.log('===============================================\n');

async function testAllModelsSimple() {
    try {
        // Carregar token
        console.log('🔑 Carregando token...');
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('❌ Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        console.log(`✅ Token carregado: ${token.substring(0, 10)}...`);
        
        // Carregar modelos
        console.log('\n📋 Carregando modelos do arquivo...');
        const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
        const enabledModels = modelsData.data.filter(model => 
            model.model_picker_enabled !== false
        );
        
        console.log(`✅ Total de modelos carregados: ${modelsData.data.length}`);
        console.log(`📊 Modelos habilitados para teste: ${enabledModels.length}`);
        
        // Estatísticas por provider
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
        
        // ENDPOINT ÚNICO - o que sabemos que funciona
        const endpoint = 'https://api.githubcopilot.com/chat/completions';
        
        console.log(`\n🧪 Testando todos os modelos no endpoint: ${endpoint}`);
        console.log('=' .repeat(60));
        
        const results = {
            success: [],
            failed: [],
            errors: {}
        };
        
        // Testar cada modelo
        for (let i = 0; i < enabledModels.length; i++) {
            const model = enabledModels[i];
            const progress = `[${i + 1}/${enabledModels.length}]`;
            
            console.log(`\n🔄 ${progress} Testando: ${model.name} (${model.vendor})`);
            console.log(`   📋 Model ID: ${model.id}`);
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model.id,
                        messages: [{ 
                            role: 'user', 
                            content: 'Test message. Please respond with just "OK".' 
                        }],
                        max_tokens: 10,
                        temperature: 0
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const responseText = data.choices?.[0]?.message?.content?.trim() || 'No response';
                    console.log(`   ✅ SUCESSO - Resposta: "${responseText}"`);
                    
                    results.success.push({
                        model: model.id,
                        name: model.name,
                        vendor: model.vendor,
                        response: responseText,
                        usage: data.usage
                    });
                } else {
                    let errorText = '';
                    try {
                        errorText = await response.text();
                    } catch (e) {
                        errorText = 'Erro ao ler resposta';
                    }
                    
                    console.log(`   ❌ ERRO ${response.status} - ${response.statusText}`);
                    
                    // Mostrar detalhes do erro se for útil
                    if (errorText && errorText.length < 300) {
                        console.log(`   📄 Detalhes: ${errorText}`);
                    }
                    
                    results.failed.push({
                        model: model.id,
                        name: model.name,
                        vendor: model.vendor,
                        status: response.status,
                        error: response.statusText,
                        details: errorText.substring(0, 200)
                    });
                    
                    // Agrupar por status
                    if (!results.errors[response.status]) {
                        results.errors[response.status] = [];
                    }
                    results.errors[response.status].push(model.vendor);
                }
                
            } catch (error) {
                console.log(`   ❌ ERRO DE REDE: ${error.message}`);
                results.failed.push({
                    model: model.id,
                    name: model.name,
                    vendor: model.vendor,
                    status: 'network_error',
                    error: error.message
                });
            }
            
            // Pequena pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL');
        console.log('='.repeat(60));
        console.log(`✅ Modelos funcionais: ${results.success.length}`);
        console.log(`❌ Modelos com erro: ${results.failed.length}`);
        
        if (results.success.length > 0) {
            console.log('\n🎉 Modelos funcionais:');
            results.success.forEach(model => {
                console.log(`   ✅ ${model.name} (${model.vendor})`);
            });
        }
        
        if (results.failed.length > 0) {
            console.log('\n⚠️ Modelos com problemas:');
            results.failed.forEach(model => {
                console.log(`   ❌ ${model.name} (${model.vendor}) - Status: ${model.status}`);
            });
            
            // Análise de erros
            console.log('\n📋 Análise de erros:');
            Object.keys(results.errors).forEach(status => {
                const providers = [...new Set(results.errors[status])];
                console.log(`   ${status}: ${providers.join(', ')}`);
            });
        }
        
        // Salvar resultados
        const reportData = {
            timestamp: new Date().toISOString(),
            endpoint: endpoint,
            total_tested: enabledModels.length,
            successful: results.success.length,
            failed: results.failed.length,
            success_rate: Math.round((results.success.length / enabledModels.length) * 100),
            results: results
        };
        
        fs.writeFileSync('./tests/test-results-simple.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Relatório salvo em: ./tests/test-results-simple.json');
        
        // Recomendações
        if (results.success.length > 0) {
            console.log('\n💡 MODELOS RECOMENDADOS:');
            const byVendor = {};
            results.success.forEach(model => {
                if (!byVendor[model.vendor]) byVendor[model.vendor] = [];
                byVendor[model.vendor].push(model);
            });
            
            Object.keys(byVendor).forEach(vendor => {
                console.log(`✅ ${vendor}: ${byVendor[vendor].length} modelos funcionais`);
                byVendor[vendor].forEach(model => {
                    console.log(`   • ${model.model} - ${model.name}`);
                });
            });
        }
        
        return reportData;
        
    } catch (error) {
        console.error('\n❌ ERRO no teste:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testAllModelsSimple()
        .then(() => {
            console.log('\n✅ Teste concluído com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Teste falhou:', error);
            process.exit(1);
        });
}

module.exports = { testAllModelsSimple };