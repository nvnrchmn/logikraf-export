package utils

import (
	"errors"
	"time"
)

var errDateInvalid = errors.New("format tanggal tidak valid (gunakan YYYY-MM-DD)")

// ParseFlexDate menerima "2006-01-02", RFC3339, atau "2006-01-02 15:04"; string kosong -> nil.
func ParseFlexDate(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	for _, layout := range []string{"2006-01-02", time.RFC3339, "2006-01-02 15:04"} {
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return &t, nil
		}
	}
	return nil, errDateInvalid
}
