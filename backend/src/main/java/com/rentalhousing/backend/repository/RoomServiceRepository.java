package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.RoomService;
import com.rentalhousing.backend.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomServiceRepository extends JpaRepository<RoomService, Long> {

    List<RoomService> findByRoom(Room room);

    Optional<RoomService> findByRoomAndService(Room room, Service service);

    void deleteByRoom(Room room);
}
