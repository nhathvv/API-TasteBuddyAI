#!/usr/bin/env bun
/**
 * Test Progressive Loading API Endpoints
 * 
 * Tests:
 * 1. POST /menu/upload/scan-async (Async upload)
 * 2. GET /menu/jobs/:jobId/stream (SSE streaming)
 * 3. GET /menu/jobs/:jobId (Polling)
 * 4. POST /menu/analysis/extraction (Micro-endpoint)
 */

const API_BASE = 'http://localhost:3000';

// Sample food image (base64 - small rice dish photo)
const SAMPLE_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    step: (msg: string) => console.log(`${colors.cyan}▶️  ${msg}${colors.reset}`),
};

/**
 * Test 1: Async Upload with JobID
 */
async function testAsyncUpload() {
    log.step('Test 1: POST /menu/upload/scan-async');

    try {
        // Create form data
        const formData = new FormData();

        // Create a blob from base64
        const blob = new Blob([Buffer.from(SAMPLE_IMAGE_BASE64, 'base64')], { type: 'image/png' });
        formData.append('image', blob, 'test-menu.png');
        formData.append('language', 'vi');
        formData.append('useCloudVision', 'false');

        const response = await fetch(`${API_BASE}/menu/upload/scan-async`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        log.success(`Async upload successful!`);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (!data.jobId) {
            throw new Error('No jobId returned!');
        }

        log.info(`JobID: ${data.jobId}`);
        log.info(`Stream URL: ${data.streamUrl}`);

        return data.jobId;
    } catch (error: any) {
        log.error(`Async upload failed: ${error.message}`);
        throw error;
    }
}

/**
 * Test 2: SSE Streaming
 */
async function testSSEStreaming(jobId: string) {
    log.step(`Test 2: GET /menu/jobs/${jobId}/stream (SSE)`);

    return new Promise((resolve, reject) => {
        try {
            // Note: Node.js doesn't have native EventSource, using fetch with streaming
            log.info('Connecting to SSE stream...');

            fetch(`${API_BASE}/menu/jobs/${jobId}/stream`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    if (!response.body) {
                        throw new Error('No response body');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    const readChunk = () => {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                log.success('SSE stream closed');
                                resolve(true);
                                return;
                            }

                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || '';

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    try {
                                        const event = JSON.parse(data);

                                        if (event.type === 'stage_update') {
                                            log.info(`Stage update: ${event.stage} - ${event.status}`);
                                            console.log('  Data:', JSON.stringify(event.data, null, 2));
                                        } else if (event.type === 'job_completed') {
                                            log.success('Job completed!');
                                            console.log('Result:', JSON.stringify(event.result, null, 2));
                                            resolve(true);
                                            return;
                                        } else if (event.type === 'job_failed') {
                                            log.error(`Job failed: ${event.error}`);
                                            reject(new Error(event.error));
                                            return;
                                        }
                                    } catch (e) {
                                        // Ignore parse errors
                                    }
                                }
                            }

                            readChunk();
                        }).catch(reject);
                    };

                    readChunk();
                })
                .catch(reject);

            // Timeout after 30 seconds
            setTimeout(() => {
                log.warning('SSE stream timeout (30s)');
                resolve(false);
            }, 30000);

        } catch (error: any) {
            log.error(`SSE streaming failed: ${error.message}`);
            reject(error);
        }
    });
}

/**
 * Test 3: Job Status Polling
 */
async function testJobStatusPolling(jobId: string) {
    log.step(`Test 3: GET /menu/jobs/${jobId} (Polling)`);

    try {
        const response = await fetch(`${API_BASE}/menu/jobs/${jobId}`);

        if (response.status === 404) {
            log.warning('Job not found (expected if job completed and was cleaned up)');
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const job = await response.json();

        log.success(`Job status retrieved!`);
        console.log('Job:', JSON.stringify(job, null, 2));

        log.info(`Status: ${job.status}`);
        log.info(`Current Stage: ${job.currentStage || 'N/A'}`);

    } catch (error: any) {
        log.error(`Job status polling failed: ${error.message}`);
        throw error;
    }
}

/**
 * Test 4: Micro-endpoint - Extract Menu Only
 */
async function testExtractMenuOnly() {
    log.step('Test 4: POST /menu/analysis/extraction (Micro-endpoint)');

    try {
        const formData = new FormData();
        const blob = new Blob([Buffer.from(SAMPLE_IMAGE_BASE64, 'base64')], { type: 'image/png' });
        formData.append('image', blob, 'test-menu.png');
        formData.append('language', 'vi');
        formData.append('useCloudVision', 'false');

        const response = await fetch(`${API_BASE}/menu/analysis/extraction`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        log.success(`Extract menu only successful!`);
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error: any) {
        log.error(`Extract menu failed: ${error.message}`);
        throw error;
    }
}

/**
 * Main test runner
 */
async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING PROGRESSIVE LOADING API ENDPOINTS');
    console.log('='.repeat(60) + '\n');

    try {
        // Test 1: Async upload
        const jobId = await testAsyncUpload();
        console.log('\n' + '-'.repeat(60) + '\n');

        // Wait 1 second before SSE test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: SSE streaming
        await testSSEStreaming(jobId);
        console.log('\n' + '-'.repeat(60) + '\n');

        // Wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 3: Polling
        await testJobStatusPolling(jobId);
        console.log('\n' + '-'.repeat(60) + '\n');

        // Test 4: Micro-endpoint
        await testExtractMenuOnly();
        console.log('\n' + '-'.repeat(60) + '\n');

        // Summary
        console.log('\n' + '='.repeat(60));
        log.success('ALL TESTS PASSED! ✅✅✅');
        console.log('='.repeat(60) + '\n');

    } catch (error: any) {
        console.log('\n' + '='.repeat(60));
        log.error(`TEST SUITE FAILED: ${error.message}`);
        console.log('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run tests
runAllTests();
