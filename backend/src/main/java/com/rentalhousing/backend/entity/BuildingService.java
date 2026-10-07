package com.rentalhousing.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "building_services",
        indexes = {
                @Index(
                        name = "idx_building_services_building_service",
                        columnList = "building_id,service_id"
                )
        }
)
public class BuildingService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_method", nullable = false)
    private Service.CalculationMethod calculationMethod;

    @Column(nullable = false)
    private long price;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    public BuildingService() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Building getBuilding() {
        return building;
    }

    public void setBuilding(Building building) {
        this.building = building;
    }

    public Service getService() {
        return service;
    }

    public void setService(Service service) {
        this.service = service;
    }

    public Service.CalculationMethod getCalculationMethod() {
        return calculationMethod;
    }

    public void setCalculationMethod(Service.CalculationMethod calculationMethod) {
        this.calculationMethod = calculationMethod;
    }

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }
}
