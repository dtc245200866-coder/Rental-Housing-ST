package com.rentalhousing.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_renewals", indexes = {
        @Index(name = "idx_contract_renewals_contract", columnList = "contract_id")
})
public class ContractRenewal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "old_end_date", nullable = false)
    private LocalDate oldEndDate;

    @Column(name = "new_end_date", nullable = false)
    private LocalDate newEndDate;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(nullable = false)
    private long rent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renewed_by")
    private User renewedBy;

    @Column(name = "renewed_at", nullable = false)
    private LocalDateTime renewedAt;

    public ContractRenewal() {
    }

    public Long getId() {
        return id;
    }

    public Contract getContract() {
        return contract;
    }

    public void setContract(Contract contract) {
        this.contract = contract;
    }

    public LocalDate getOldEndDate() {
        return oldEndDate;
    }

    public void setOldEndDate(LocalDate oldEndDate) {
        this.oldEndDate = oldEndDate;
    }

    public LocalDate getNewEndDate() {
        return newEndDate;
    }

    public void setNewEndDate(LocalDate newEndDate) {
        this.newEndDate = newEndDate;
    }

    public int getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(int termMonths) {
        this.termMonths = termMonths;
    }

    public long getRent() {
        return rent;
    }

    public void setRent(long rent) {
        this.rent = rent;
    }

    public User getRenewedBy() {
        return renewedBy;
    }

    public void setRenewedBy(User renewedBy) {
        this.renewedBy = renewedBy;
    }

    public LocalDateTime getRenewedAt() {
        return renewedAt;
    }

    public void setRenewedAt(LocalDateTime renewedAt) {
        this.renewedAt = renewedAt;
    }
}
