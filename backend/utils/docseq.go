package utils

import (
	"errors"
	"fmt"
	"time"

	"logikraf-export/backend/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// NextSequence menghasilkan nomor urut per tipe & periode (YYYYMM) secara aman.
func NextSequence(db *gorm.DB, docType string, period string) (uint, error) {
	var s models.DocSequence
	err := db.Transaction(func(tx *gorm.DB) error {
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("type = ? AND period = ?", docType, period).
			First(&s).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				s = models.DocSequence{Type: docType, Period: period, LastNo: 1}
				return tx.Create(&s).Error
			}
			return err
		}
		s.LastNo++
		return tx.Model(&s).Update("last_no", s.LastNo).Error
	})
	if err != nil {
		return 0, err
	}
	return s.LastNo, nil
}

// OrderNo — ORD-202609-0001
func OrderNo(db *gorm.DB) (string, error) {
	period := time.Now().Format("200601")
	n, err := NextSequence(db, "ORD", period)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ORD-%s-%04d", period, n), nil
}

// DocNo — PI-202609-0001 (tipe = PI|CI|PL|SI|PEB)
func DocNo(db *gorm.DB, docType string) (string, error) {
	period := time.Now().Format("200601")
	n, err := NextSequence(db, docType, period)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%04d", docType, period, n), nil
}
