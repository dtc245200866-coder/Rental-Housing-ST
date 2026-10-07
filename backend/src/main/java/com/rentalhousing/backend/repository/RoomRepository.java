package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Building;
import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByBuilding(Building building);

    List<Room> findByBuildingAndFloor(Building building, int floor);

    List<Room> findByBuilding_Landlord(User landlord);

    List<Room> findByBuilding_Manager(User manager);

    List<Room> findByBuilding_LandlordAndFloor(User landlord, int floor);

    List<Room> findByBuilding_ManagerAndFloor(User manager, int floor);

    boolean existsByBuildingAndCode(Building building, String code);

    List<Room> findByBuildingOrderByFloorAscCodeAsc(Building building);

    List<Room> findByStatus(Room.Status status);

    List<Room> findByBuildingAndStatus(Building building, Room.Status status);

    long countByBuilding(Building building);

    long countByBuildingAndStatus(Building building, Room.Status status);
}
