package com.rentalhousing.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "meter_readings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_meter_reading", columnNames = {"room_id", "period"})
        },
        indexes = {
                @Index(name = "idx_meter_readings_room_period", columnList = "room_id,period")
        }
)
public class MeterReading {

    public enum Status {
        PENDING,
        FINALIZED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    /** Kỳ hoá đơn, định dạng yyyy-MM */
    @Column(nullable = false, length = 7)
    private String period;

    @Column(name = "prev_electric", nullable = false)
    private long prevElectric;

    @Column(name = "current_electric", nullable = false)
    private long currentElectric;

    @Column(name = "prev_water", nullable = false)
    private long prevWater;

    @Column(name = "current_water", nullable = false)
    private long currentWater;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    public MeterReading() {
    }

    public long getElectricConsumption() {
        return currentElectric - prevElectric;
    }

    public long getWaterConsumption() {
        return currentWater - prevWater;
    }

    public Long getId() {
        return id;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public Contract getContract() {
        return contract;
    }

    public void setContract(Contract contract) {
        this.contract = contract;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public long getPrevElectric() {
        return prevElectric;
    }

    public void setPrevElectric(long prevElectric) {
        this.prevElectric = prevElectric;
    }

    public long getCurrentElectric() {
        return currentElectric;
    }

    public void setCurrentElectric(long currentElectric) {
        this.currentElectric = currentElectric;
    }

    public long getPrevWater() {
        return prevWater;
    }

    public void setPrevWater(long prevWater) {
        this.prevWater = prevWater;
    }

    public long getCurrentWater() {
        return currentWater;
    }

    public void setCurrentWater(long currentWater) {
        this.currentWater = currentWater;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public User getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(User recordedBy) {
        this.recordedBy = recordedBy;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
