/**
 * Script para testar manualmente o endpoint de Speech/Transcrição
 * 
 * USO:
 *   1. Exporte seu token: set GITHUB_TOKEN=ghu_xxx
 *   2. Execute: npx ts-node scripts/test-speech-manual.ts
 */

import * as https from 'https';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
    console.error('❌ Defina GITHUB_TOKEN no ambiente');
    console.log('   Windows: set GITHUB_TOKEN=ghu_xxxx');
    console.log('   Linux:   export GITHUB_TOKEN=ghu_xxxx');
    process.exit(1);
}

// Gerar áudio WAV simples (silêncio de 1 segundo)
function generateTestWav(): Buffer {
    const sampleRate = 16000;
    const duration = 1; // 1 segundo
    const numSamples = sampleRate * duration;
    const bytesPerSample = 2; // 16-bit PCM
    const dataSize = numSamples * bytesPerSample;
    const fileSize = 36 + dataSize;

    const buffer = Buffer.alloc(44 + dataSize);
    let offset = 0;

    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // fmt chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // fmt chunk size
    buffer.writeUInt16LE(1, offset); offset += 2;  // PCM format
    buffer.writeUInt16LE(1, offset); offset += 2;  // mono
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(sampleRate * bytesPerSample, offset); offset += 4; // byte rate
    buffer.writeUInt16LE(bytesPerSample, offset); offset += 2; // block align
    buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample

    // data chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    // Gerar tom de 440Hz (A4) para ser detectável
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 16000;
        buffer.writeInt16LE(Math.round(sample), offset);
        offset += 2;
    }

    return buffer;
}

// Obter OAuth token do GitHub Copilot
async function getOAuthToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/copilot_internal/v2/token',
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'n8n-copilot-test/1.0',
                'Accept': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(data);
                    resolve(json.token);
                } else {
                    reject(new Error(`OAuth falhou: ${res.statusCode} - ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// Testar endpoint de Speech
async function testSpeechEndpoint(oauthToken: string, audioBuffer: Buffer): Promise<void> {
    const endpoints = [
        'https://speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1',
        'https://speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1',
        'https://speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1',
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testando: ${endpoint}`);
        
        await new Promise<void>((resolve) => {
            const url = new URL(endpoint);
            const options = {
                hostname: url.hostname,
                path: url.pathname + '?language=pt-BR&format=simple',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${oauthToken}`,
                    'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                    'User-Agent': 'GitHub-Copilot/1.0 (n8n-test)',
                    'Accept': 'application/json',
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
                    console.log(`   Body: ${data || '(vazio)'}`);
                    
                    if (res.statusCode === 429) {
                        console.log('   ⚠️ RATE LIMITED - Limite de requests atingido');
                        const retryAfter = res.headers['retry-after'];
                        if (retryAfter) {
                            const hours = Math.round(parseInt(retryAfter) / 3600);
                            console.log(`   ⏰ Retry após: ${hours} horas`);
                        }
                    } else if (res.statusCode === 200) {
                        if (data && data.trim()) {
                            console.log('   ✅ SUCESSO - Transcrição recebida!');
                        } else {
                            console.log('   ⚠️ HTTP 200 mas resposta vazia');
                        }
                    }
                    resolve();
                });
            });

            req.on('error', (err) => {
                console.log(`   ❌ Erro: ${err.message}`);
                resolve();
            });

            req.write(audioBuffer);
            req.end();
        });
    }
}

// Testar endpoint OpenAI Whisper (que o Copilot NÃO suporta)
async function testWhisperEndpoint(oauthToken: string, audioBuffer: Buffer): Promise<void> {
    console.log('\n🔍 Testando OpenAI Whisper (endpoint que Copilot NÃO suporta):');
    console.log('   https://api.githubcopilot.com/audio/transcriptions');
    
    await new Promise<void>((resolve) => {
        const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
        
        // Construir multipart/form-data
        const parts: Buffer[] = [];
        
        // Campo 'file'
        parts.push(Buffer.from(`--${boundary}\r\n`));
        parts.push(Buffer.from('Content-Disposition: form-data; name="file"; filename="test.wav"\r\n'));
        parts.push(Buffer.from('Content-Type: audio/wav\r\n\r\n'));
        parts.push(audioBuffer);
        parts.push(Buffer.from('\r\n'));
        
        // Campo 'model'
        parts.push(Buffer.from(`--${boundary}\r\n`));
        parts.push(Buffer.from('Content-Disposition: form-data; name="model"\r\n\r\n'));
        parts.push(Buffer.from('whisper-1\r\n'));
        
        // Finalizar
        parts.push(Buffer.from(`--${boundary}--\r\n`));
        
        const body = Buffer.concat(parts);

        const options = {
            hostname: 'api.githubcopilot.com',
            path: '/audio/transcriptions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${oauthToken}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'User-Agent': 'GitHub-Copilot/1.0',
                'Editor-Version': 'vscode/1.95.0',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Body: ${data || '(vazio)'}`);
                
                if (res.statusCode === 404) {
                    console.log('   ❌ Confirmado: Endpoint Whisper NÃO existe no Copilot API');
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.log(`   ❌ Erro: ${err.message}`);
            resolve();
        });

        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('=' .repeat(60));
    console.log('🎤 GitHub Copilot Speech/Transcription Test');
    console.log('=' .repeat(60));
    
    try {
        console.log('\n📝 Passo 1: Obtendo OAuth Token...');
        const oauthToken = await getOAuthToken();
        console.log(`   ✅ Token obtido: ${oauthToken.substring(0, 20)}...`);
        
        console.log('\n📝 Passo 2: Gerando áudio de teste (WAV 16kHz, 1s, tom 440Hz)...');
        const audioBuffer = generateTestWav();
        console.log(`   ✅ Áudio gerado: ${audioBuffer.length} bytes`);
        
        console.log('\n📝 Passo 3: Testando endpoints Microsoft Speech...');
        await testSpeechEndpoint(oauthToken, audioBuffer);
        
        console.log('\n📝 Passo 4: Testando endpoint Whisper (esperado: falhar)...');
        await testWhisperEndpoint(oauthToken, audioBuffer);
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESUMO:');
        console.log('   - Microsoft Speech: Acessível mas com rate limit severo');
        console.log('   - OpenAI Whisper: NÃO disponível via Copilot API');
        console.log('   - Recomendação: Use Azure Speech Services com chave dedicada');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('\n❌ Erro:', error);
    }
}

main();
