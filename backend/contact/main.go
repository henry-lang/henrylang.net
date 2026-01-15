package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
	openai "github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
)

type Ctx struct {
	Client       *openai.Client
	SystemPrompt string
}

type Role string

const (
	RoleClient Role = "client"
	RoleServer Role = "server"
)

type ChatMessage struct {
	Role    Role   `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
}

func writeSSE(w http.ResponseWriter, flusher http.Flusher, event, data string) {
	data = strings.ReplaceAll(data, "\r\n", "\n")
	lines := strings.Split(data, "\n")

	fmt.Fprintf(w, "event: %s\n", event)
	for _, line := range lines {
		fmt.Fprintf(w, "data: %s\n", line)
	}
	fmt.Fprint(w, "\n")
	flusher.Flush()
}

func toOpenAIMessages(msgs []ChatMessage, systemPrompt string) ([]openai.ChatCompletionMessageParamUnion, error) {
	out := make([]openai.ChatCompletionMessageParamUnion, 0, len(msgs))

	out = append(out, openai.SystemMessage(systemPrompt))

	for _, m := range msgs {
		switch m.Role {
		case RoleClient:
			out = append(out, openai.UserMessage(m.Content))

		case RoleServer:
			out = append(out, openai.AssistantMessage(m.Content))
		default:
			return nil, fmt.Errorf("invalid role: %s", m.Role)
		}
	}

	return out, nil
}

func streamHandler(ctx Ctx) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}

		var body ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		if len(body.Messages) == 0 {
			http.Error(w, "messages required", http.StatusBadRequest)
			return
		}

		openAIMessages, err := toOpenAIMessages(body.Messages, ctx.SystemPrompt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// SSE headers
		w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-transform")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		writeSSE(w, flusher, "status", "connected")

		reqCtx := r.Context()
		stream := ctx.Client.Chat.Completions.NewStreaming(reqCtx, openai.ChatCompletionNewParams{
			Model:    openai.ChatModelGPT4o,
			Messages: openAIMessages,
		})
		defer stream.Close()

		for {
			if !stream.Next() {
				if err := stream.Err(); err != nil && reqCtx.Err() == nil {
					writeSSE(w, flusher, "error", err.Error())
				} else {
					writeSSE(w, flusher, "done", "ok")
				}
				return
			}

			chunk := stream.Current()
			if len(chunk.Choices) == 0 {
				continue
			}

			if delta := chunk.Choices[0].Delta.Content; delta != "" {
				writeSSE(w, flusher, "delta", delta)
			}
		}
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("OPENAI_API_KEY is not set")
	}

	systemPrompt := os.Getenv("SYSTEM_PROMPT")
	if apiKey == "" {
		log.Fatal("SYSTEM_PROMPT is not set")
	}

	client := openai.NewClient(option.WithAPIKey(apiKey))

	ctx := Ctx{
		Client:       &client,
		SystemPrompt: systemPrompt,
	}

	http.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	http.HandleFunc("/stream", streamHandler(ctx))

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
