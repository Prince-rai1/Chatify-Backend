import { WebSocketServer, WebSocket as NodeWebSocket } from 'ws';
import { AICharacter } from '../models/aiCharacter.model.js';

export const initializeAiSocket = (server) => {
    const wss = new WebSocketServer({ noServer: true });
    
    server.on('upgrade', (request, socket, head) => {
        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

        if (pathname === '/api/ai-call') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    wss.on('connection', async (clientWs, req) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const characterId = url.searchParams.get('characterId');

            if (!characterId) {
                return clientWs.close(1008, "Character ID required");
            }

            const character = await AICharacter.findById(characterId);
            if (!character) {
                return clientWs.close(1008, "Character not found");
            }

            console.log(`📱 Call started with AI: ${character.name}`);

            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
            const geminiWs = new NodeWebSocket(geminiUrl);

            // 2. Setup Gemini Connection
            geminiWs.on('open', () => {
                console.log(`🤖 Gemini Connected | Voice: ${character.voice.name}`);

                const setupMessage = {
                    setup: {
                        model: "models/gemini-3.1-flash-live-preview",
                        systemInstruction: {
                            parts: [{ text: character.systemPrompt }]
                        },
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: character.voice.name
                                    }
                                }
                            }
                        }
                    }
                };
                geminiWs.send(JSON.stringify(setupMessage));
            });

            // 3. Forward Client Audio to Gemini
            clientWs.on('message', (data) => {
                if (geminiWs.readyState === NodeWebSocket.OPEN) {
                    const audioPayload = {
                        realtimeInput: {
                            audio: {
                                mimeType: "audio/pcm;rate=16000",
                                data: data.toString('base64')
                            }
                        }
                    };
                    geminiWs.send(JSON.stringify(audioPayload));
                }
            });

            // 4. Forward Gemini Audio to Client
            geminiWs.on('message', (message) => {
                const response = JSON.parse(message.toString());

                if (response.error) {
                    console.error("❌ Gemini API Error:", JSON.stringify(response.error, null, 2));
                }

                const parts = response.serverContent?.modelTurn?.parts;
                if (parts && parts.length > 0) {
                    const audioData = parts[0]?.inlineData?.data;

                    if (audioData && clientWs.readyState === NodeWebSocket.OPEN) {
                        clientWs.send(Buffer.from(audioData, 'base64'));
                    }
                }
            });

            // 5. Handle Disconnections & Errors
            geminiWs.on('close', (code, reason) => {
                console.log(`❌ Gemini Connection Closed - Code: ${code}, Reason: ${reason.toString() || "None"}`);
                clientWs.close();
            });

            geminiWs.on('error', (error) => {
                console.error("❌ Gemini WebSocket Error:", error);
            });

            clientWs.on('close', () => {
                console.log("📱 Client frontend disconnected.");
                geminiWs.close();
            });

        } catch (error) {
            console.error("AI Socket Error:", error);
            clientWs.close(1011, "Internal Server Error");
        }
    });
};