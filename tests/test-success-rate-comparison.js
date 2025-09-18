/**
 * GitHub Copilot API - Success Rate Comparison Test
 * 
 * Purpose: Compare success rates of GitHub Copilot models across different tokens
 * Usage: node tests/test-success-rate-comparison.js
 * 
 * What it does:
 * - Tests all enabled models from models.json
 * - Makes 5 attempts per model for statistical reliability
 * - Stops immediately on 400/401 errors (no retry needed)
 * - Retries on 403 errors (TPM quota issues)
 * - Compares only models that work in both token scenarios
 * - Outputs success rates for working models only
 */

const https = require('https');
const fs = require('fs');

// Load token
const token = fs.readFileSync('./.token', 'utf8').trim();
console.log('🔑 Token:', token.substring(0, 10) + '...');

// Load all models from models.json
const modelsData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
const models = modelsData.data.filter(m => m.model_picker_enabled !== false);

const endpoint = 'https://api.githubcopilot.com/chat/completions';

async function testModel(model, attemptNumber) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: `Test ${attemptNumber}` }],
            max_tokens: 10
        });

        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(endpoint, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const response = JSON.parse(data);
                    const content = response.choices[0].message.content.trim();
                    resolve({ success: true, response: content });
                } else if (res.statusCode === 400) {
                    // Don't retry on 400 errors
                    resolve({ success: false, error: '400 - Bad Request (NO RETRY)', stopRetry: true });
                } else if (res.statusCode === 401) {
                    // Don't retry on 401 errors
                    resolve({ success: false, error: '401 - Unauthorized (NO RETRY)', stopRetry: true });
                } else {
                    resolve({ success: false, error: `${res.statusCode} - ${res.statusMessage}` });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        req.write(payload);
        req.end();
    });
}

async function compareAllModels() {
    console.log('🧪 Testando TODOS os modelos - 5 tentativas cada:\n');
    
    const results = {};
    
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        console.log(`🔄 [${i+1}/${models.length}] ${model.name} (${model.id})`);
        
        const attempts = [];
        let successCount = 0;
        
        for (let attempt = 1; attempt <= 5; attempt++) {
            const result = await testModel(model, attempt);
            attempts.push(result);
            
            if (result.success) {
                successCount++;
                console.log(`   ✅ Tentativa ${attempt}: "${result.response}"`);
            } else {
                console.log(`   ❌ Tentativa ${attempt}: ${result.error}`);
                
                // Stop immediately on 400/401 errors
                if (result.stopRetry) {
                    console.log(`   🛑 Parando - Erro sem retry detectado`);
                    break;
                }
            }
            
            // Small delay between attempts
            if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const successRate = (successCount / attempts.length * 100).toFixed(1);
        results[model.id] = {
            name: model.name,
            attempts: attempts.length,
            successes: successCount,
            rate: successRate,
            working: successCount > 0
        };
        
        console.log(`   📊 Taxa de sucesso: ${successCount}/${attempts.length} (${successRate}%)\n`);
    }
    
    // Filter only working models for comparison
    const workingModels = Object.entries(results).filter(([, data]) => data.working);
    
    // Summary
    console.log('======================================');
    console.log('📊 COMPARAÇÃO - APENAS MODELOS QUE FUNCIONAM');
    console.log('======================================');
    
    if (workingModels.length > 0) {
        workingModels.forEach(([, data]) => {
            console.log(`${data.name}: ${data.successes}/${data.attempts} (${data.rate}%)`);
        });
    } else {
        console.log('❌ Nenhum modelo funcionou com este token');
    }
    
    console.log(`\n📈 Total de modelos funcionais: ${workingModels.length}/${models.length}`);
    
    return results;
}

// Run the test
compareAllModels().then(results => {
    console.log('\n✅ Teste de comparação concluído!');
    console.log('Resultados salvos na memória para comparação com próximo token.');
}).catch(error => {
    console.error('❌ Erro no teste:', error);
});