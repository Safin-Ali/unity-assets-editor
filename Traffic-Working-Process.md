# BUSSID Traffic Spawn, Speed, Type Guide

## In this docs we learn bussid traffic management process

### VehicleType ID

- Small/cars = 1,
- Truck = 2,
- Trailer = 4,
- Moto = 8,
- Truck = 0x10

### Vehicle SpeedType ID

- Small/Cars = 0,
- Bus = 1,
- Moto = 2,
- Truck = 3,
- Trailer = 4

### Vehicle SpeedGroup ID

- Mid = 0,
- Slow = 1,
- Fast = 2

### Traffic Speed Option Is

- slowCarsSpeed = 50,
- midCarsSpeed = 70,
- fastCarsSpeed = 90

```YAML
In BUSSID Traffic Spawn With Speed
Slow = 10%
Fast = 80%
Randomized = 10%
```

### Randomized / Fast Speed Vehicles

    Small 0, Bus 1, Truck 3

### Mid Speed Vehicles

    Moto 2

### Slow Speed Vehicles

    Trailer 4
