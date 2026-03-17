package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	dockerclient "github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
	db "github.com/infinityos/backend/db/generated"
	"github.com/infinityos/backend/internal/api/middleware"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog/log"
	"nhooyr.io/websocket"
)

type TerminalHandler struct {
	queries      *db.Queries
	dockerClient *dockerclient.Client
}

func NewTerminalHandler(queries *db.Queries, dockerClient *dockerclient.Client) *TerminalHandler {
	return &TerminalHandler{
		queries:      queries,
		dockerClient: dockerClient,
	}
}

type terminalMsg struct {
	Type string `json:"type"`
	Cols uint16 `json:"cols"`
	Rows uint16 `json:"rows"`
}

// WS opens a WebSocket-backed PTY shell inside the user's session container.
// The shell runs inside the container so it cannot access other users' data.
// GET /api/v1/terminal/ws?session_id=<uuid>
func (h *TerminalHandler) WS(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString(middleware.CtxUserID))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	sessionID, err := uuid.Parse(c.Query("session_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id required"})
		return
	}

	ctx := c.Request.Context()
	s, err := h.queries.GetSessionByID(ctx, sessionID)
	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	// Ownership check — a user can only exec into their own session
	if s.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	if s.Status != "ready" || !s.ContainerID.Valid || s.ContainerID.String == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session not ready"})
		return
	}

	containerID := s.ContainerID.String

	conn, err := websocket.Accept(c.Writer, c.Request, &websocket.AcceptOptions{
		InsecureSkipVerify: true, // CORS is handled by middleware
	})
	if err != nil {
		log.Error().Err(err).Msg("websocket accept failed")
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	wsCtx := context.Background()

	execID, err := h.dockerClient.ContainerExecCreate(wsCtx, containerID, types.ExecConfig{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		Cmd:          []string{"/bin/bash", "--login"},
		WorkingDir:   "/userdata",
	})
	if err != nil {
		log.Error().Err(err).Str("container_id", containerID).Msg("exec create failed")
		conn.Write(wsCtx, websocket.MessageText, []byte("failed to start shell\r\n"))
		conn.Close(websocket.StatusInternalError, "exec failed")
		return
	}

	execAttach, err := h.dockerClient.ContainerExecAttach(wsCtx, execID.ID, types.ExecStartCheck{Tty: true})
	if err != nil {
		log.Error().Err(err).Msg("exec attach failed")
		conn.Write(wsCtx, websocket.MessageText, []byte("failed to attach shell\r\n"))
		conn.Close(websocket.StatusInternalError, "attach failed")
		return
	}
	defer execAttach.Close()

	// container output → websocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := execAttach.Reader.Read(buf)
			if n > 0 {
				if writeErr := conn.Write(wsCtx, websocket.MessageBinary, buf[:n]); writeErr != nil {
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	// websocket input → container
	for {
		msgType, data, err := conn.Read(wsCtx)
		if err != nil {
			break
		}
		if msgType == websocket.MessageText {
			var msg terminalMsg
			if json.Unmarshal(data, &msg) == nil && msg.Type == "resize" && msg.Cols > 0 && msg.Rows > 0 {
				h.dockerClient.ContainerExecResize(wsCtx, execID.ID, container.ResizeOptions{
					Height: uint(msg.Rows),
					Width:  uint(msg.Cols),
				})
			}
		} else {
			execAttach.Conn.Write(data)
		}
	}
}
