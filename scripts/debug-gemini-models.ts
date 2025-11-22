import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not found in .env');
    process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
console.log('📋 Fetching available Gemini models...\n');

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Try to list models
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log('✅ Available models:\n');
            data.models.forEach((model: any) => {
                console.log(`  📦 ${model.name}`);
                console.log(`     Display Name: ${model.displayName}`);
                console.log(`     Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No models found in response');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error listing models:', error.message);

        // Try a test generation
        console.log('\n🧪 Testing with gemini-pro model...');
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent('Hello');
            console.log('✅ gemini-pro works!');
            console.log('Response:', result.response.text());
        } catch (testError) {
            console.error('❌ gemini-pro failed:', testError.message);
        }
    }
}

listModels();
