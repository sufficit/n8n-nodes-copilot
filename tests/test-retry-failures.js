const fs = require('fs');

console.log('🔍 Análise de Falhas - Teste de Retry');
console.log('=====================================\n');

async function analyzeFailures() {
    try {
        // Carregar token
        console.log('🔑 Carregando token...');
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('❌ Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        console.log(`✅ Token carregado: ${token.substring(0, 10)}...`);
        
        // Carregar resultados do teste anterior
        console.log('\n📋 Carregando resultados do teste anterior...');
        let previousResults;
        try {
            previousResults = JSON.parse(fs.readFileSync('./tests/test-results-consolidated.json', 'utf8'));
        } catch (error) {
            console.log('❌ Não foi possível carregar resultados anteriores. Execute primeiro o teste consolidado.');
            return;
        }
        
        const failedModels = previousResults.failed.filter(model => 
            model.status !== 'network_error' && 
            !model.error.includes('Model is not supported') &&
            !model.error.includes('model_not_supported') &&
            !model.error.includes('The requested model is not supported') &&
            !(model.status === 400 && model.details && model.details.includes('not supported'))
        );
        
        console.log(`✅ Modelos que falharam (excluindo não suportados): ${failedModels.length}`);
        
        if (failedModels.length === 0) {
            console.log('🎉 Nenhum modelo para re-testar (apenas erros de modelo não suportado)');
            return;
        }
        
        // Endpoint
        const endpoint = 'https://api.githubcopilot.com/chat/completions';
        const RETRY_COUNT = 3; // Número de tentativas
        const DELAY_BETWEEN_RETRIES = 1000; // 1 segundo entre tentativas
        
        console.log(`\n🧪 Re-testando ${failedModels.length} modelos com ${RETRY_COUNT} tentativas cada:`);
        console.log(`📋 Endpoint: ${endpoint}`);
        console.log('=' .repeat(70));
        
        const retryResults = {
            models: [],
            summary: {
                consistent_failures: 0,  // Sempre falha
                consistent_success: 0,   // Sempre funciona após retry
                intermittent: 0,         // Falha às vezes
                error_patterns: {}
            }
        };
        
        // Testar cada modelo que falhou
        for (let i = 0; i < failedModels.length; i++) {
            const model = failedModels[i];
            const progress = `[${i + 1}/${failedModels.length}]`;
            const isEnabled = model.enabled;
            const statusIcon = isEnabled ? '✅' : '❌';
            
            console.log(`\n🔄 ${progress} ${statusIcon} ${model.name} (${model.vendor})`);
            console.log(`   📋 Model ID: ${model.model}`);
            console.log(`   🏷️ Status: ${isEnabled ? 'Habilitado' : 'Desabilitado'}`);
            console.log(`   ⚠️ Erro anterior: ${model.status} - ${model.error}`);
            
            const modelResult = {
                model: model.model,
                name: model.name,
                vendor: model.vendor,
                enabled: isEnabled,
                previous_error: `${model.status} - ${model.error}`,
                attempts: [],
                pattern: '',
                success_count: 0,
                failure_count: 0
            };
            
            // Fazer múltiplas tentativas
            for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
                console.log(`   🔄 Tentativa ${attempt}/${RETRY_COUNT}...`);
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model.model,
                            messages: [{ 
                                role: 'user', 
                                content: `Test attempt ${attempt}. Please respond with just "OK ${attempt}".` 
                            }],
                            max_tokens: 10,
                            temperature: 0
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const responseText = data.choices?.[0]?.message?.content?.trim() || 'No response';
                        console.log(`      ✅ SUCESSO - Resposta: "${responseText}"`);
                        
                        // 🔍 CAPTURAR HEADERS DAS REQUISIÇÕES DE SUCESSO
                        const successHeaders = {};
                        response.headers.forEach((value, key) => {
                            successHeaders[key.toLowerCase()] = value;
                        });
                        
                        console.log(`      🔍 TODOS OS HEADERS (SUCESSO):`);
                        const allSuccessHeadersList = [];
                        response.headers.forEach((value, key) => {
                            allSuccessHeadersList.push(`${key}: ${value}`);
                        });
                        allSuccessHeadersList.sort().forEach(header => {
                            console.log(`         ${header}`);
                        });
                        
                        modelResult.attempts.push({
                            attempt: attempt,
                            success: true,
                            response: responseText,
                            usage: data.usage,
                            headers: successHeaders
                        });
                        modelResult.success_count++;
                        
                    } else {
                        let errorText = '';
                        let errorJson = null;
                        try {
                            errorText = await response.text();
                            errorJson = JSON.parse(errorText);
                        } catch (e) {
                            // Manter errorText como string se não for JSON
                        }
                        
                        // 🔍 CAPTURAR HEADERS - ANÁLISE DETALHADA
                        const headers = {};
                        response.headers.forEach((value, key) => {
                            headers[key.toLowerCase()] = value;
                        });
                        
                        const errorKey = `${response.status}-${response.statusText}`;
                        console.log(`      ❌ ERRO ${response.status} - ${response.statusText}`);
                        
                        // � PARA ERRO 403: MOSTRAR TODOS OS HEADERS
                        if (response.status === 403) {
                            console.log(`      🔍 TODOS OS HEADERS (403):`);
                            const allHeadersList = [];
                            response.headers.forEach((value, key) => {
                                allHeadersList.push(`${key}: ${value}`);
                            });
                            allHeadersList.sort().forEach(header => {
                                console.log(`         ${header}`);
                            });
                        }
                        
                        // �📋 ANALISAR HEADERS RELEVANTES (para outros erros)
                        const relevantHeaders = [
                            'x-ratelimit-limit',
                            'x-ratelimit-remaining', 
                            'x-ratelimit-reset',
                            'x-ratelimit-retry-after',
                            'retry-after',
                            'x-github-request-id',
                            'x-github-media-type',
                            'x-accepted-oauth-scopes',
                            'x-oauth-scopes',
                            'x-copilot-quota-remaining',
                            'x-copilot-quota-limit',
                            'x-ms-ratelimit-remaining',
                            'x-ms-retry-after-ms',
                            'cf-ray',
                            'server'
                        ];
                        
                        const foundHeaders = {};
                        relevantHeaders.forEach(header => {
                            if (headers[header]) {
                                foundHeaders[header] = headers[header];
                            }
                        });
                        
                        if (Object.keys(foundHeaders).length > 0 && response.status !== 403) {
                            console.log(`      🔍 HEADERS RELEVANTES:`);
                            Object.keys(foundHeaders).forEach(key => {
                                console.log(`         ${key}: ${foundHeaders[key]}`);
                            });
                        }
                        
                        // Mostrar detalhes do erro
                        if (errorJson && errorJson.error) {
                            console.log(`      📄 Erro API: ${errorJson.error.message || errorJson.error.code || 'Desconhecido'}`);
                        } else if (errorText && errorText.length < 200) {
                            console.log(`      📄 Detalhes: ${errorText}`);
                        }
                        
                        modelResult.attempts.push({
                            attempt: attempt,
                            success: false,
                            status: response.status,
                            error: response.statusText,
                            details: errorText.substring(0, 300),
                            error_json: errorJson,
                            headers: foundHeaders,
                            all_headers: headers
                        });
                        modelResult.failure_count++;
                        
                        // Contar padrões de erro
                        if (!retryResults.summary.error_patterns[errorKey]) {
                            retryResults.summary.error_patterns[errorKey] = {
                                count: 0,
                                models: [],
                                sample_details: errorText.substring(0, 200),
                                headers_found: foundHeaders,
                                rate_limit_indicators: []
                            };
                        }
                        retryResults.summary.error_patterns[errorKey].count++;
                        if (!retryResults.summary.error_patterns[errorKey].models.includes(model.vendor)) {
                            retryResults.summary.error_patterns[errorKey].models.push(model.vendor);
                        }
                        
                        // 🔍 DETECTAR INDICADORES DE RATE LIMITING
                        const rateLimitIndicators = [];
                        if (foundHeaders['x-ratelimit-remaining'] === '0') {
                            rateLimitIndicators.push('Rate limit esgotado');
                        }
                        if (foundHeaders['retry-after']) {
                            rateLimitIndicators.push(`Retry after: ${foundHeaders['retry-after']}s`);
                        }
                        if (foundHeaders['x-ratelimit-reset']) {
                            const resetTime = new Date(parseInt(foundHeaders['x-ratelimit-reset']) * 1000);
                            rateLimitIndicators.push(`Reset em: ${resetTime.toLocaleTimeString()}`);
                        }
                        if (errorText.toLowerCase().includes('rate limit')) {
                            rateLimitIndicators.push('Menção explícita de rate limit no corpo');
                        }
                        if (errorText.toLowerCase().includes('quota')) {
                            rateLimitIndicators.push('Menção de quota no corpo');
                        }
                        
                        if (rateLimitIndicators.length > 0) {
                            console.log(`      🚨 RATE LIMIT DETECTADO: ${rateLimitIndicators.join(', ')}`);
                            retryResults.summary.error_patterns[errorKey].rate_limit_indicators = 
                                [...new Set([...retryResults.summary.error_patterns[errorKey].rate_limit_indicators, ...rateLimitIndicators])];
                        }
                    }
                    
                } catch (error) {
                    console.log(`      ❌ ERRO DE REDE: ${error.message}`);
                    
                    modelResult.attempts.push({
                        attempt: attempt,
                        success: false,
                        status: 'network_error',
                        error: error.message
                    });
                    modelResult.failure_count++;
                }
                
                // Pausa entre tentativas (exceto na última)
                if (attempt < RETRY_COUNT) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_RETRIES));
                }
            }
            
            // Analisar padrão do modelo
            if (modelResult.success_count === 0) {
                modelResult.pattern = 'FALHA_CONSISTENTE';
                retryResults.summary.consistent_failures++;
                console.log(`   📊 PADRÃO: Falha consistente (0/${RETRY_COUNT} sucessos)`);
            } else if (modelResult.failure_count === 0) {
                modelResult.pattern = 'SUCESSO_CONSISTENTE';
                retryResults.summary.consistent_success++;
                console.log(`   📊 PADRÃO: Sucesso após retry (${RETRY_COUNT}/${RETRY_COUNT} sucessos)`);
            } else {
                modelResult.pattern = 'INTERMITENTE';
                retryResults.summary.intermittent++;
                console.log(`   📊 PADRÃO: Intermitente (${modelResult.success_count}/${RETRY_COUNT} sucessos)`);
            }
            
            retryResults.models.push(modelResult);
            
            // Pausa entre modelos
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Relatório de análise
        console.log('\n' + '='.repeat(70));
        console.log('📊 ANÁLISE DE PADRÕES DE FALHA');
        console.log('='.repeat(70));
        
        console.log(`📋 Total de modelos re-testados: ${failedModels.length}`);
        console.log(`❌ Falhas consistentes: ${retryResults.summary.consistent_failures} (sempre falham)`);
        console.log(`✅ Sucessos após retry: ${retryResults.summary.consistent_success} (funcionam com retry)`);
        console.log(`⚠️ Comportamento intermitente: ${retryResults.summary.intermittent} (falham às vezes)`);
        
        // Análise de padrões de erro
        console.log('\n🔍 PADRÕES DE ERRO IDENTIFICADOS:');
        const errorPatterns = Object.keys(retryResults.summary.error_patterns);
        
        if (errorPatterns.length === 0) {
            console.log('✅ Nenhum padrão de erro encontrado (todos os retries funcionaram)');
        } else {
            errorPatterns.forEach(pattern => {
                const info = retryResults.summary.error_patterns[pattern];
                console.log(`\n  ❌ ${pattern}:`);
                console.log(`     📊 Ocorrências: ${info.count}`);
                console.log(`     🏢 Providers: ${info.models.join(', ')}`);
                if (info.sample_details) {
                    console.log(`     📄 Exemplo: ${info.sample_details}`);
                }
                
                // 🔍 MOSTRAR HEADERS ENCONTRADOS
                if (info.headers_found && Object.keys(info.headers_found).length > 0) {
                    console.log(`     🔍 Headers encontrados:`);
                    Object.keys(info.headers_found).forEach(header => {
                        console.log(`        ${header}: ${info.headers_found[header]}`);
                    });
                }
                
                // 🚨 MOSTRAR INDICADORES DE RATE LIMITING
                if (info.rate_limit_indicators && info.rate_limit_indicators.length > 0) {
                    console.log(`     🚨 Indicadores de Rate Limit:`);
                    info.rate_limit_indicators.forEach(indicator => {
                        console.log(`        - ${indicator}`);
                    });
                }
            });
        }
        
        // Modelos que ficaram funcionando após retry
        const nowWorking = retryResults.models.filter(m => m.success_count > 0);
        if (nowWorking.length > 0) {
            console.log('\n🎉 MODELOS QUE FUNCIONARAM COM RETRY:');
            nowWorking.forEach(model => {
                const ratio = `${model.success_count}/${RETRY_COUNT}`;
                const reliability = Math.round((model.success_count / RETRY_COUNT) * 100);
                console.log(`  ✅ ${model.model} (${model.vendor}) - ${ratio} (${reliability}% confiável)`);
            });
        }
        
        // Modelos com falha persistente
        const stillFailing = retryResults.models.filter(m => m.success_count === 0);
        if (stillFailing.length > 0) {
            console.log('\n❌ MODELOS COM FALHA PERSISTENTE:');
            stillFailing.forEach(model => {
                console.log(`  ❌ ${model.model} (${model.vendor}) - ${model.previous_error}`);
            });
        }
        
        // Conclusões sobre rate limiting
        console.log('\n💡 ANÁLISE DE RATE LIMITING:');
        
        const hasRateLimit = errorPatterns.some(pattern => 
            pattern.includes('429') || 
            retryResults.summary.error_patterns[pattern].sample_details.toLowerCase().includes('rate limit')
        );
        
        const hasForbidden = errorPatterns.some(pattern => pattern.includes('403'));
        
        const hasIntermittent = retryResults.summary.intermittent > 0;
        
        if (hasRateLimit) {
            console.log('⚠️ DETECTADO: Rate limiting (erro 429 ou menção explícita)');
        }
        
        if (hasForbidden) {
            console.log('🔒 DETECTADO: Problemas de permissão (erro 403) - pode ser subscription/billing');
        }
        
        if (hasIntermittent) {
            console.log('🎲 DETECTADO: Comportamento intermitente - possível rate limiting soft ou load balancing');
        }
        
        if (!hasRateLimit && !hasIntermittent && retryResults.summary.consistent_failures > 0) {
            console.log('✅ NÃO DETECTADO: Rate limiting - falhas parecem ser de configuração/permissão');
        }
        
        // Salvar resultados
        const reportData = {
            timestamp: new Date().toISOString(),
            endpoint: endpoint,
            token_prefix: token.substring(0, 10) + '...',
            retry_count: RETRY_COUNT,
            models_tested: failedModels.length,
            summary: retryResults.summary,
            models: retryResults.models
        };
        
        fs.writeFileSync('./tests/retry-analysis-results.json', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Análise completa salva em: ./tests/retry-analysis-results.json');
        
        return reportData;
        
    } catch (error) {
        console.error('\n❌ ERRO na análise de falhas:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    analyzeFailures()
        .then(() => {
            console.log('\n✅ Análise de falhas concluída com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Análise de falhas falhou:', error);
            process.exit(1);
        });
}

module.exports = { analyzeFailures };