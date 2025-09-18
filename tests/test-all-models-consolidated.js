const fs = require('fs');

console.log('🧪 GitHub Copilot Models Test - TODOS os Modelos');
console.log('=================================================\n');

async function testAllModelsConsolidated() {
    try {
        // Carregar token
        console.log('🔑 Carregando token...');
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('❌ Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        console.log(`✅ Token carregado: ${token.substring(0, 10)}...`);
        
        // Carregar TODOS os modelos
        console.log('\n📋 Carregando modelos do arquivo...');
        const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
        const allModels = modelsData.data;
        
        console.log(`✅ Total de modelos carregados: ${allModels.length}`);
        
        // Estatísticas por provider
        const byProvider = {};
        const byStatus = { enabled: 0, disabled: 0 };
        
        allModels.forEach(model => {
            if (!byProvider[model.vendor]) {
                byProvider[model.vendor] = { total: 0, enabled: 0, disabled: 0 };
            }
            byProvider[model.vendor].total++;
            
            if (model.model_picker_enabled !== false) {
                byProvider[model.vendor].enabled++;
                byStatus.enabled++;
            } else {
                byProvider[model.vendor].disabled++;
                byStatus.disabled++;
            }
        });
        
        console.log(`📊 Modelos habilitados: ${byStatus.enabled}`);
        console.log(`📊 Modelos desabilitados: ${byStatus.disabled}`);
        
        console.log('\n🎯 TODOS os modelos por Provider:');
        Object.keys(byProvider).sort().forEach(provider => {
            const stats = byProvider[provider];
            console.log(`  ${provider}: ${stats.total} total (${stats.enabled} hab. / ${stats.disabled} desab.)`);
        });
        
        // ENDPOINT ÚNICO - o que sabemos que funciona
        const endpoint = 'https://api.githubcopilot.com/chat/completions';
        
        console.log(`\n🧪 Testando TODOS os ${allModels.length} modelos no endpoint:`);
        console.log(`📋 ${endpoint}`);
        console.log('=' .repeat(70));
        
        const results = {
            success: [],
            failed: [],
            errors: {},
            summary: {
                total: allModels.length,
                successful: 0,
                failed: 0,
                by_provider: {},
                by_status: { enabled_success: 0, disabled_success: 0, enabled_failed: 0, disabled_failed: 0 }
            }
        };
        
        // Testar cada modelo
        for (let i = 0; i < allModels.length; i++) {
            const model = allModels[i];
            const progress = `[${i + 1}/${allModels.length}]`;
            const isEnabled = model.model_picker_enabled !== false;
            const statusIcon = isEnabled ? '✅' : '❌';
            
            console.log(`\n🔄 ${progress} ${statusIcon} ${model.name} (${model.vendor})`);
            console.log(`   📋 Model ID: ${model.id}`);
            console.log(`   🏷️ Status: ${isEnabled ? 'Habilitado' : 'Desabilitado'}`);
            
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
                    
                    const result = {
                        model: model.id,
                        name: model.name,
                        vendor: model.vendor,
                        enabled: isEnabled,
                        response: responseText,
                        usage: data.usage
                    };
                    
                    results.success.push(result);
                    results.summary.successful++;
                    
                    // Estatísticas por provider
                    if (!results.summary.by_provider[model.vendor]) {
                        results.summary.by_provider[model.vendor] = { success: 0, failed: 0 };
                    }
                    results.summary.by_provider[model.vendor].success++;
                    
                    // Estatísticas por status
                    if (isEnabled) {
                        results.summary.by_status.enabled_success++;
                    } else {
                        results.summary.by_status.disabled_success++;
                    }
                    
                } else {
                    let errorText = '';
                    try {
                        errorText = await response.text();
                    } catch (e) {
                        errorText = 'Erro ao ler resposta';
                    }
                    
                    console.log(`   ❌ ERRO ${response.status} - ${response.statusText}`);
                    
                    if (errorText && errorText.length < 300) {
                        console.log(`   📄 Detalhes: ${errorText}`);
                    }
                    
                    const result = {
                        model: model.id,
                        name: model.name,
                        vendor: model.vendor,
                        enabled: isEnabled,
                        status: response.status,
                        error: response.statusText,
                        details: errorText.substring(0, 200)
                    };
                    
                    results.failed.push(result);
                    results.summary.failed++;
                    
                    // Estatísticas por provider
                    if (!results.summary.by_provider[model.vendor]) {
                        results.summary.by_provider[model.vendor] = { success: 0, failed: 0 };
                    }
                    results.summary.by_provider[model.vendor].failed++;
                    
                    // Estatísticas por status
                    if (isEnabled) {
                        results.summary.by_status.enabled_failed++;
                    } else {
                        results.summary.by_status.disabled_failed++;
                    }
                    
                    // Agrupar por status de erro
                    if (!results.errors[response.status]) {
                        results.errors[response.status] = [];
                    }
                    results.errors[response.status].push(model.vendor);
                }
                
            } catch (error) {
                console.log(`   ❌ ERRO DE REDE: ${error.message}`);
                
                const result = {
                    model: model.id,
                    name: model.name,
                    vendor: model.vendor,
                    enabled: isEnabled,
                    status: 'network_error',
                    error: error.message
                };
                
                results.failed.push(result);
                results.summary.failed++;
                
                if (isEnabled) {
                    results.summary.by_status.enabled_failed++;
                } else {
                    results.summary.by_status.disabled_failed++;
                }
            }
            
            // Pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Relatório final detalhado
        console.log('\n' + '='.repeat(70));
        console.log('📊 RELATÓRIO FINAL CONSOLIDADO');
        console.log('='.repeat(70));
        console.log(`📋 Total testado: ${results.summary.total} modelos`);
        console.log(`✅ Sucessos: ${results.summary.successful} (${Math.round((results.summary.successful / results.summary.total) * 100)}%)`);
        console.log(`❌ Falhas: ${results.summary.failed} (${Math.round((results.summary.failed / results.summary.total) * 100)}%)`);
        
        // Estatísticas por status de habilitação
        console.log('\n📊 ANÁLISE POR STATUS:');
        console.log(`✅ Habilitados: ${results.summary.by_status.enabled_success} sucessos / ${results.summary.by_status.enabled_failed} falhas`);
        console.log(`❌ Desabilitados: ${results.summary.by_status.disabled_success} sucessos / ${results.summary.by_status.disabled_failed} falhas`);
        
        // Estatísticas por provider
        console.log('\n🏢 ANÁLISE POR PROVIDER:');
        Object.keys(results.summary.by_provider).sort().forEach(provider => {
            const stats = results.summary.by_provider[provider];
            const total = stats.success + stats.failed;
            const percentage = Math.round((stats.success / total) * 100);
            console.log(`  ${provider}: ${stats.success}/${total} (${percentage}%) - ${stats.success} ✅ / ${stats.failed} ❌`);
        });
        
        // Modelos funcionais
        if (results.success.length > 0) {
            console.log('\n🎉 MODELOS FUNCIONAIS:');
            const successByProvider = {};
            results.success.forEach(model => {
                if (!successByProvider[model.vendor]) successByProvider[model.vendor] = [];
                successByProvider[model.vendor].push(model);
            });
            
            Object.keys(successByProvider).sort().forEach(provider => {
                console.log(`\n  ${provider}:`);
                successByProvider[provider].forEach(model => {
                    const status = model.enabled ? '✅' : '❌';
                    console.log(`    ${status} ${model.model} - ${model.name}`);
                });
            });
        }
        
        // Análise de erros
        if (Object.keys(results.errors).length > 0) {
            console.log('\n⚠️ ANÁLISE DE ERROS:');
            Object.keys(results.errors).forEach(status => {
                const providers = [...new Set(results.errors[status])];
                console.log(`   ${status}: ${providers.join(', ')}`);
            });
        }
        
        // Salvar resultados
        const reportData = {
            timestamp: new Date().toISOString(),
            endpoint: endpoint,
            token_prefix: token.substring(0, 10) + '...',
            summary: results.summary,
            success: results.success,
            failed: results.failed,
            errors: results.errors
        };
        
        fs.writeFileSync('./tests/test-results-consolidated.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Relatório completo salvo em: ./tests/test-results-consolidated.json');
        
        // Recomendações finais
        console.log('\n💡 RECOMENDAÇÕES:');
        if (results.summary.by_status.enabled_success > 0) {
            console.log(`✅ Use modelos HABILITADOS: ${results.summary.by_status.enabled_success} funcionais`);
        }
        if (results.summary.by_status.disabled_success > 0) {
            console.log(`⚠️ Modelos DESABILITADOS funcionais: ${results.summary.by_status.disabled_success} (podem ter limitações)`);
        }
        
        // Provider mais confiável
        const bestProvider = Object.keys(results.summary.by_provider)
            .sort((a, b) => {
                const aSuccess = results.summary.by_provider[a].success;
                const bSuccess = results.summary.by_provider[b].success;
                return bSuccess - aSuccess;
            })[0];
        
        if (bestProvider && results.summary.by_provider[bestProvider].success > 0) {
            console.log(`🏆 Provider mais confiável: ${bestProvider} (${results.summary.by_provider[bestProvider].success} sucessos)`);
        }
        
        return reportData;
        
    } catch (error) {
        console.error('\n❌ ERRO no teste consolidado:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testAllModelsConsolidated()
        .then(() => {
            console.log('\n✅ Teste consolidado concluído com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Teste consolidado falhou:', error);
            process.exit(1);
        });
}

module.exports = { testAllModelsConsolidated };