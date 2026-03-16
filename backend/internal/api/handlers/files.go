package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

type FileHandler struct {
	BaseDir string // e.g. /data/users
}

func NewFileHandler(baseDir string) *FileHandler {
	return &FileHandler{BaseDir: baseDir}
}

type FileEntry struct {
	Name    string    `json:"name"`
	IsDir   bool      `json:"is_dir"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"mod_time"`
	Path    string    `json:"path"` // relative path from user root
}

func (h *FileHandler) userDir(userID string) string {
	return filepath.Join(h.BaseDir, userID)
}

// safePath resolves a user-relative path and ensures it stays within the user's directory.
func (h *FileHandler) safePath(userID, relPath string) (string, error) {
	base := h.userDir(userID)
	if err := os.MkdirAll(base, 0755); err != nil {
		return "", err
	}
	clean := filepath.Clean("/" + relPath)
	full := filepath.Join(base, clean)
	// Prevent path traversal
	if full != base && !strings.HasPrefix(full, base+string(filepath.Separator)) {
		return "", os.ErrPermission
	}
	return full, nil
}

// List lists directory contents.
// GET /api/v1/files?path=
func (h *FileHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	relPath := c.DefaultQuery("path", "/")

	fullPath, err := h.safePath(userID, relPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid path"})
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "path not found"})
		} else {
			log.Error().Err(err).Str("path", fullPath).Msg("list dir failed")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list directory"})
		}
		return
	}

	files := make([]FileEntry, 0, len(entries))
	for _, e := range entries {
		info, err := e.Info()
		if err != nil {
			continue
		}
		entryRel := filepath.ToSlash(filepath.Join(relPath, e.Name()))
		files = append(files, FileEntry{
			Name:    e.Name(),
			IsDir:   e.IsDir(),
			Size:    info.Size(),
			ModTime: info.ModTime(),
			Path:    entryRel,
		})
	}

	c.JSON(http.StatusOK, gin.H{"files": files, "path": relPath})
}

// Download serves a file for download.
// GET /api/v1/files/download?path=
func (h *FileHandler) Download(c *gin.Context) {
	userID := c.GetString("user_id")
	relPath := c.Query("path")
	if relPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path required"})
		return
	}

	fullPath, err := h.safePath(userID, relPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid path"})
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil || info.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	c.FileAttachment(fullPath, filepath.Base(fullPath))
}

// Upload uploads a file into a directory.
// POST /api/v1/files/upload?path=  (multipart form field: "file")
func (h *FileHandler) Upload(c *gin.Context) {
	userID := c.GetString("user_id")
	relDir := c.DefaultQuery("path", "/")

	fullDir, err := h.safePath(userID, relDir)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid path"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}
	defer file.Close()

	destPath := filepath.Join(fullDir, filepath.Base(header.Filename))
	base := h.userDir(userID)
	if !strings.HasPrefix(destPath, base) {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid destination"})
		return
	}

	out, err := os.Create(destPath)
	if err != nil {
		log.Error().Err(err).Msg("create upload file failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		log.Error().Err(err).Msg("write upload file failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "uploaded", "name": header.Filename})
}

// Mkdir creates a directory.
// POST /api/v1/files/mkdir  body: { "path": string }
func (h *FileHandler) Mkdir(c *gin.Context) {
	userID := c.GetString("user_id")
	var body struct {
		Path string `json:"path" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path required"})
		return
	}

	fullPath, err := h.safePath(userID, body.Path)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid path"})
		return
	}

	if err := os.MkdirAll(fullPath, 0755); err != nil {
		log.Error().Err(err).Msg("mkdir failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "created"})
}

// Delete deletes a file or directory.
// DELETE /api/v1/files?path=
func (h *FileHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	relPath := c.Query("path")
	if relPath == "" || relPath == "/" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete root"})
		return
	}

	fullPath, err := h.safePath(userID, relPath)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid path"})
		return
	}

	if err := os.RemoveAll(fullPath); err != nil {
		log.Error().Err(err).Msg("delete failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Rename renames or moves a file/directory.
// POST /api/v1/files/rename  body: { "from": string, "to": string }
func (h *FileHandler) Rename(c *gin.Context) {
	userID := c.GetString("user_id")
	var body struct {
		From string `json:"from" binding:"required"`
		To   string `json:"to" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to required"})
		return
	}

	fromPath, err := h.safePath(userID, body.From)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid from path"})
		return
	}

	toPath, err := h.safePath(userID, body.To)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid to path"})
		return
	}

	if err := os.Rename(fromPath, toPath); err != nil {
		log.Error().Err(err).Msg("rename failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to rename"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "renamed"})
}
