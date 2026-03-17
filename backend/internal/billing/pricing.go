package billing

import "math"

// Config holds billing rate configuration.
type Config struct {
	BaseRate  float64 // credits per minute (base)
	CPURate   float64 // credits per CPU core per minute
	MemRate   float64 // credits per GB RAM per minute
	GPURate   float64 // credits per minute (flat, when GPU enabled)
}

// CalcCostPerMinute returns the integer credit cost per minute for a given resource spec.
// Uses ceil so minimum is always 1 credit/min for any running session.
func CalcCostPerMinute(cpuCores float64, memGB int, gpuEnabled bool, cfg Config) int64 {
	cost := cfg.BaseRate + cpuCores*cfg.CPURate + float64(memGB)*cfg.MemRate
	if gpuEnabled {
		cost += cfg.GPURate
	}
	c := int64(math.Ceil(cost))
	if c < 1 {
		c = 1
	}
	return c
}
