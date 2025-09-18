// Script para atualizar o arquivo models.json com modelos mais recentes
// Busca todos os modelos disponíveis na API GitHub Copilot e atualiza models.json
// Usado para manter a lista de modelos sempre atualizada

const fs = require('fs');
const path = require('path');

console.log('🔄 Script de Atualização dos Modelos GitHub Copilot');
console.log('===================================================\n');

async function updateModelsFile() {
    try {
        // 1. Carregar token
        console.log('🔑 Carregando token...');
        const token = fs.readFileSync('./.token', 'utf8').trim();
        
        if (!token.startsWith('gho_')) {
            throw new Error('❌ Token deve ser um GitHub Copilot token (formato: gho_*)');
        }
        console.log(`✅ Token carregado: ${token.substring(0, 10)}...`);
        
        // 2. Carregar arquivo models.json atual para comparação
        let currentModels = {};
        try {
            const currentData = JSON.parse(fs.readFileSync('./models.json', 'utf8'));
            currentModels = currentData;
            console.log(`📋 Arquivo models.json atual: ${currentModels.data?.length || 0} modelos`);
        } catch (error) {
            console.log('⚠️ Arquivo models.json não encontrado, será criado novo');
        }
        
        // 3. Buscar modelos da API
        console.log('\n🌐 Buscando modelos da API GitHub Copilot...');
        
        const response = await fetch('https://api.githubcopilot.com/models', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Agent': 'n8n-nodes-copilot/1.0.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`❌ Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const newData = await response.json();
        console.log(`✅ API respondeu: ${newData.data?.length || 0} modelos encontrados`);
        
        // 4. Analisar diferenças
        console.log('\n📊 Analisando mudanças...');
        
        const oldModels = currentModels.data || [];
        const newModels = newData.data || [];
        
        // Criar mapas para comparação
        const oldMap = new Map(oldModels.map(m => [m.id, m]));
        const newMap = new Map(newModels.map(m => [m.id, m]));
        
        // Encontrar mudanças
        const added = newModels.filter(m => !oldMap.has(m.id));
        const removed = oldModels.filter(m => !newMap.has(m.id));
        const updated = newModels.filter(m => {
            const old = oldMap.get(m.id);
            return old && JSON.stringify(old) !== JSON.stringify(m);
        });
        
        console.log(`📈 Modelos adicionados: ${added.length}`);
        console.log(`📉 Modelos removidos: ${removed.length}`);
        console.log(`🔄 Modelos atualizados: ${updated.length}`);
        
        // 5. Mostrar detalhes das mudanças
        if (added.length > 0) {
            console.log('\n➕ NOVOS MODELOS:');
            added.forEach(model => {
                console.log(`   • ${model.id} - ${model.name} (${model.vendor})`);
                console.log(`     └ Enabled: ${model.model_picker_enabled !== false ? 'Sim' : 'Não'}`);
            });
        }
        
        if (removed.length > 0) {
            console.log('\n➖ MODELOS REMOVIDOS:');
            removed.forEach(model => {
                console.log(`   • ${model.id} - ${model.name} (${model.vendor})`);
            });
        }
        
        if (updated.length > 0) {
            console.log('\n🔄 MODELOS ATUALIZADOS:');
            updated.forEach(model => {
                const old = oldMap.get(model.id);
                console.log(`   • ${model.id} - ${model.name}`);
                
                // Verificar mudanças específicas
                if (old.model_picker_enabled !== model.model_picker_enabled) {
                    console.log(`     └ Enabled: ${old.model_picker_enabled} → ${model.model_picker_enabled}`);
                }
                if (old.name !== model.name) {
                    console.log(`     └ Nome: ${old.name} → ${model.name}`);
                }
                if (old.vendor !== model.vendor) {
                    console.log(`     └ Vendor: ${old.vendor} → ${model.vendor}`);
                }
            });
        }
        
        // 6. Estatísticas por provider
        console.log('\n📋 ESTATÍSTICAS POR PROVIDER:');
        const byProvider = {};
        newModels.forEach(model => {
            if (!byProvider[model.vendor]) {
                byProvider[model.vendor] = { total: 0, enabled: 0 };
            }
            byProvider[model.vendor].total++;
            if (model.model_picker_enabled !== false) {
                byProvider[model.vendor].enabled++;
            }
        });
        
        Object.keys(byProvider).sort().forEach(provider => {
            const stats = byProvider[provider];
            console.log(`   ${provider}: ${stats.enabled}/${stats.total} habilitados`);
        });
        
        // 7. Backup do arquivo atual
        if (currentModels.data && currentModels.data.length > 0) {
            const backupFile = `./models.json.backup.${Date.now()}`;
            fs.writeFileSync(backupFile, JSON.stringify(currentModels, null, 2));
            console.log(`\n💾 Backup criado: ${backupFile}`);
        }
        
        // 8. Adicionar metadados ao novo arquivo
        const updatedData = {
            ...newData,
            metadata: {
                updated_at: new Date().toISOString(),
                updated_by: 'scripts/update-models.js',
                token_prefix: token.substring(0, 10) + '...',
                total_models: newModels.length,
                enabled_models: newModels.filter(m => m.model_picker_enabled !== false).length,
                providers: Object.keys(byProvider).sort(),
                changes: {
                    added: added.length,
                    removed: removed.length,
                    updated: updated.length
                }
            }
        };
        
        // 9. Salvar arquivo atualizado
        fs.writeFileSync('./models.json', JSON.stringify(updatedData, null, 2));
        console.log('\n✅ Arquivo models.json atualizado com sucesso!');
        
        // 10. Salvar relatório detalhado
        const reportData = {
            timestamp: new Date().toISOString(),
            previous_count: oldModels.length,
            new_count: newModels.length,
            changes: {
                added: added.map(m => ({ id: m.id, name: m.name, vendor: m.vendor })),
                removed: removed.map(m => ({ id: m.id, name: m.name, vendor: m.vendor })),
                updated: updated.map(m => ({ id: m.id, name: m.name, vendor: m.vendor }))
            },
            providers: byProvider
        };
        
        fs.writeFileSync('./results/models-update-report.json', JSON.stringify(reportData, null, 2));
        console.log('📄 Relatório salvo em: ./results/models-update-report.json');
        
        // 11. Resumo final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMO DA ATUALIZAÇÃO');
        console.log('='.repeat(50));
        console.log(`📋 Total de modelos: ${newModels.length}`);
        console.log(`✅ Modelos habilitados: ${newModels.filter(m => m.model_picker_enabled !== false).length}`);
        console.log(`🏢 Providers: ${Object.keys(byProvider).length}`);
        console.log(`📈 Mudanças: +${added.length} -${removed.length} ~${updated.length}`);
        
        if (added.length === 0 && removed.length === 0 && updated.length === 0) {
            console.log('✨ Nenhuma mudança detectada - arquivo já está atualizado!');
        } else {
            console.log('🎉 Arquivo models.json atualizado com sucesso!');
        }
        
        return updatedData;
        
    } catch (error) {
        console.error('\n❌ ERRO na atualização:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    updateModelsFile()
        .then(() => {
            console.log('\n✅ Script concluído com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Script falhou:', error);
            process.exit(1);
        });
}

module.exports = { updateModelsFile };