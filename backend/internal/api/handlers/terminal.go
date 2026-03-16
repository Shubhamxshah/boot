package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/creack/pty"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"nhooyr.io/websocket"
)

type TerminalHandler struct {
	BaseDir string
}

func NewTerminalHandler(baseDir string) *TerminalHandler {
	return &TerminalHandler{BaseDir: baseDir}
}

type terminalMsg struct {
	Type string `json:"type"`
	Cols uint16 `json:"cols"`
	Rows uint16 `json:"rows"`
}

// WS opens a WebSocket-backed PTY shell in the user's home directory.
// GET /api/v1/terminal/ws
func (h *TerminalHandler) WS(c *gin.Context) {
	userID := c.GetString("user_id")
	userDir := filepath.Join(h.BaseDir, userID)

	if err := os.MkdirAll(userDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to init user dir"})
		return
	}

	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true, // CORS is handled by middleware
	})
	if err != nil {
		log.Error().Err(err).Msg("websocket accept failed")
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	ctx := context.Background()

	cmd := exec.Command("/bin/bash", "--login")
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"COLORTERM=truecolor",
		"HOME="+userDir,
		"USER=infinity",
		"SHELL=/bin/bash",
		"PS1=\\u@infinity:\\w\\$ ",
	)
	cmd.Dir = userDir

	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Error().Err(err).Msg("pty start failed")
		conn.Write(ctx, websocket.MessageText, []byte("failed to start shell\r\n"))
		conn.Close(websocket.StatusInternalError, "pty failed")
		return
	}
	defer func() {
		ptmx.Close()
		cmd.Process.Kill()
	}()

	// pty output → websocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				if writeErr := conn.Write(ctx, websocket.MessageBinary, buf[:n]); writeErr != nil {
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	// websocket input → pty
	for {
		msgType, data, err := conn.Read(ctx)
		if err != nil {
			break
		}
		if msgType == websocket.MessageText {
			// Handle resize: {"type":"resize","cols":80,"rows":24}
			var msg terminalMsg
			if json.Unmarshal(data, &msg) == nil && msg.Type == "resize" && msg.Cols > 0 && msg.Rows > 0 {
				pty.Setsize(ptmx, &pty.Winsize{Cols: msg.Cols, Rows: msg.Rows})
			}
		} else {
			ptmx.Write(data)
		}
	}
}
