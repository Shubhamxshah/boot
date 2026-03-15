package ports

import (
	"fmt"
	"sync"
)

const (
	minPort = 49152
	maxPort = 65535
)

// Allocator is a thread-safe port allocator for the ephemeral port range.
type Allocator struct {
	mu   sync.Mutex
	used map[int]bool
	next int
}

// NewAllocator creates a new Allocator.
func NewAllocator() *Allocator {
	return &Allocator{
		used: make(map[int]bool),
		next: minPort,
	}
}

// Allocate returns the next available port in the range [minPort, maxPort].
func (a *Allocator) Allocate() (int, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Linear scan from next pointer, wrap around once
	start := a.next
	for {
		if !a.used[a.next] {
			port := a.next
			a.used[port] = true
			a.next = port + 1
			if a.next > maxPort {
				a.next = minPort
			}
			return port, nil
		}
		a.next++
		if a.next > maxPort {
			a.next = minPort
		}
		if a.next == start {
			return 0, fmt.Errorf("no available ports in range %d-%d", minPort, maxPort)
		}
	}
}

// Release marks a port as available again.
func (a *Allocator) Release(port int) {
	if port < minPort || port > maxPort {
		return
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	delete(a.used, port)
}

// IsInUse returns true if the port is currently allocated.
func (a *Allocator) IsInUse(port int) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.used[port]
}

// UsedCount returns the number of currently allocated ports.
func (a *Allocator) UsedCount() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return len(a.used)
}
